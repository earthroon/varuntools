// ============================================================
// ewa_aniso_tile.mjs
// ΔK — EWA + 이등방성 텐서 기반 다운스케일러 (타일 캐시 버전)
// ------------------------------------------------------------
// 요구사항: WebGPU 활성화, tensorTex=(cosθ,sinθ,λ1,λ2), srcTex=rgba16float
// 출력: dstTex (rgba16float), 질감 보존형 다운스케일
// ============================================================

export async function createEWAAnisoPipeline(device) {
  const wgsl = /* wgsl */`
  enable f16;
  const WG_W : u32 = 16u;
  const WG_H : u32 = 16u;
  const R    : i32 = 2;
  const PAD  : u32 = u32(R);
  const TILE_W : u32 = WG_W + PAD*2u;
  const TILE_H : u32 = WG_H + PAD*2u;

  struct Params {
    inSize        : vec2<f32>;
    outSize       : vec2<f32>;
    scale         : vec2<f32>;
    sigmaMain     : f32;
    sigmaCross    : f32;
    shrinkClamp   : f32;
  };

  @group(0) @binding(0) var srcTex    : texture_2d<f32>;
  @group(0) @binding(1) var tensorTex : texture_2d<f32>;
  @group(0) @binding(2) var dstTex    : texture_storage_2d<rgba16float, write>;
  @group(0) @binding(3) var<uniform> U : Params;

  var<workgroup> tile : array<vec4<f32>, (TILE_W * TILE_H)>;

  fn idx2d(x: i32, y: i32, w: i32) -> i32 { return y*w + x; }
  fn clamp01(v: vec2<f32>) -> vec2<f32> { return clamp(v, vec2<f32>(0.0), vec2<f32>(1.0)); }
  fn safe_sigma(s: f32, cap: f32) -> f32 { return min(max(s, 1e-4), max(cap, 1e-4)); }

  fn mahal_weight(dx: vec2<f32>, c: f32, s: f32, inv_s1: f32, inv_s2: f32) -> f32 {
    let xt =  dx.x * c + dx.y * s;
    let xn = -dx.x * s + dx.y * c;
    let q  = (xt*xt) * inv_s1 * inv_s1 + (xn*xn) * inv_s2 * inv_s2;
    return exp(-0.5 * q);
  }

  fn load_src(ix: i32, iy: i32, W: i32, H: i32) -> vec4<f32> {
    let cx = clamp(ix, 0, W - 1);
    let cy = clamp(iy, 0, H - 1);
    return textureLoad(srcTex, vec2<i32>(cx, cy), 0);
  }

  fn sample_from_tile(ix: i32, iy: i32, baseX: i32, baseY: i32, W: i32, H: i32) -> vec4<f32> {
    let tx = ix - baseX + i32(PAD);
    let ty = iy - baseY + i32(PAD);
    if (tx >= 0 && tx < i32(TILE_W) && ty >= 0 && ty < i32(TILE_H)) {
      return tile[u32(idx2d(tx, ty, i32(TILE_W)))];
    }
    return load_src(ix, iy, W, H);
  }

  @compute @workgroup_size(WG_W, WG_H)
  fn main(@builtin(global_invocation_id) gid: vec3<u32>,
          @builtin(local_invocation_id)  lid: vec3<u32>) {

    if (gid.x >= u32(U.outSize.x) || gid.y >= u32(U.outSize.y)) { return; }

    let inW = i32(U.inSize.x);
    let inH = i32(U.inSize.y);
    let uvOut  = (vec2<f32>(vec2<u32>(gid.xy)) + vec2<f32>(0.5)) / U.outSize;
    let pSrc   = uvOut * U.inSize;
    let pBase  = vec2<i32>(floor(pSrc));
    let baseX  = pBase.x - i32(PAD);
    let baseY  = pBase.y - i32(PAD);

    // === Cooperative Tile Load ===
    let localX = i32(lid.x);
    let localY = i32(lid.y);
    for (var y = localY; y < i32(TILE_H); y += i32(WG_H)) {
      for (var x = localX; x < i32(TILE_W); x += i32(WG_W)) {
        let srcX = baseX + x - i32(PAD);
        let srcY = baseY + y - i32(PAD);
        tile[u32(idx2d(x, y, i32(TILE_W)))] = load_src(srcX, srcY, inW, inH);
      }
    }
    workgroupBarrier();

    // === Tensor Fetch ===
    let tCoord = vec2<i32>(clamp(pBase, vec2<i32>(0), vec2<i32>(inW-1, inH-1)));
    let T      = textureLoad(tensorTex, tCoord, 0);
    let c = T.r; let s = T.g;
    var sigma1 = safe_sigma(U.sigmaMain,  U.shrinkClamp);
    var sigma2 = safe_sigma(U.sigmaCross, U.shrinkClamp);
    if (T.b > 0.0 && T.a > 0.0) {
      sigma1 = safe_sigma(U.sigmaMain  / sqrt(max(T.b,1e-4)), U.shrinkClamp);
      sigma2 = safe_sigma(U.sigmaCross / sqrt(max(T.a,1e-4)), U.shrinkClamp);
    }
    let inv_s1 = 1.0 / sigma1;
    let inv_s2 = 1.0 / sigma2;

    // === EWA integrate (5x5) ===
    var acc  = vec4<f32>(0.0);
    var wsum = 0.0;
    for (var j: i32 = -R; j <= R; j++) {
      for (var i: i32 = -R; i <= R; i++) {
        let offLocal = vec2<f32>(f32(i)*sigma1, f32(j)*sigma2);
        let dx = vec2<f32>( offLocal.x *  c + offLocal.y *  s,
                           -offLocal.x *  s + offLocal.y *  c);
        let q = pSrc + dx;
        let ix = i32(round(q.x));
        let iy = i32(round(q.y));
        let w = mahal_weight(dx, c, s, inv_s1, inv_s2);
        let v = sample_from_tile(ix, iy, baseX, baseY, inW, inH);
        acc  += v * w;
        wsum += w;
      }
    }
    textureStore(dstTex, vec2<i32>(gid.xy), acc / max(wsum,1e-6));
  }`;

  const module = device.createShaderModule({ code: wgsl });
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module, entryPoint: 'main' }
  });

  return pipeline;
}

// ------------------------------------------------------------
// 헬퍼: 한번에 다운스케일 실행
// ------------------------------------------------------------
export function dispatchEWAAniso(device, pipeline, {
  srcTex, tensorTex, dstTex,
  inW, inH, outW, outH,
  sigmaMain = 1.2, sigmaCross = 0.6, shrinkClamp = 2.5
}) {
  const params = new Float32Array([
    inW, inH,
    outW, outH,
    outW/inW, outH/inH,
    sigmaMain, sigmaCross,
    shrinkClamp
  ]);
  const paramBuf = device.createBuffer({
    size: params.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(paramBuf, 0, params);

  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: srcTex.createView() },
      { binding: 1, resource: tensorTex.createView() },
      { binding: 2, resource: dstTex.createView() },
      { binding: 3, resource: { buffer: paramBuf } }
    ]
  });

  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bind);
  pass.dispatchWorkgroups(Math.ceil(outW / 16), Math.ceil(outH / 16));
  pass.end();
  device.queue.submit([enc.finish()]);
}
