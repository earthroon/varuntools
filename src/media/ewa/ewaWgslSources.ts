// CMS-208S - Canvas-primary Lanczos/aniso EWA WGSL sources.
// Runtime shader sources, not generated asset SSOT.

export const EWA_ANISO_DOWNSCALE_WGSL = /* wgsl */`
struct Params {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,
  scaleX : f32,
  scaleY : f32,
  radiusMul : f32,
  sigma : f32,
  anisoAngle : f32,
  anisoAspect : f32,
  deThresh : f32,
  deSoft : f32,
  deK : f32,
  _pad0 : f32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSamp : sampler;
@group(0) @binding(2) var dstTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> P : Params;

const PI : f32 = 3.141592653589793;
const LANCZOS_A : f32 = 3.0;

fn clamp_i32(v: i32, lo: i32, hi: i32) -> i32 {
  return max(lo, min(hi, v));
}

fn load_src(ix: i32, iy: i32) -> vec4<f32> {
  let x = clamp_i32(ix, 0, i32(P.srcW) - 1);
  let y = clamp_i32(iy, 0, i32(P.srcH) - 1);
  return textureLoad(srcTex, vec2<i32>(x, y), 0);
}

fn cbrt1(x: f32) -> f32 {
  return pow(max(0.0, x), 0.3333333333);
}

fn rgb_to_oklab(rgb: vec3<f32>) -> vec3<f32> {
  let l = 0.4122214708 * rgb.x + 0.5363325363 * rgb.y + 0.0514459929 * rgb.z;
  let m = 0.2119034982 * rgb.x + 0.6806995451 * rgb.y + 0.1073969566 * rgb.z;
  let s = 0.0883024619 * rgb.x + 0.2817188376 * rgb.y + 0.6299787005 * rgb.z;
  let l_ = cbrt1(l);
  let m_ = cbrt1(m);
  let s_ = cbrt1(s);
  return vec3<f32>(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  );
}

fn sinc(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 1e-5) {
    return 1.0;
  }
  let pix = PI * ax;
  return sin(pix) / pix;
}

fn lanczos_w(x: f32, a: f32) -> f32 {
  let ax = abs(x);
  if (ax >= a) {
    return 0.0;
  }
  return sinc(ax) * sinc(ax / a);
}

fn gate_good(de: f32) -> f32 {
  if (P.deThresh <= 0.0 || P.deK <= 0.0) {
    return 1.0;
  }
  let soft = max(1e-6, P.deSoft);
  let g = smoothstep(P.deThresh + soft, P.deThresh, de);
  return mix(1.0, g, clamp(P.deK, 0.0, 1.0));
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }

  let srcPos = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) * vec2<f32>(P.scaleX, P.scaleY)) - vec2<f32>(0.5);
  let base = vec2<i32>(i32(floor(srcPos.x)), i32(floor(srcPos.y)));
  let refCol = load_src(base.x, base.y);
  let refLab = rgb_to_oklab(refCol.rgb);

  let c = cos(P.anisoAngle);
  let s = sin(P.anisoAngle);
  let ax = vec2<f32>(c, s);
  let ay = vec2<f32>(-s, c);
  let aspect = max(1.0, P.anisoAspect);
  let radius = max(0.25, P.radiusMul);
  let scale = max(vec2<f32>(1.0), vec2<f32>(P.scaleX, P.scaleY)) * radius;
  let rx = max(1.0, scale.x) * aspect;
  let ry = max(1.0, scale.y) / aspect;

  var accAll = vec4<f32>(0.0);
  var accGood = vec4<f32>(0.0);
  var wAll = 0.0;
  var wGood = 0.0;

  for (var j: i32 = -4; j <= 4; j = j + 1) {
    for (var i: i32 = -4; i <= 4; i = i + 1) {
      let sp = vec2<f32>(f32(base.x + i), f32(base.y + j));
      let d = sp - srcPos;
      let dx = dot(d, ax) / rx;
      let dy = dot(d, ay) / ry;
      let wx = lanczos_w(dx, LANCZOS_A);
      let wy = lanczos_w(dy, LANCZOS_A);
      let w = wx * wy;
      if (abs(w) <= 1e-6) {
        continue;
      }
      let col = load_src(base.x + i, base.y + j);
      let de = length(rgb_to_oklab(col.rgb) - refLab);
      let g = gate_good(de);
      accAll = accAll + col * w;
      wAll = wAll + w;
      accGood = accGood + col * (w * g);
      wGood = wGood + (w * g);
    }
  }

  var outCol = refCol;
  if (abs(wAll) > 1e-6) {
    let colAll = accAll / wAll;
    if (P.deThresh > 0.0 && P.deK > 0.0 && abs(wGood) > 1e-6) {
      outCol = mix(colAll, accGood / wGood, clamp(P.deK, 0.0, 1.0));
    } else {
      outCol = colAll;
    }
  }

  textureStore(dstTex, vec2<i32>(i32(x), i32(y)), vec4<f32>(clamp(outCol.rgb, vec3<f32>(0.0), vec3<f32>(1.0)), outCol.a));
}
`

