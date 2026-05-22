varying vec3 vColor;
varying float vAlpha;

void main() {
  // 圆形粒子 — 丢弃圆外的片元
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // 中心亮边缘暗的渐变
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= vAlpha;

  gl_FragColor = vec4(vColor, alpha);
}
