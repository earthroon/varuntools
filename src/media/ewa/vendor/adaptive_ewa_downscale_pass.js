// app/core/compute/downscale_webgpu/adaptive_ewa_downscale_pass.js
// Commit10: Adaptive downscale = fast downscale everywhere + EWA on "high-detail" tiles.
// Contract: consumes {tex,width,height} and produces {tex,width,height}.
//
// Internals:
//  1) tilemask_from_qmap (from input tex) -> maskTex
//  2) fast downscale (box/bilinear) -> fastTex (dst)
//  3) adaptive EWA: if tileMask==0 => copy from fastTex, else EWA taps on srcTex.

import { makeTexture, makeBuffer } from '../../../webgpu_resource_factory.js';
import { createTileMaskFromQmapPass } from './tilemask_from_qmap_pass.js';
import { createDownscalePass } from './downscale_pass.js';
import { createQmapLodMeanMaxMixPass } from './qmap_lod_meanmax_mix_pass.js';

async function fetchWGSL(url) {
  return await (await fetch(url)).text();
}

function _clamp01(x) {
  return Math.max(0.0, Math.min(1.0, x));
}

// Commit20: Curve mapping for how qThreshold influences Qmap-LOD max/mean mixing.
// Defaults to an S-curve (smoothstep). Can be tuned without adding UI via:
//  - opts.params.qLodCurve: 'scurve' | 'pow'
//  - opts.params.qLodCurveGamma: number (>= 0.1)
// Or global overrides (useful for quick experiments):
//  - window.DadumGPUParams.qLodCurve / qLodCurveGamma
function _curve01(q, mode, gamma) {
  const qq = _clamp01(q);
  const g = Math.max(0.1, +gamma || 1.0);
  if (mode === 'pow') {
    return Math.pow(qq, g);
  }
  // S-curve by default
  let t = qq * qq * (3.0 - 2.0 * qq); // smoothstep(0,1,qq)
  if (g !== 1.0) t = Math.pow(t, g);
  return t;
}