export const EWA_CANVAS_PRESENT_WGSL = /* wgsl */`
struct VSOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );
  var out: VSOut;
  let p = positions[vertexIndex];
  out.position = vec4<f32>(p, 0.0, 1.0);
  out.uv = vec2<f32>(0.5 * (p.x + 1.0), 0.5 * (1.0 - p.y));
  return out;
}

@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let col = textureSample(tex, samp, in.uv);
  return vec4<f32>(clamp(col.rgb, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
`

export const EWA_ADAPTIVE_TILE_DOWNSCALE_WGSL = /* wgsl */`
struct AdaptiveParams {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,
  scaleX : f32,
  scaleY : f32,
  radiusMul : f32,
  sigma : f32,
  deThresh : f32,
  deSoft : f32,
  deK : f32,
  qThresh : f32,
  tilePx : u32,
  fastMode : u32,
  _pad0 : u32,
  _pad1 : u32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSamp : sampler;
@group(0) @binding(2) var dstTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> P : AdaptiveParams;

const PI : f32 = 3.141592653589793;
const LANCZOS_A : f32 = 3.0;

fn clamp_i32(v: i32, lo: i32, hi: i32) -> i32 { return max(lo, min(hi, v)); }
fn load_src(ix: i32, iy: i32) -> vec4<f32> {
  let x = clamp_i32(ix, 0, i32(P.srcW) - 1);
  let y = clamp_i32(iy, 0, i32(P.srcH) - 1);
  return textureLoad(srcTex, vec2<i32>(x, y), 0);
}
fn sinc(x: f32) -> f32 {
  let ax = abs(x);
  if (ax < 1e-5) { return 1.0; }
  let pix = PI * ax;
  return sin(pix) / pix;
}
fn lanczos_w(x: f32, a: f32) -> f32 {
  let ax = abs(x);
  if (ax >= a) { return 0.0; }
  return sinc(ax) * sinc(ax / a);
}
fn luma(c: vec3<f32>) -> f32 { return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722)); }
fn edge_energy(ix: i32, iy: i32) -> f32 {
  let c = luma(load_src(ix, iy).rgb);
  let lx = luma(load_src(ix - 1, iy).rgb);
  let rx = luma(load_src(ix + 1, iy).rgb);
  let ty = luma(load_src(ix, iy - 1).rgb);
  let by = luma(load_src(ix, iy + 1).rgb);
  return clamp((abs(rx - lx) + abs(by - ty) + max(abs(c - lx), max(abs(c - rx), max(abs(c - ty), abs(c - by))))) * 2.0, 0.0, 1.0);
}

fn ewa_lanczos(srcPos: vec2<f32>, active: bool) -> vec4<f32> {
  let base = vec2<i32>(i32(floor(srcPos.x)), i32(floor(srcPos.y)));
  let scale = max(vec2<f32>(1.0), vec2<f32>(P.scaleX, P.scaleY)) * max(0.25, P.radiusMul);
  var acc = vec4<f32>(0.0);
  var wsum = 0.0;
  let limit: i32 = select(2, 4, active);
  for (var j: i32 = -4; j <= 4; j = j + 1) {
    for (var i: i32 = -4; i <= 4; i = i + 1) {
      if (abs(i) > limit || abs(j) > limit) { continue; }
      let sp = vec2<f32>(f32(base.x + i), f32(base.y + j));
      let d = sp - srcPos;
      let wx = lanczos_w(d.x / max(1.0, scale.x), LANCZOS_A);
      let wy = lanczos_w(d.y / max(1.0, scale.y), LANCZOS_A);
      let w = wx * wy;
      if (abs(w) <= 1e-6) { continue; }
      acc = acc + load_src(base.x + i, base.y + j) * w;
      wsum = wsum + w;
    }
  }
  if (abs(wsum) <= 1e-6) { return load_src(base.x, base.y); }
  return acc / wsum;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }
  let srcPos = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) * vec2<f32>(P.scaleX, P.scaleY)) - vec2<f32>(0.5);
  let base = vec2<i32>(i32(floor(srcPos.x)), i32(floor(srcPos.y)));
  let energy = edge_energy(base.x, base.y);
  let active = energy >= P.qThresh;
  let outCol = ewa_lanczos(srcPos, active);
  textureStore(dstTex, vec2<i32>(i32(x), i32(y)), vec4<f32>(clamp(outCol.rgb, vec3<f32>(0.0), vec3<f32>(1.0)), outCol.a));
}
`

