varying vec3 vColor;
varying float vAlpha;
uniform float uTime;

// 简单的伪随机函数
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  // position 是 Three.js 自动注入的顶点位置
  vec3 pos = position;

  // 基于粒子 ID 计算不同的相位和频率
  float id = float(gl_VertexID);
  float phase = hash(id * 0.1) * 6.28;
  float freq = hash(id * 0.3) * 2.0 + 0.5;

  // 波浪偏移 — 粒子在 Y 轴上下浮动
  float dist = length(pos.xz);
  float wave = sin(dist * 2.5 - uTime * freq + phase) * 0.8;
  wave += cos(pos.x * 3.0 + uTime * 1.3 + phase) * 0.3;

  pos.y += wave;

  // 颜色 — 基于高度映射到渐变
  float t = (wave + 1.1) / 2.2; // 归一化到 0~1
  vColor = mix(
    vec3(0.1, 0.4, 0.9),       // 低位：蓝色
    vec3(0.9, 0.3, 0.6),       // 高位：粉色
    t
  );

  // 透明度 — 波浪峰值最亮
  vAlpha = 0.4 + t * 0.6;

  gl_PointSize = 6.0 + wave * 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
