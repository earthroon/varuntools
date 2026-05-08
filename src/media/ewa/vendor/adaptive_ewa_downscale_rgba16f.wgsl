// app/core/compute/downscale_webgpu/adaptive_ewa_downscale_rgba16f.wgsl
// Commit10: Adaptive EWA downscale.
// If tileMask[tile]==0 -> output fastTex sample.
// Else -> run EWA taps on srcTex (with optional ΔE gate).

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
  // Commit23: optional weak ΔE gate for level1 (medium kernel).
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
  // Matrices from Björn Ottosson's OKLab (approx).
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
  // level>=2: expensive kernel (16 taps + optional ΔE gate)

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

  // Reference color for ΔE gate (bilinear at srcPos)
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

      // Commit23: ΔE gate for level2, and optional weak gate for level1.
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
