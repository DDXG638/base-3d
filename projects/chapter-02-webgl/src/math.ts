/**
 * 4×4 矩阵工具（列主序，Float32Array(16)）
 * 仅提供 Chapter 2 渲染所需的 MVP 矩阵函数。
 */

export function identity(): Float32Array {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

export function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const rangeInv = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (near + far) * rangeInv;
  m[11] = -1;
  m[14] = near * far * rangeInv * 2;
  return m;
}

export function lookAt(
  eyeX: number, eyeY: number, eyeZ: number,
  targetX: number, targetY: number, targetZ: number,
  upX: number, upY: number, upZ: number,
): Float32Array {
  // 前方向 (看向目标)
  let fx = targetX - eyeX, fy = targetY - eyeY, fz = targetZ - eyeZ;
  const fLen = Math.sqrt(fx * fx + fy * fy + fz * fz);
  fx /= fLen; fy /= fLen; fz /= fLen;

  // 侧方向 (f × up)
  let sx = fy * upZ - fz * upY;
  let sy = fz * upX - fx * upZ;
  let sz = fx * upY - fy * upX;
  const sLen = Math.sqrt(sx * sx + sy * sy + sz * sz);
  sx /= sLen; sy /= sLen; sz /= sLen;

  // 正交化 up (s × f)
  const ux = sy * fz - sz * fy;
  const uy = sz * fx - sx * fz;
  const uz = sx * fy - sy * fx;

  const m = new Float32Array(16);
  m[0] = sx; m[4] = sy; m[8] = sz;   m[12] = -(sx * eyeX + sy * eyeY + sz * eyeZ);
  m[1] = ux; m[5] = uy; m[9] = uz;   m[13] = -(ux * eyeX + uy * eyeY + uz * eyeZ);
  m[2] = -fx; m[6] = -fy; m[10] = -fz; m[14] = fx * eyeX + fy * eyeY + fz * eyeZ;
  m[3] = 0;   m[7] = 0;   m[11] = 0;    m[15] = 1;
  return m;
}

export function rotationY(angle: number): Float32Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const m = identity();
  m[0] = c;  m[8] = s;
  m[2] = -s; m[10] = c;
  return m;
}

export function rotationX(angle: number): Float32Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const m = identity();
  m[5] = c;  m[9] = -s;
  m[6] = s;  m[10] = c;
  return m;
}

export function multiply(a: Float32Array, b: Float32Array): Float32Array {
  const r = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      r[col * 4 + row] =
        a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    }
  }
  return r;
}

/** 计算法线矩阵（模型矩阵的逆转置，只取 3×3 部分） */
export function normalMatrix(model: Float32Array): Float32Array {
  // 取 3×3 左上角
  const a = new Float64Array(9);
  a[0] = model[0]; a[1] = model[1]; a[2] = model[2];
  a[3] = model[4]; a[4] = model[5]; a[5] = model[6];
  a[6] = model[8]; a[7] = model[9]; a[8] = model[10];

  // 3×3 逆
  const inv = new Float64Array(9);
  const det =
    a[0] * (a[4] * a[8] - a[5] * a[7]) -
    a[1] * (a[3] * a[8] - a[5] * a[6]) +
    a[2] * (a[3] * a[7] - a[4] * a[6]);

  if (Math.abs(det) < 1e-12) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  const invDet = 1 / det;
  inv[0] = (a[4] * a[8] - a[5] * a[7]) * invDet;
  inv[1] = (a[2] * a[7] - a[1] * a[8]) * invDet;
  inv[2] = (a[1] * a[5] - a[2] * a[4]) * invDet;
  inv[3] = (a[5] * a[6] - a[3] * a[8]) * invDet;
  inv[4] = (a[0] * a[8] - a[2] * a[6]) * invDet;
  inv[5] = (a[2] * a[3] - a[0] * a[5]) * invDet;
  inv[6] = (a[3] * a[7] - a[4] * a[6]) * invDet;
  inv[7] = (a[1] * a[6] - a[0] * a[7]) * invDet;
  inv[8] = (a[0] * a[4] - a[1] * a[3]) * invDet;

  // 转置（col-major 格式）
  return new Float32Array([
    inv[0], inv[3], inv[6],
    inv[1], inv[4], inv[7],
    inv[2], inv[5], inv[8],
  ]);
}