// CMS-208T-R1 WGSL CONSTANTS BEGIN

export const EWA_FAST_DOWNSCALE_WGSL = /* wgsl */`
// app/core/compute/downscale_webgpu/downscale_box_bilinear_rgba16f.wgsl
// Commit7: Simple downscale pass (bilinear or 4-tap box) for rgba16f pipeline.
// - Input: sampled texture_2d<f32>
// - Output: storage texture rgba16float
// Notes: "box" here is an approximation (4-tap over the src footprint). Good for preview/fast path.

struct Params {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,
  mode : u32,   // 0 = bilinear, 1 = box4
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSmp : sampler;
@group(0) @binding(2) var dstTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> P : Params;

fn clamp01(v: vec2<f32>) -> vec2<f32> {
  return clamp(v, vec2<f32>(0.0), vec2<f32>(1.0));
}

fn sampleBilinear(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(srcTex, srcSmp, clamp01(uv), 0.0);
}

fn sampleBox4(dstPx: vec2<u32>) -> vec4<f32> {
  // Map dst pixel to src footprint.
  // u0/u1 are pixel-edge coordinates in src space.
  let fx0 = (f32(dstPx.x)      ) * (f32(P.srcW) / f32(P.dstW));
  let fy0 = (f32(dstPx.y)      ) * (f32(P.srcH) / f32(P.dstH));
  let fx1 = (f32(dstPx.x) + 1.0) * (f32(P.srcW) / f32(P.dstW));
  let fy1 = (f32(dstPx.y) + 1.0) * (f32(P.srcH) / f32(P.dstH));

  // Sample near the four corners (centered within the footprint).
  let cx0 = fx0 + 0.25 * (fx1 - fx0);
  let cy0 = fy0 + 0.25 * (fy1 - fy0);
  let cx1 = fx0 + 0.75 * (fx1 - fx0);
  let cy1 = fy0 + 0.75 * (fy1 - fy0);

  let uv00 = vec2<f32>(cx0 / f32(P.srcW), cy0 / f32(P.srcH));
  let uv10 = vec2<f32>(cx1 / f32(P.srcW), cy0 / f32(P.srcH));
  let uv01 = vec2<f32>(cx0 / f32(P.srcW), cy1 / f32(P.srcH));
  let uv11 = vec2<f32>(cx1 / f32(P.srcW), cy1 / f32(P.srcH));

  let a = sampleBilinear(uv00);
  let b = sampleBilinear(uv10);
  let c = sampleBilinear(uv01);
  let d = sampleBilinear(uv11);
  return 0.25 * (a + b + c + d);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  if (gid.x >= P.dstW || gid.y >= P.dstH) { return; }
  let dstPx = vec2<u32>(gid.xy);

  // dst center uv
  let uv = vec2<f32>(
    (f32(dstPx.x) + 0.5) / f32(P.dstW),
    (f32(dstPx.y) + 0.5) / f32(P.dstH)
  );

  var col : vec4<f32>;
  if (P.mode == 0u) {
    // Bilinear in src UV space
    col = sampleBilinear(uv);
  } else {
    // Box4 approximation
    col = sampleBox4(dstPx);
  }

  textureStore(dstTex, vec2<i32>(i32(dstPx.x), i32(dstPx.y)), col);
}

`

