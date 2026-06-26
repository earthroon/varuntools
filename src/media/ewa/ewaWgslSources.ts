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
