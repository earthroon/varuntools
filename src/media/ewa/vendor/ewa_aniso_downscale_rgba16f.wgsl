// app/core/compute/downscale_webgpu/ewa_aniso_downscale_rgba16f.wgsl
// Commit9: Approximate EWA/aniso downscale (compute) + optional ΔE gate (OKLab).
//
// ΔE gate:
// - Reference color = bilinear sample at destination center.
// - Each tap weight is attenuated based on OKLab ΔE from reference.
// - If deThresh <= 0.0, gating is disabled.

struct Params {
  srcW : u32,
  srcH : u32,
  dstW : u32,
  dstH : u32,

  // scale factors in texels: src/dst
  scaleX : f32,
  scaleY : f32,

  // EWA controls
  radiusMul : f32,  // multiplies the scale-based radii
  sigma : f32,      // gaussian sigma in "unit grid" space, ~0.6 is a decent default

  // anisotropy controls
  anisoAngle : f32,   // radians
  anisoAspect : f32,  // >= 1.0. 1.0 = isotropic. >1 stretches along local X

  // ΔE gate controls (OKLab)
  deThresh : f32,     // threshold where gating starts (<=0 disables)
  deSoft : f32,       // softness around threshold (>=0)
  deK : f32,          // [0..1] blend amount, 0=no gate, 1=full gate

  _pad0 : f32,
};

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSamp : sampler;
@group(0) @binding(2) var dstTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<uniform> P : Params;

fn clamp01(v: vec2<f32>) -> vec2<f32> {
  return clamp(v, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
}


fn sample_rgb(uv: vec2<f32>) -> vec3<f32> {
  let c = textureSampleLevel(srcTex, srcSamp, clamp01(uv), 0.0);
  return c.rgb;
}

fn trimmed_mean5(v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>, v3: vec3<f32>, v4: vec3<f32>) -> vec3<f32> {
  let mn = min(min(min(v0, v1), min(v2, v3)), v4);
  let mx = max(max(max(v0, v1), max(v2, v3)), v4);
  let sum = v0 + v1 + v2 + v3 + v4;
  return (sum - mn - mx) / 3.0;
}

fn ref_oklab_robust(dstUV: vec2<f32>, invSrc: vec2<f32>) -> vec3<f32> {
  // 5-sample cross (center + N/E/S/W) in texel-space quarter offsets.
  let o = 0.25 * invSrc;
  let c0 = rgb_to_oklab(sample_rgb(dstUV));
  let c1 = rgb_to_oklab(sample_rgb(dstUV + vec2<f32>( o.x, 0.0)));
  let c2 = rgb_to_oklab(sample_rgb(dstUV + vec2<f32>(-o.x, 0.0)));
  let c3 = rgb_to_oklab(sample_rgb(dstUV + vec2<f32>(0.0,  o.y)));
  let c4 = rgb_to_oklab(sample_rgb(dstUV + vec2<f32>(0.0, -o.y)));
  return trimmed_mean5(c0, c1, c2, c3, c4);
}

fn gate_good(de: f32) -> f32 {
  if (P.deThresh <= 0.0 || P.deK <= 0.0) {
    return 1.0;
  }
  let soft = max(1e-6, P.deSoft);
  // de <= thresh -> 1, de >= thresh+soft -> 0
  return smoothstep(P.deThresh + soft, P.deThresh, de);
}
fn gauss_w(x: f32, sigma: f32) -> f32 {
  // exp(-0.5*(x/sigma)^2)
  let t = x / max(1e-6, sigma);
  return exp(-0.5 * t * t);
}

fn cbrt1(x: f32) -> f32 {
  // x should be >= 0 for our LMS; keep it safe anyway.
  return pow(max(0.0, x), 0.3333333333);
}

fn rgb_to_oklab(rgb: vec3<f32>) -> vec3<f32> {
  // Assumes rgb is linear.
  let l = 0.4122214708 * rgb.x + 0.5363325363 * rgb.y + 0.0514459929 * rgb.z;
  let m = 0.2119034982 * rgb.x + 0.6806995451 * rgb.y + 0.1073969566 * rgb.z;
  let s = 0.0883024619 * rgb.x + 0.2817188376 * rgb.y + 0.6299787005 * rgb.z;

  let l_ = cbrt1(l);
  let m_ = cbrt1(m);
  let s_ = cbrt1(s);

  let L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  let A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  let B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  return vec3<f32>(L, A, B);
}

let soft = max(1e-6, P.deSoft);
  // de <= thresh -> 1, de >= thresh+soft -> 0
  let g = smoothstep(P.deThresh + soft, P.deThresh, de);
  return mix(1.0, g, clamp(P.deK, 0.0, 1.0));
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= P.dstW || y >= P.dstH) { return; }

  let invSrc = vec2<f32>(1.0 / f32(P.srcW), 1.0 / f32(P.srcH));
  let dstUV = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) / vec2<f32>(f32(P.dstW), f32(P.dstH)));

  // Reference (center) sample for ΔE gating
  let refCol = textureSampleLevel(srcTex, srcSamp, dstUV, 0.0);
  let refLab = ref_oklab_robust(dstUV, invSrc);