export const EWA_QMAP_LOD_MEANMAX_MIX_WGSL = /* wgsl */`
// app/core/compute/downscale_webgpu/qmap_lod_meanmax_mix_rgba16f.wgsl
// Commit18B: Qmap LOD reducer that preserves strong tiles.
//
// For each destination texel (one per tile), we sample 4 points in the corresponding
// source tile block and compute:
//   mean = avg(s0..s3)
//   mx   = max(s0..s3)
//   q    = mix(mean, mx, mixK)
//
// Assumes source Qmap stores ?K weight in .r.

struct Params {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,
  tilePx : u32,
  _pad0 : u32,
  mixK : f32,
  _pad1 : f32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var dstTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> P : Params;

fn clamp_i32(v: i32, lo: i32, hi: i32) -> i32 {
  return max(lo, min(hi, v));
}

fn loadQ(ix: i32, iy: i32) -> f32 {
  let x = clamp_i32(ix, 0, i32(P.srcW) - 1);
  let y = clamp_i32(iy, 0, i32(P.srcH) - 1);
  return textureLoad(srcTex, vec2<i32>(x, y), 0).r;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  if (gid.x >= P.dstW || gid.y >= P.dstH) {
    return;
  }

  // Tile origin in source space.
  let tx = i32(gid.x);
  let ty = i32(gid.y);
  let tile = i32(P.tilePx);
  let ox = tx * tile;
  let oy = ty * tile;

  // Sample 4 points inside the tile block (quarter offsets).
  // We use fixed fractions to keep it deterministic & cheap.
  let s0 = loadQ(ox + (tile * 1) / 4, oy + (tile * 1) / 4);
  let s1 = loadQ(ox + (tile * 3) / 4, oy + (tile * 1) / 4);
  let s2 = loadQ(ox + (tile * 1) / 4, oy + (tile * 3) / 4);
  let s3 = loadQ(ox + (tile * 3) / 4, oy + (tile * 3) / 4);

  let mean = 0.25 * (s0 + s1 + s2 + s3);
  let mx = max(max(s0, s1), max(s2, s3));

  let k = clamp(P.mixK, 0.0, 1.0);
  let q = mean * (1.0 - k) + mx * k;

  textureStore(dstTex, vec2<i32>(tx, ty), vec4<f32>(q, 0.0, 0.0, 1.0));
}

`