export function createAdaptiveEwaDownscalePass(opts = {}) {
  const name = opts.name || 'downscale_adaptive_ewa';
  const wgslURL = opts.wgslURL || new URL('./adaptive_ewa_downscale_rgba16f.wgsl', import.meta.url);

  const state = {
    pipeline: null,
    bindLayout: null,
    sampler: null,
    paramsBuf: null,
    outTex: null,
    outView: null,
    outSize: { w: 0, h: 0 },
    _bgKey: '',
    bindGroup: null,
  };

  const defaults = {
    // dst size
    dstW: 0,
    dstH: 0,

    // tile mask
    tilePx: 32,
    qThresh: 0.35,   // tile "energy" threshold

    // fast pass
    fastMode: 'box', // 'bilinear' | 'box'

    // EWA params
    radiusMul: 1.5,
    sigma: 0.65,
    anisoAngle: 0.0,
    anisoAspect: 1.0,

    // ΔE gate (optional)
    deThresh: 0.0,
    deSoft: 0.25,
    deK: 1.0,
    // Commit23: optional weak ΔE gate for level1 (medium kernel).
    // 0 disables level1 gating; 1 means same strength as level2.
    deK1Scale: 0.25,
    // Commit24: make level1 less trigger-happy: threshold offset and softer response.
    // If you want level1 to behave like level2, set deThresh1Add=0 and deSoft1Mul=1.
    deThresh1Add: 0.12,
    deSoft1Mul: 1.35,
  };

  function _packParams(srcW, srcH, dstW, dstH, radiusMul, sigma, anisoAngle, anisoAspect, deThresh, deSoft, deK, deK1Scale, deThresh1Add, deSoft1Mul, tilePx, tilesW, tilesH) {
    // 96 bytes aligned
    const buf = new ArrayBuffer(96);
    const u32 = new Uint32Array(buf);
    const f32 = new Float32Array(buf);

    u32[0] = srcW >>> 0;
    u32[1] = srcH >>> 0;
    u32[2] = dstW >>> 0;
    u32[3] = dstH >>> 0;

    const scaleX = srcW / Math.max(1, dstW);
    const scaleY = srcH / Math.max(1, dstH);

    f32[4]  = scaleX;
    f32[5]  = scaleY;
    f32[6]  = +radiusMul;
    f32[7]  = +sigma;

    f32[8]  = +anisoAngle;
    f32[9]  = Math.max(1.0, +anisoAspect);

    f32[10] = +deThresh;
    f32[11] = Math.max(0.0, +deSoft);
    f32[12] = Math.min(1.0, Math.max(0.0, +deK));

    u32[13] = (tilePx | 0) >>> 0;
    u32[14] = (tilesW | 0) >>> 0;
    u32[15] = (tilesH | 0) >>> 0;

    // Commit23: store level1 ΔE scale in the padding area (offset 64 bytes)
    f32[16] = Math.min(1.0, Math.max(0.0, +deK1Scale));
    // Commit24: level1 tuning
    f32[17] = +deThresh1Add;
    f32[18] = Math.max(0.0, +deSoft1Mul);

    return buf;
  }

  async function _ensurePipeline(device) {
    if (state.pipeline) return;
    const code = await fetchWGSL(wgslURL);
    const module = device.createShaderModule({ code });

    state.pipeline = device.createComputePipeline({
      label: `${name}_pipeline`,
      layout: 'auto',
      compute: { module, entryPoint: 'main' },
    });
    state.bindLayout = state.pipeline.getBindGroupLayout(0);

    state.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    state.paramsBuf = makeBuffer(device, 'uniform_96b', 96, `${name}_params`);
  }

  function _ensureOut(device, w, h) {
    if (state.outTex && state.outSize.w === w && state.outSize.h === h) return;
    try { state.outTex?.destroy?.(); } catch(e) {}
    state.outTex = makeTexture(device, 'downscale_rgba16f', w, h, `${name}_out`);
    state.outView = state.outTex.createView();
    state.outSize.w = w; state.outSize.h = h;
    state.bindGroup = null;
    state._bgKey = '';
  }

  function _ensureBindGroup(device, srcView, fastView, maskView, dstView) {
    const key = `${srcView?.label||'src'}|${fastView?.label||'fast'}|${state.outSize.w}x${state.outSize.h}`;
    if (state.bindGroup && state._bgKey === key) return;
    state.bindGroup = device.createBindGroup({
      layout: state.bindLayout,
      entries: [
        { binding: 0, resource: srcView },
        { binding: 1, resource: state.sampler },
        { binding: 2, resource: fastView },
        { binding: 3, resource: maskView },
        { binding: 4, resource: dstView },
        { binding: 5, resource: { buffer: state.paramsBuf } },
      ],
    });
    state._bgKey = key;
  }

  // Composite pass run
  async function run(ctx, input, encoder) {
    const device = ctx.device;
    await _ensurePipeline(device);

    const p = { ...defaults, ...(opts.params || {}) };
    // Commit12: allow the UI qThreshold slider to drive adaptive tile selection.
    // Explicit opts.params.qThresh wins; otherwise read window.DadumGPUParams.qThresh.
    const uiQ = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.qThresh))
      ? window.DadumGPUParams.qThresh
      : null;
    const effectiveQThresh = (opts.params && Number.isFinite(opts.params.qThresh)) ? +opts.params.qThresh : (uiQ ?? p.qThresh);

    // Commit20/21/25: Reuse the same qThreshold curve mapping for multiple behaviors,
    // so "hand feel" stays coherent across LOD mixing and tile level decisions.
    let qCurveMode = 'scurve';
    let qCurveGamma = 1.0;
    if (opts.params && typeof opts.params.qLodCurve === 'string') qCurveMode = opts.params.qLodCurve;
    if (opts.params && Number.isFinite(opts.params.qLodCurveGamma)) qCurveGamma = +opts.params.qLodCurveGamma;
    try {
      if (typeof window !== 'undefined' && window.DadumGPUParams) {
        if (typeof window.DadumGPUParams.qLodCurve === 'string') qCurveMode = window.DadumGPUParams.qLodCurve;
        if (Number.isFinite(window.DadumGPUParams.qLodCurveGamma)) qCurveGamma = +window.DadumGPUParams.qLodCurveGamma;
      }
    } catch {}
    const qCurveT = _curve01(effectiveQThresh, qCurveMode, qCurveGamma);

    // Commit25: Use qThreshold curve to auto-tune ΔE gating roles:
    // - Higher qThreshold => level1 becomes less trigger-happy (deThresh1Add↑, deSoft1Mul↑)
    // - And level2 becomes stricter (effective deThresh↓), unless the user explicitly overrides deThresh.
    const uiDeThresh = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deThresh))
      ? +window.DadumGPUParams.deThresh
      : null;
    const hasExplicitDeThresh = !!(opts.params && Number.isFinite(opts.params.deThresh)) || (uiDeThresh !== null);
    const baseDeThresh = (opts.params && Number.isFinite(opts.params.deThresh)) ? +opts.params.deThresh : (uiDeThresh ?? p.deThresh);
    // Commit26: Couple level2 strictness to the same "band style" that shapes 0/1/2 tile thresholds.
