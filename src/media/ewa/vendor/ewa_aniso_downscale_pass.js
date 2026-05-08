// app/core/compute/downscale_webgpu/ewa_aniso_downscale_pass.js
// Commit8: Approximate EWA/aniso downscale pass (compute).
// Contract: consumes {tex,width,height[,view]} and produces {tex,width,height,view}.

import { makeTexture, makeBuffer } from '../../../webgpu_resource_factory.js';

async function fetchWGSL(url) {
  const text = await (await fetch(url)).text();
  return text;
}

export function createEwaAnisoDownscalePass(opts = {}) {
  const name = opts.name || 'downscale_ewa_aniso';
  const wgslURL = opts.wgslURL || new URL('./ewa_aniso_downscale_rgba16f.wgsl', import.meta.url);

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
    dstW: 0,
    dstH: 0,
    radiusMul: 1.5,
    sigma: 0.65,
    anisoAngle: 0.0,
    anisoAspect: 1.0,
    // ΔE gate (OKLab): set deThresh<=0 to disable
    deThresh: 0.0,
    deSoft: 0.25,
    deK: 1.0,
  };

  function _packParams(srcW, srcH, dstW, dstH, radiusMul, sigma, anisoAngle, anisoAspect, deThresh, deSoft, deK) {
    // 64 bytes aligned (16 floats/uint mix, but we keep it simple)
    const buf = new ArrayBuffer(64);
    const u32 = new Uint32Array(buf);
    const f32 = new Float32Array(buf);

    u32[0] = srcW >>> 0;
    u32[1] = srcH >>> 0;
    u32[2] = dstW >>> 0;
    u32[3] = dstH >>> 0;

    // texel scale factors
    const scaleX = srcW / Math.max(1, dstW);
    const scaleY = srcH / Math.max(1, dstH);

    f32[4] = scaleX;
    f32[5] = scaleY;
    f32[6] = +radiusMul;
    f32[7] = +sigma;

    f32[8] = +anisoAngle;
    f32[9] = Math.max(1.0, +anisoAspect);

    // ΔE gate
    f32[10] = +deThresh;
    f32[11] = Math.max(0.0, +deSoft);
    f32[12] = Math.min(1.0, Math.max(0.0, +deK));

    // padding
    f32[13] = 0.0;

    return buf;
  }

  async function _ensurePipeline(device) {
    if (state.pipeline) return;
    const code = await fetchWGSL(wgslURL);
    const module = device.createShaderModule({ code });
    state.bindLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, sampler: { type: 'filtering' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });
    const pl = device.createPipelineLayout({ bindGroupLayouts: [state.bindLayout] });
    state.pipeline = device.createComputePipeline({
      layout: pl,
      compute: { module, entryPoint: 'main' },
    });
    state.sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
    state.paramsBuf = makeBuffer(device, 'uniform_64b', 64, `${name}_params`);
  }

  function _ensureOutTex(device, w, h) {
    if (state.outTex && state.outSize.w === w && state.outSize.h === h) return;
    state.outTex = makeTexture(device, 'downscale_rgba16f', w, h, `${name}_out`);
    state.outView = state.outTex.createView();
    state.outSize.w = w; state.outSize.h = h;
    state._bgKey = '';
  }

  function _ensureBindGroup(device, srcTex, srcView, dstView) {
    const key = `${srcTex?.label || 'src'}|${state.outSize.w}x${state.outSize.h}|ewa`;
    if (state.bindGroup && state._bgKey === key) return;
    state.bindGroup = device.createBindGroup({
      layout: state.bindLayout,
      entries: [
        { binding: 0, resource: srcView || srcTex.createView() },
        { binding: 1, resource: state.sampler },
        { binding: 2, resource: dstView },
        { binding: 3, resource: { buffer: state.paramsBuf } },
      ],
    });
    state._bgKey = key;
  }

  async function run(ctx, input, encoder) {
    const device = ctx.device;
    // encoder is passed in by runner
    const p = { ...defaults, ...(opts.params || {}) };

    await _ensurePipeline(device);

    const srcW = input.width >>> 0;
    const srcH = input.height >>> 0;
    const dstW = (p.dstW || srcW) >>> 0;
    const dstH = (p.dstH || srcH) >>> 0;

    _ensureOutTex(device, dstW, dstH);

    const packed = _packParams(srcW, srcH, dstW, dstH, p.radiusMul, p.sigma, p.anisoAngle, p.anisoAspect, p.deThresh, p.deSoft, p.deK);
    device.queue.writeBuffer(state.paramsBuf, 0, packed);

    const srcView = input.view || input.tex.createView();
    _ensureBindGroup(device, input.tex, srcView, state.outView);

    const pass = encoder.beginComputePass({ label: name });
    pass.setPipeline(state.pipeline);
    pass.setBindGroup(0, state.bindGroup);
    const gx = Math.ceil(dstW / 8);
    const gy = Math.ceil(dstH / 8);
    pass.dispatchWorkgroups(gx, gy);
    pass.end();

    return {
      tex: state.outTex,
      view: state.outView,
      width: dstW,
      height: dstH,
      format: 'rgba16float',
      label: `${name}_out`,
    };
  }

  return { name, run };
}