export const EWA_TILEMASK_FROM_QMAP_WGSL = /* wgsl */`
// app/core/compute/downscale_webgpu/tilemask_from_qmap.wgsl
// Commit17: Build a per-tile mask from a *Qmap LOD* texture.
//
// Rationale:
// - Commit11/13: tile classification was sampling the full-res Qmap per tile (4 taps).
// - Commit17: we instead generate a low-res Qmap LOD once (tilesW x tilesH),
//   and this pass just thresholds that LOD, so re-running with different UI thresholds
//   is cheap.
//
// Contract:
// - Input texture is a LOD where each texel corresponds to one tile.
// - Qmap core writes ?K weight ("w") into the R channel.
// - Output is rgba8uint texture where .x is 0/1/2 (cheap/medium/expensive).

struct Params {
  tilesW: u32,
  tilesH: u32,
  _pad0: u32,
  _pad1: u32,
  threshLo: f32,
  threshHi: f32,
  _padf0: f32,
  _padf1: f32,
};

@group(0) @binding(0) var qmapLodTex: texture_2d<f32>;
@group(0) @binding(1) var outMask: texture_storage_2d<rgba8uint, write>;
@group(0) @binding(2) var<uniform> P: Params;

fn qWeight(c: vec4<f32>) -> f32 {
  return c.r;
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let tx = gid.x;
  let ty = gid.y;
  if (tx >= P.tilesW || ty >= P.tilesH) { return; }

  let c = textureLoad(qmapLodTex, vec2<i32>(i32(tx), i32(ty)), 0);
  let e = qWeight(c);

  // 3-level mask
  // 0: avgW < threshLo
  // 1: threshLo <= avgW < threshHi
  // 2: avgW >= threshHi
  let m0 = select(0u, 1u, e >= P.threshLo);
  let m1 = select(0u, 1u, e >= P.threshHi);
  let level = select(m0, 2u, m1 == 1u);
  textureStore(outMask, vec2<i32>(i32(tx), i32(ty)), vec4<u32>(level, 0u, 0u, 0u));
}

`