// Ellipse radii in input texels:
  let sX = max(1.0, P.scaleX);
  let sY = max(1.0, P.scaleY);
  var rad = vec2<f32>(sX, sY) * max(0.1, P.radiusMul);

  // Anisotropy: rotate + stretch sampling offsets (local X stretched by aspect)
  let ang = P.anisoAngle;
  let c = cos(ang);
  let s = sin(ang);
  let aspect = max(1.0, P.anisoAspect);

  // sample grid in [-0.75..0.75] (4x4 = 16 taps)
  var accAll : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  var accGood : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  var wAll : f32 = 0.0;
  var wGood : f32 = 0.0;
for (var j: i32 = -2; j <= 1; j = j + 1) {
    for (var i: i32 = -2; i <= 1; i = i + 1) {
      let gx = (f32(i) + 0.5) * 0.5; // -0.75, -0.25, 0.25, 0.75
      let gy = (f32(j) + 0.5) * 0.5;

      // local offset in input texels
      var off = vec2<f32>(gx * rad.x, gy * rad.y);

      // anisotropic stretch (local space)
      off = vec2<f32>(off.x * aspect, off.y / aspect);

      // rotate into texture space
      let roff = vec2<f32>(
        c * off.x - s * off.y,
        s * off.x + c * off.y
      );

      let uv = clamp01(dstUV + roff * invSrc);

      // gaussian weight on unit-grid distance
      let d2 = gx*gx + gy*gy;
      var w = gauss_w(sqrt(d2), P.sigma);

      let col = textureSampleLevel(srcTex, srcSamp, uv, 0.0);

      // ΔE gate: compute a "goodness" score (1=good, 0=outlier)
      let lab = rgb_to_oklab(col.rgb);
      let de = length(lab - refLab);
      let g = gate_good(de);

      // Always accumulate the full kernel (energy-preserving)
      accAll = accAll + col * w;
      wAll = wAll + w;

      // Accumulate a "clean" kernel (outliers suppressed)
      accGood = accGood + col * (w * g);
      wGood = wGood + (w * g);
    }
  }

  var outCol : vec4<f32> = refCol;
  if (wAll > 0.0) {
    let colAll = accAll / wAll;
    if (P.deThresh > 0.0 && P.deK > 0.0 && wGood > 1e-6) {
      let colGood = accGood / wGood;
      outCol = mix(colAll, colGood, clamp(P.deK, 0.0, 1.0));
    } else {
      outCol = colAll;
    }
  }

  textureStore(dstTex, vec2<i32>(i32(x), i32(y)), outCol);
}
