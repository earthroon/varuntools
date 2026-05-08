// Commit 109B - WebGPU EWA WGSL sources for active lightbox image processing.
// These are runtime shader sources, not generated asset SSOT.

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

fn clamp01(v: vec2<f32>) -> vec2<f32> {
  return clamp(v, vec2<f32>(0.0), vec2<f32>(1.0));
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

fn gauss_w(x: f32, sigma: f32) -> f32 {
  let t = x / max(1e-6, sigma);
  return exp(-0.5 * t * t);
}

fn gate_good(de: f32) -> f32 {
  if (P.deThresh <= 0.0 || P.deK <= 0.0) {
    return 1.0;
  }
  let soft = max(1e-6, P.deSoft);
  return mix(1.0, smoothstep(P.deThresh + soft, P.deThresh, de), clamp(P.deK, 0.0, 1.0));
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }

  let invSrc = vec2<f32>(1.0 / f32(P.srcW), 1.0 / f32(P.srcH));
  let dstUV = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) / vec2<f32>(f32(P.dstW), f32(P.dstH)));
  let refCol = textureSampleLevel(srcTex, srcSamp, clamp01(dstUV), 0.0);
  let refLab = rgb_to_oklab(refCol.rgb);

  let sX = max(1.0, P.scaleX);
  let sY = max(1.0, P.scaleY);
  var rad = vec2<f32>(sX, sY) * max(0.1, P.radiusMul);
  let c = cos(P.anisoAngle);
  let s = sin(P.anisoAngle);
  let aspect = max(1.0, P.anisoAspect);

  var accAll = vec4<f32>(0.0);
  var accGood = vec4<f32>(0.0);
  var wAll = 0.0;
  var wGood = 0.0;

  for (var j: i32 = -2; j <= 1; j = j + 1) {
    for (var i: i32 = -2; i <= 1; i = i + 1) {
      let gx = (f32(i) + 0.5) * 0.5;
      let gy = (f32(j) + 0.5) * 0.5;
      var off = vec2<f32>(gx * rad.x, gy * rad.y);
      off = vec2<f32>(off.x * aspect, off.y / aspect);
      let roff = vec2<f32>(c * off.x - s * off.y, s * off.x + c * off.y);
      let uv = clamp01(dstUV + roff * invSrc);
      let d2 = gx * gx + gy * gy;
      let w = gauss_w(sqrt(d2), P.sigma);
      let col = textureSampleLevel(srcTex, srcSamp, uv, 0.0);
      let de = length(rgb_to_oklab(col.rgb) - refLab);
      let g = gate_good(de);
      accAll = accAll + col * w;
      wAll = wAll + w;
      accGood = accGood + col * (w * g);
      wGood = wGood + (w * g);
    }
  }

  var outCol = refCol;
  if (wAll > 0.0) {
    let colAll = accAll / wAll;
    if (P.deThresh > 0.0 && P.deK > 0.0 && wGood > 1e-6) {
      outCol = mix(colAll, accGood / wGood, clamp(P.deK, 0.0, 1.0));
    } else {
      outCol = colAll;
    }
  }

  textureStore(dstTex, vec2<i32>(i32(x), i32(y)), outCol);
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
  // Final presentation is sealed to the rgba8unorm-sRGB / 8-bit SDR family.
  // Compute can stay rgba16float, but presentation clamps RGB into display range and defaults to opaque alpha.
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

fn clamp01(v: vec2<f32>) -> vec2<f32> {
  return clamp(v, vec2<f32>(0.0), vec2<f32>(1.0));
}

fn luma(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn gauss_w(x: f32, sigma: f32) -> f32 {
  let t = x / max(1e-6, sigma);
  return exp(-0.5 * t * t);
}

fn edge_energy(uv: vec2<f32>, invSrc: vec2<f32>) -> f32 {
  let cx = luma(textureSampleLevel(srcTex, srcSamp, clamp01(uv), 0.0).rgb);
  let lx = luma(textureSampleLevel(srcTex, srcSamp, clamp01(uv - vec2<f32>(invSrc.x, 0.0)), 0.0).rgb);
  let rx = luma(textureSampleLevel(srcTex, srcSamp, clamp01(uv + vec2<f32>(invSrc.x, 0.0)), 0.0).rgb);
  let ty = luma(textureSampleLevel(srcTex, srcSamp, clamp01(uv - vec2<f32>(0.0, invSrc.y)), 0.0).rgb);
  let by = luma(textureSampleLevel(srcTex, srcSamp, clamp01(uv + vec2<f32>(0.0, invSrc.y)), 0.0).rgb);
  let gx = abs(rx - lx);
  let gy = abs(by - ty);
  let local = max(abs(cx - lx), max(abs(cx - rx), max(abs(cx - ty), abs(cx - by))));
  return clamp((gx + gy + local) * 2.0, 0.0, 1.0);
}

fn ewa_sample(uv: vec2<f32>, invSrc: vec2<f32>) -> vec4<f32> {
  let sX = max(1.0, P.scaleX);
  let sY = max(1.0, P.scaleY);
  let rad = vec2<f32>(sX, sY) * max(0.1, P.radiusMul);
  var acc = vec4<f32>(0.0);
  var wsum = 0.0;
  for (var j: i32 = -2; j <= 1; j = j + 1) {
    for (var i: i32 = -2; i <= 1; i = i + 1) {
      let gx = (f32(i) + 0.5) * 0.5;
      let gy = (f32(j) + 0.5) * 0.5;
      let off = vec2<f32>(gx * rad.x, gy * rad.y);
      let u = clamp01(uv + off * invSrc);
      let w = gauss_w(length(vec2<f32>(gx, gy)), P.sigma);
      acc = acc + textureSampleLevel(srcTex, srcSamp, u, 0.0) * w;
      wsum = wsum + w;
    }
  }
  return acc / max(wsum, 1e-6);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }
  let uv = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) / vec2<f32>(f32(P.dstW), f32(P.dstH)));
  let invSrc = vec2<f32>(1.0 / f32(P.srcW), 1.0 / f32(P.srcH));
  let fast = textureSampleLevel(srcTex, srcSamp, clamp01(uv), 0.0);
  let energy = edge_energy(uv, invSrc);
  let isActive = energy >= P.qThresh;
  var outCol = fast;
  if (isActive) {
    outCol = ewa_sample(uv, invSrc);
  }
  textureStore(dstTex, vec2<i32>(i32(x), i32(y)), outCol);
}
`