export const EWA_ADAPTIVE_COMPOSITE_WGSL = /* wgsl */`
// app/core/compute/downscale_webgpu/adaptive_ewa_downscale_rgba16f.wgsl
// Commit10: Adaptive EWA downscale.
// If tileMask[tile]==0 -> output fastTex sample.
// Else -> run EWA taps on srcTex (with optional ?E gate).

struct Params {
  srcW: u32,
  srcH: u32,
  dstW: u32,
  dstH: u32,

  scaleX: f32,
  scaleY: f32,
  radiusMul: f32,
  sigma: f32,

  anisoAngle: f32,
  anisoAspect: f32,

  deThresh: f32,
  deSoft: f32,
  deK: f32,

  tilePx: u32,
  tilesW: u32,
  tilesH: u32,
  // Commit23: optional weak ?E gate for level1 (medium kernel).
  // Stored in the previous padding slot (offset 64 bytes) to keep the uniform buffer size stable.
  deK1Scale: f32,
  // Commit24: level1 gate tuning (offset/softness) stored in padding slots.
  deThresh1Add: f32,
  deSoft1Mul: f32,
  _padF2: f32,
};

@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var s0: sampler;
@group(0) @binding(2) var fastTex: texture_2d<f32>;
@group(0) @binding(3) var tileMaskTex: texture_2d<u32>;
@group(0) @binding(4) var outTex: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var<uniform> P: Params;

fn srgbToLinear(c: vec3<f32>) -> vec3<f32> {
  // assume input already linear-ish; keep as identity for now
  return c;
}

fn linearToOklab(c: vec3<f32>) -> vec3<f32> {
  // Cheap-ish OKLab approximation (not exact, but stable enough for gating)
  // Matrices from Bj철rn Ottosson's OKLab (approx).
  let lms = mat3x3<f32>(
    0.4122214708, 0.5363325363, 0.0514459929,
    0.2119034982, 0.6806995451, 0.1073969566,
    0.0883024619, 0.2817188376, 0.6299787005
  ) * c;

  let lms_cbrt = vec3<f32>(pow(lms.x, 1.0/3.0), pow(lms.y, 1.0/3.0), pow(lms.z, 1.0/3.0));

  let lab = mat3x3<f32>(
    0.2104542553, 0.7936177850, -0.0040720468,
    1.9779984951, -2.4285922050, 0.4505937099,
    0.0259040371, 0.7827717662, -0.8086757660
  ) * lms_cbrt;

  return lab;
}

fn deltaE_oklab(a: vec3<f32>, b: vec3<f32>) -> f32 {
  let d = a - b;
  return sqrt(dot(d,d));
}


fn trimmed_mean5(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, v3: vec3<f32>, v4: vec3<f32>) -> vec3<f32> {
  let mn = min(min(min(v0, v1), min(v2, v3)), v4);
  let mx = max(max(max(v0, v1), max(v2, v3)), v4);
  let sum = v0 + v1 + v2 + v3 + v4;
  return (sum - mn - mx) / 3.0;
}

fn sample_lab_robust(uv: vec2<f32>, invSrc: vec2<f32>) -> vec3<f32> {
  let o = 0.25 * invSrc;
  let c0 = linearToOklab(srgbToLinear(textureSampleLevel(srcTex, s0, uv, 0.0).rgb));
  let c1 = linearToOklab(srgbToLinear(textureSampleLevel(srcTex, s0, uv + vec2<f32>( o.x, 0.0), 0.0).rgb));
  let c2 = linearToOklab(srgbToLinear(textureSampleLevel(srcTex, s0, uv + vec2<f32>(-o.x, 0.0), 0.0).rgb));
  let c3 = linearToOklab(srgbToLinear(textureSampleLevel(srcTex, s0, uv + vec2<f32>(0.0,  o.y), 0.0).rgb));
  let c4 = linearToOklab(srgbToLinear(textureSampleLevel(srcTex, s0, uv + vec2<f32>(0.0, -o.y), 0.0).rgb));
  return trimmed_mean5(c0, c1, c2, c3, c4);
}
fn gaussian(r2: f32, sigma: f32) -> f32 {
  return exp(-0.5 * r2 / max(1e-6, sigma*sigma));
}

@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }

  let tilePx = max(1u, P.tilePx);
  let tx = x / tilePx;
  let ty = y / tilePx;
  let txc = min(tx, max(0u, P.tilesW - 1u));
  let tyc = min(ty, max(0u, P.tilesH - 1u));
  let level: u32 = textureLoad(tileMaskTex, vec2<i32>(i32(txc), i32(tyc)), 0).x;

  let uvDst = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5)) / vec2<f32>(f32(P.dstW), f32(P.dstH));

  if (level == 0u) {
    let c = textureSampleLevel(fastTex, s0, uvDst, 0.0);
    textureStore(outTex, vec2<i32>(i32(x), i32(y)), c);
    return;
  }
  // level==1: medium kernel (8 taps, direction-aware)
  // level>=2: expensive kernel (16 taps + optional ?E gate)

  // Map dst pixel center into src space
  let srcPos = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5)) * vec2<f32>(P.scaleX, P.scaleY) - vec2<f32>(0.5, 0.5);
  let base = floor(srcPos);
  let frac = srcPos - base;

  // Aniso basis
  let ang = P.anisoAngle;
  let ca = cos(ang);
  let sa = sin(ang);
  let ax = vec2<f32>( ca, sa);
  let ay = vec2<f32>(-sa, ca);
  let aspect = max(1.0, P.anisoAspect);

  // Commit14: level==1 uses a direction-aware 8-tap pattern (3x3 minus one diagonal corner)
  // Drop the diagonal corner opposite to the aniso major axis to keep symmetry while preserving directionality.
  let sx: i32 = select(-1, 1, ax.x >= 0.0);
  let sy: i32 = select(-1, 1, ax.y >= 0.0);
  let dropCorner = vec2<i32>(-sx, -sy);

  // Reference color for ?E gate (bilinear at srcPos)
  let uvRef = (clamp(srcPos, vec2<f32>(0.0), vec2<f32>(f32(P.srcW)-1.0, f32(P.srcH)-1.0)) + vec2<f32>(0.5)) / vec2<f32>(f32(P.srcW), f32(P.srcH));
  let refRgb = srgbToLinear(textureSampleLevel(srcTex, s0, uvRef, 0.0).rgb);
  let invSrc = vec2<f32>(1.0 / f32(P.srcW), 1.0 / f32(P.srcH));
  let refLab = sample_lab_robust(uvRef, invSrc);
var accAll = vec3<f32>(0.0);
  var accGood = vec3<f32>(0.0);
  var wAll = 0.0;
  var wGood = 0.0;
// 4x4 taps around base
  for (var j: i32 = -1; j <= 2; j = j + 1) {
    for (var i: i32 = -1; i <= 2; i = i + 1) {
      if (level == 1u) {
        // medium kernel: 8 taps = 3x3 neighborhood excluding one diagonal corner (direction-aware)
        // Skip outer ring (i==2 or j==2) so we stay within [-1..1]
        if (i == 2 || j == 2) { continue; }
        // Drop one diagonal corner opposite to aniso direction to keep it at 8 taps
        if (abs(i) == 1 && abs(j) == 1 && i == dropCorner.x && j == dropCorner.y) { continue; }
      }
      let px = base.x + f32(i);
      let py = base.y + f32(j);

      let sp = vec2<f32>(px, py);
      let d = (sp - srcPos);

      // apply aniso stretch in rotated frame
      let dx = dot(d, ax) / aspect;
      let dy = dot(d, ay) * aspect;

      let r2 = dx*dx + dy*dy;
      var w = gaussian(r2, P.sigma) * P.radiusMul;

      let uv = (clamp(sp, vec2<f32>(0.0), vec2<f32>(f32(P.srcW)-1.0, f32(P.srcH)-1.0)) + vec2<f32>(0.5)) / vec2<f32>(f32(P.srcW), f32(P.srcH));
      let rgb = srgbToLinear(textureSampleLevel(srcTex, s0, uv, 0.0).rgb);

      // Always accumulate the full kernel
      accAll = accAll + rgb * w;
      wAll = wAll + w;

      // Commit23: ?E gate for level2, and optional weak gate for level1.
      // We keep energy by dual-accumulation (accAll vs accGood).
      let deKeff = select(P.deK * clamp(P.deK1Scale, 0.0, 1.0), P.deK, level >= 2u);
      if (P.deThresh > 0.0 && deKeff > 0.0) {
        let lab = linearToOklab(rgb);
        let dE = deltaE_oklab(lab, refLab);
        let thresh = P.deThresh + select(0.0, P.deThresh1Add, level == 1u);
        let soft = max(1e-6, P.deSoft * select(1.0, P.deSoft1Mul, level == 1u));
        let g = smoothstep(thresh + soft, thresh, dE); // 1 when small, 0 when big
        accGood = accGood + rgb * (w * g);
        wGood = wGood + (w * g);
      }
    }
  }

  let colAll = accAll / max(1e-6, wAll);

  // Apply dual-accumulation mix only when the gate is active and has support.
  let deKeffOut = select(P.deK * clamp(P.deK1Scale, 0.0, 1.0), P.deK, level >= 2u);
  var outRgb = colAll;
  if (P.deThresh > 0.0 && deKeffOut > 0.0 && wGood > 1e-5) {
    let colGood = accGood / max(1e-6, wGood);
    outRgb = mix(colAll, colGood, clamp(deKeffOut, 0.0, 1.0));
  }

  textureStore(outTex, vec2<i32>(i32(x), i32(y)), vec4<f32>(outRgb, 1.0));
}

`

// CMS-208T-R1 WGSL CONSTANTS END