// wideMid => gentler strictness; tightMid => knife-like strictness.
const qBandStyle = (typeof window !== 'undefined' && window.DadumGPUParams && window.DadumGPUParams.qLevelBandStyle)
  ? String(window.DadumGPUParams.qLevelBandStyle)
  : 'wideMid';
const strictK = (qBandStyle === 'tightMid') ? 0.32 : 0.18;
const deStrictFactor = _clamp01(1.0 - strictK * qCurveT); // (tightMid: 0.68..1.0) (wideMid: 0.82..1.0)
    const effectiveDeThresh = hasExplicitDeThresh ? baseDeThresh : (baseDeThresh * deStrictFactor);

    const uiDeSoft = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deSoft))
      ? +window.DadumGPUParams.deSoft
      : null;
    const effectiveDeSoft = (opts.params && Number.isFinite(opts.params.deSoft)) ? +opts.params.deSoft : (uiDeSoft ?? p.deSoft);

    const uiDeK = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deK))
      ? +window.DadumGPUParams.deK
      : null;
    const effectiveDeK = (opts.params && Number.isFinite(opts.params.deK)) ? +opts.params.deK : (uiDeK ?? p.deK);

    const uiDeK1Scale = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deK1Scale))
      ? +window.DadumGPUParams.deK1Scale
      : null;
    const effectiveDeK1Scale = (opts.params && Number.isFinite(opts.params.deK1Scale)) ? +opts.params.deK1Scale : (uiDeK1Scale ?? p.deK1Scale);

    // Level1-only tuning auto-map (can still be overridden explicitly).
    const uiDeThresh1Add = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deThresh1Add))
      ? +window.DadumGPUParams.deThresh1Add
      : null;
    const uiDeSoft1Mul = (typeof window !== 'undefined' && window.DadumGPUParams && Number.isFinite(window.DadumGPUParams.deSoft1Mul))
      ? +window.DadumGPUParams.deSoft1Mul
      : null;

    const hasExplicitL1Add = !!(opts.params && Number.isFinite(opts.params.deThresh1Add)) || (uiDeThresh1Add !== null);
    const hasExplicitL1SoftMul = !!(opts.params && Number.isFinite(opts.params.deSoft1Mul)) || (uiDeSoft1Mul !== null);

    const effectiveDeThresh1Add = hasExplicitL1Add
      ? ((opts.params && Number.isFinite(opts.params.deThresh1Add)) ? +opts.params.deThresh1Add : uiDeThresh1Add)
      : (0.06 + 0.22 * qCurveT); // 0.06..0.28

    const effectiveDeSoft1Mul = hasExplicitL1SoftMul
      ? ((opts.params && Number.isFinite(opts.params.deSoft1Mul)) ? +opts.params.deSoft1Mul : uiDeSoft1Mul)
      : (1.10 + 0.90 * qCurveT); // 1.10..2.00

    const srcW = input.width >>> 0;
    const srcH = input.height >>> 0;
    const dstW = (p.dstW || srcW) >>> 0;
    const dstH = (p.dstH || srcH) >>> 0;

    // 1) tile mask
    const tilePx = Math.max(8, (p.tilePx | 0));
    const tilesW = Math.ceil(srcW / tilePx) >>> 0;
    const tilesH = Math.ceil(srcH / tilePx) >>> 0;

    // Commit11: prefer a true Qmap texture (ΔK weight in .r) for tile classification.
    // If not provided, we fallback to the current input texture.
    const maskInputFull = (input && (input.qmap || input.qmapTex || input.qmapInput)) || input;

    // Commit17: Build / reuse a low-res Qmap LOD (tilesW x tilesH) so that
    // re-running mask selection with different thresholds is cheap.
    // The LOD is cached on ctx keyed by (src dims + tilePx + qmap label).
    if (!ctx.__dadumQmapLodCache) ctx.__dadumQmapLodCache = new Map();
    const qLabel = (maskInputFull && (maskInputFull.label || maskInputFull.tex?.label)) || 'qmap';
    const lodKey = `${qLabel}|${srcW}x${srcH}|tile${tilePx}|${tilesW}x${tilesH}`;
    let qmapLod = ctx.__dadumQmapLodCache.get(lodKey);
    if (!qmapLod) {
      // Commit18B: Build Qmap LOD using mean/max mixed reducer so we don't miss "strong" tiles
      // when the tile contains a small but intense ΔK region.
      // Commit19/20: qThreshold drives both tile selection (qThresh) and Qmap-LOD max/mean mix,
      // but we now use a curve mapping for "hand feel".
      // Higher qThreshold => keep heavy compute rarer, but be more paranoid about missing sharp peaks.
      const k = (opts.params && Number.isFinite(opts.params.qLodMaxMix))
        ? +opts.params.qLodMaxMix
        : (() => {
            // Commit27: Couple Qmap LOD mean/max mixK to the same "band style" rhythm.
            // tightMid => trust peaks more (higher mixK). wideMid => trust mean more (lower mixK).
            const base = 0.3 + 0.7 * qCurveT;
            const bias = ((qBandStyle === 'tightMid') ? 0.12 : -0.06) * qCurveT;
            return _clamp01(base + bias);
          })();
      const qmapLodPass = createQmapLodMeanMaxMixPass({
        params: { dstW: tilesW, dstH: tilesH, tilePx, mixK: k },
      });
      const qmapLodOut = await qmapLodPass.run(ctx, maskInputFull, encoder);
      qmapLod = {
        ...qmapLodOut,
        width: tilesW,
        height: tilesH,
        label: `qmap_lod_${tilesW}x${tilesH}`,
        __isQmapLod: true,
      };
      ctx.__dadumQmapLodCache.set(lodKey, qmapLod);
      try { window.__dadumQmapLod = qmapLod; } catch {}
    }

    const maskPass = createTileMaskFromQmapPass({ params: { tilePx, thresh: effectiveQThresh } });
    // We don't want maskPass to allocate its own encoder. It uses ours.
    const maskOut = await maskPass.run(ctx, qmapLod, encoder);
    // Commit16: expose last tile mask for optional debug overlay (no auto creation unless UI toggled).
    ctx.__dadumLastTileMask = maskOut;
    try { window.__dadumLastTileMask = maskOut; } catch {}

    // 2) fast downscale to dst
    const fastPass = createDownscalePass({ params: { mode: p.fastMode, dstW, dstH } });
    const fastOut = await fastPass.run(ctx, input, encoder);

    // 3) adaptive EWA into final outTex
    _ensureOut(device, dstW, dstH);

    const packed = _packParams(
      srcW, srcH, dstW, dstH,
      p.radiusMul, p.sigma, p.anisoAngle, p.anisoAspect,
      effectiveDeThresh, effectiveDeSoft, effectiveDeK, effectiveDeK1Scale,
      effectiveDeThresh1Add, effectiveDeSoft1Mul,
      tilePx, tilesW, tilesH,
    );
    device.queue.writeBuffer(state.paramsBuf, 0, packed);

    const srcView = input.view || input.tex.createView();
    const fastView = fastOut.view || fastOut.tex.createView();
    _ensureBindGroup(device, srcView, fastView, maskOut.maskView, state.outView);

    const pass = encoder.beginComputePass({ label: name });
    pass.setPipeline(state.pipeline);
    pass.setBindGroup(0, state.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8));
    pass.end();

    return {
      tex: state.outTex,
      view: state.outView,
      width: dstW,
      height: dstH,
      format: 'rgba16float',
      label: `${name}_out`,
      debug: {
        tilesW, tilesH, tilePx,
      },
    };
  }

  return { name, run };
}