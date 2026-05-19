/** 生成程序化纹理（棋盘格），返回 WebGLTexture */

export function createCheckerTexture(gl: WebGL2RenderingContext, size: number = 256): WebGLTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const tileCount = 8; // 瓦片个数
  const tileSize = size / tileCount; // 单个瓦片尺寸

  for (let y = 0; y < tileCount; y++) {
    for (let x = 0; x < tileCount; x++) {
      const isLight = (x + y) % 2 === 0;
      ctx.fillStyle = isLight ? '#e8d5b7' : '#8b5e3c';
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // 在中间画一个十字标记，方便观察纹理方向
  ctx.strokeStyle = '#4a90d9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);

  return texture;
}
