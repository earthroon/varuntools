// EWA/Lanczos anisotropic downscale — two-pass patch
// Usage: import {ewaDownscale} from './shaders/ewa_patch.js'
export async function ewaDownscale(gl, srcTex, srcW, srcH, outFBO, outW, outH, programs){
  // programs: {gaussProg, resampleProg} compiled with the provided .frag files
  const texLow = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texLow);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, srcW, srcH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fboLow = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboLow);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texLow, 0);

  // Pass A
  gl.useProgram(programs.gaussProg);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.uniform1i(gl.getUniformLocation(programs.gaussProg,'uSrc'), 0);
  gl.uniform2f(gl.getUniformLocation(programs.gaussProg,'uTexel'), 1/srcW, 1/srcH);
  gl.uniform1f(gl.getUniformLocation(programs.gaussProg,'uSigma'), 1.4);
  gl.viewport(0,0,srcW,srcH);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboLow);
  drawFullScreenQuad(gl);

  // Pass B
  gl.useProgram(programs.resampleProg);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.uniform1i(gl.getUniformLocation(programs.resampleProg,'uSrc'), 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texLow);
  gl.uniform1i(gl.getUniformLocation(programs.resampleProg,'uLow'), 1);
  gl.uniform2f(gl.getUniformLocation(programs.resampleProg,'uOutTexel'), 1/outW, 1/outH);
  gl.uniform2f(gl.getUniformLocation(programs.resampleProg,'uSrcTexel'), 1/srcW, 1/srcH);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uScale'), outW/srcW);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uAlphaN'), 1.6);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uAlphaT'), 0.6);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uLanczosA'), 2.5);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uGain'), 1.2);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uBeta'), 0.8);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uGamma'), 0.6);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uWMax'), 0.85);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uSpecLo'), 0.85);
  gl.uniform1f(gl.getUniformLocation(programs.resampleProg,'uSpecHi'), 0.98);

  gl.bindFramebuffer(gl.FRAMEBUFFER, outFBO);
  gl.viewport(0,0,outW,outH);
  drawFullScreenQuad(gl);

  // cleanup is left to caller
}
