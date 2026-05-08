struct Params {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,
  scaleX : f32,
  scaleY : f32,
  radiusMul : f32,
  sigma : f32,
  detailMix : f32,
  edgeBoost : f32,
  majorBoost : f32,
  minorClamp : f32,
  _pad0 : f32,
  _pad1 : f32,
  _pad2 : f32,
  _pad3 : f32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSmp : sampler;
@group(0) @binding(2) var lowTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> P : Params;

fn clamp01(v: vec2<f32>) -> vec2<f32> {
  return clamp(v, vec2<f32>(0.0), vec2<f32>(1.0));
}

fn samplePremultTex(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(srcTex, srcSmp, clamp01(uv), 0.0);
}

fn luminance(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn safeUnpremult(c: vec4<f32>) -> vec4<f32> {
  if (c.a <= 1e-6) { return vec4<f32>(0.0); }
  return vec4<f32>(c.rgb / c.a, c.a);
}

fn edgeBasis(srcPos: vec2<f32>, invSrc: vec2<f32>) -> mat2x2<f32> {
  let l = luminance(safeUnpremult(samplePremultTex((srcPos + vec2<f32>(-1.0,  0.0) + vec2<f32>(0.5)) * invSrc)).rgb);
  let r = luminance(safeUnpremult(samplePremultTex((srcPos + vec2<f32>( 1.0,  0.0) + vec2<f32>(0.5)) * invSrc)).rgb);
  let t = luminance(safeUnpremult(samplePremultTex((srcPos + vec2<f32>( 0.0, -1.0) + vec2<f32>(0.5)) * invSrc)).rgb);
  let b = luminance(safeUnpremult(samplePremultTex((srcPos + vec2<f32>( 0.0,  1.0) + vec2<f32>(0.5)) * invSrc)).rgb);
  var g = vec2<f32>(r - l, b - t);
  let gm = length(g);
  if (gm <= 1e-6) {
    return mat2x2<f32>(vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0));
  }
  let n = normalize(g);
  let tng = vec2<f32>(-n.y, n.x);
  return mat2x2<f32>(tng, n);
}

fn sampleLowpass(srcPos: vec2<f32>, invSrc: vec2<f32>) -> vec4<f32> {
  let basis = edgeBasis(srcPos, invSrc);
  let scale = max(P.scaleX, P.scaleY);
  let major = max(1.0, scale * max(1.0, P.radiusMul));
  let minor = max(0.75, scale * clamp(P.sigma, 0.55, 2.4));
  var acc = vec4<f32>(0.0);
  var wsum = 0.0;
  for (var j: i32 = -3; j <= 3; j = j + 1) {
    for (var i: i32 = -3; i <= 3; i = i + 1) {
      let d = vec2<f32>(f32(i), f32(j));
      let local = vec2<f32>(dot(d, basis[0]) / major, dot(d, basis[1]) / minor);
      let r2 = dot(local, local);
      if (r2 > 1.0) { continue; }
      let gaussian = exp(-1.65 * r2 / max(0.12, P.sigma));
      let ewa = max(0.0, 1.0 - r2);
      let w = gaussian * ewa;
      let uv = (srcPos + d + vec2<f32>(0.5)) * invSrc;
      acc = acc + samplePremultTex(uv) * w;
      wsum = wsum + w;
    }
  }
  return acc / max(1e-6, wsum);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  if (gid.x >= P.dstW || gid.y >= P.dstH) { return; }
  let dst = vec2<f32>(f32(gid.x), f32(gid.y));
  let srcPos = (dst + vec2<f32>(0.5)) * vec2<f32>(P.scaleX, P.scaleY) - vec2<f32>(0.5);
  let invSrc = vec2<f32>(1.0 / f32(P.srcW), 1.0 / f32(P.srcH));
  let low = sampleLowpass(srcPos, invSrc);
  textureStore(lowTex, vec2<i32>(i32(gid.x), i32(gid.y)), low);
}
