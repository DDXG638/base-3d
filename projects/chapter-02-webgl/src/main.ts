import { vertexShaderSrc, fragmentShaderSrc } from './shaders';
import { createCubeData, STRIDE } from './mesh';
import { createCheckerTexture } from './texture';
import {
  perspective, lookAt,
  rotationX, rotationY, multiply, normalMatrix,
} from './math';

// ——— 1. 获取 WebGL2 上下文 ———
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2', { antialias: true })!;
if (!gl) throw new Error('WebGL 2.0 不受支持');

// ——— 2. 编译着色器 ———
function compileShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader 编译失败:\n${log}`);
  }
  return shader;
}

const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

// ——— 3. 链接程序 ———
const program = gl.createProgram()!;
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(`Program 链接失败:\n${gl.getProgramInfoLog(program)}`);
}
gl.useProgram(program);

// ——— 4. 获取 attribute / uniform 位置 ———
const locs = {
  aPosition: gl.getAttribLocation(program, 'aPosition'),
  aNormal: gl.getAttribLocation(program, 'aNormal'),
  aTexCoord: gl.getAttribLocation(program, 'aTexCoord'),
  uModelMatrix: gl.getUniformLocation(program, 'uModelMatrix')!,
  uViewMatrix: gl.getUniformLocation(program, 'uViewMatrix')!,
  uProjectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix')!,
  uNormalMatrix: gl.getUniformLocation(program, 'uNormalMatrix')!,
  uLightPos: gl.getUniformLocation(program, 'uLightPos')!,
  uCameraPos: gl.getUniformLocation(program, 'uCameraPos')!,
  uAmbientColor: gl.getUniformLocation(program, 'uAmbientColor')!,
  uDiffuseColor: gl.getUniformLocation(program, 'uDiffuseColor')!,
  uSpecularColor: gl.getUniformLocation(program, 'uSpecularColor')!,
  uShininess: gl.getUniformLocation(program, 'uShininess')!,
};

// ——— 5. 创建 VAO 并填充缓冲区 ———
const vao = gl.createVertexArray()!;
gl.bindVertexArray(vao);

const { vertices, indices } = createCubeData();

// VBO: 顶点缓冲
const vbo = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// IBO: 索引缓冲
const ibo = gl.createBuffer()!;
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// 配置顶点属性指针（告知 GPU 如何解析 VBO 中的字节）
const FLOAT_SIZE = 4;
gl.enableVertexAttribArray(locs.aPosition);
gl.vertexAttribPointer(locs.aPosition, 3, gl.FLOAT, false, STRIDE * FLOAT_SIZE, 0);

gl.enableVertexAttribArray(locs.aNormal);
gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, STRIDE * FLOAT_SIZE, 3 * FLOAT_SIZE);

gl.enableVertexAttribArray(locs.aTexCoord);
gl.vertexAttribPointer(locs.aTexCoord, 2, gl.FLOAT, false, STRIDE * FLOAT_SIZE, 6 * FLOAT_SIZE);

gl.bindVertexArray(null);

// ——— 6. 创建纹理 ———
const texture = createCheckerTexture(gl);

// ——— 7. 设置全局渲染状态 ———
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.clearColor(0.15, 0.15, 0.2, 1);

// ——— 8. 设置不变的 Uniform ———
const cameraPos = { x: 0, y: 0, z: 5 };
// 光源从右上方照向物体
gl.uniform3f(locs.uLightPos, 5, 8, 5);
gl.uniform3f(locs.uCameraPos, cameraPos.x, cameraPos.y, cameraPos.z);
// Phong 材质参数
gl.uniform3f(locs.uAmbientColor, 0.15, 0.15, 0.15);
gl.uniform3f(locs.uDiffuseColor, 0.8, 0.8, 0.8);
gl.uniform3f(locs.uSpecularColor, 0.6, 0.6, 0.6);
gl.uniform1f(locs.uShininess, 64);

// 视图矩阵（相机位置固定）
const viewMatrix = lookAt(
  cameraPos.x, cameraPos.y, cameraPos.z,
  0, 0, 0,
  0, 1, 0,
);
gl.uniformMatrix4fv(locs.uViewMatrix, false, viewMatrix);

// 投影矩阵（透视投影）
const projMatrix = perspective(
  Math.PI / 3,                           // fov: 60°
  canvas.width / canvas.height,          // aspect
  0.1, 100,
);
gl.uniformMatrix4fv(locs.uProjectionMatrix, false, projMatrix);

// ——— 9. 渲染循环 ———
let startTime = performance.now();

function render(now: number) {
  const elapsed = (now - startTime) / 1000; // 秒

  // 窗口自适应
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 模型矩阵：绕 X 和 Y 轴旋转
  const ry = rotationY(elapsed * 0.7);
  const rx = rotationX(elapsed * 0.5);
  const modelMatrix = multiply(ry, rx);

  // 法线矩阵 = 模型矩阵的逆转置（取 3×3 部分）
  const nMatrix = normalMatrix(modelMatrix);

  gl.uniformMatrix4fv(locs.uModelMatrix, false, modelMatrix);
  gl.uniformMatrix3fv(locs.uNormalMatrix, false, nMatrix);

  // 激活纹理单元 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 绘制
  gl.bindVertexArray(vao);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
