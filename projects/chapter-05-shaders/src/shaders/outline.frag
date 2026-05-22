varying vec3 vNormal;
varying vec3 vViewDir;
uniform vec3 uColor;
uniform float uThickness;

void main() {
  // 菲涅尔效应 — 边缘（法线与视线夹角大）更亮
  float fresnel = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
  fresnel = pow(fresnel, uThickness);

  // 只渲染边缘
  float alpha = smoothstep(0.3, 0.7, fresnel);

  gl_FragColor = vec4(uColor, alpha);
}
