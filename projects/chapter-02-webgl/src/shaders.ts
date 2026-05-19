/** GLSL 着色器源码 */
export const vertexShaderSrc = `#version 300 es
// 输入：顶点属性
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

// 输出：传递给片元着色器（经过光栅化插值）
out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;

// Uniform：所有顶点共享
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

void main() {
    // 计算世界空间中的顶点位置
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;

    // 法线需要用法线矩阵变换（模型矩阵的逆转置）
    // 忽略平移分量，保证非均匀缩放下法线仍然正确
    vNormal = normalize(mat3(uNormalMatrix) * aNormal);

    vTexCoord = aTexCoord;

    // MVP 变换 → 裁剪空间坐标（必须输出 gl_Position）
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

export const fragmentShaderSrc = `#version 300 es
precision highp float;

// 输入：从顶点着色器插值而来
in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;

// Uniform
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform sampler2D uTexture;

// 输出
out vec4 fragColor;

void main() {
    // 归一化插值后的法线（光栅化插值可能导致长度不为 1）
    vec3 N = normalize(vNormal);

    // 1. 环境光 (Ambient) — 模拟间接光照，所有方向均等
    vec3 ambient = uAmbientColor;

    // 2. 漫反射 (Diffuse) — Lambert 模型
    vec3 lightDir = normalize(uLightPos - vWorldPos);
    float diff = max(dot(N, lightDir), 0.0);
    vec3 diffuse = diff * uDiffuseColor;

    // 3. 镜面高光 (Specular) — Blinn-Phong 半向量模型
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(N, halfVec), 0.0), uShininess);
    vec3 specular = spec * uSpecularColor;

    // 采样纹理作为物体基础色
    vec3 texColor = texture(uTexture, vTexCoord).rgb;

    // 组合光照：环境 + 漫反射×纹理色 + 镜面（镜面通常不带纹理色，保持光源颜色）
    vec3 result = ambient * texColor + diffuse * texColor + specular;

    fragColor = vec4(result, 1.0);
}
`;
