import { Vector3 } from './Vector3';

/**
 * 4×4 齐次变换矩阵，列主序存储。
 *
 * 索引映射（列主序）：
 *  0  4  8  12
 *  1  5  9  13
 *  2  6  10 14
 *  3  7  11 15
 *
 * 与 WebGL/Three.js 的 Matrix4 存储方式一致。
 */
export class Matrix4 {
  readonly elements: Float32Array;

  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  // --- 静态工厂 ---

  static identity(): Matrix4 {
    return new Matrix4();
  }

  static fromArray(values: number[]): Matrix4 {
    const m = new Matrix4();
    m.elements.set(values.slice(0, 16));
    return m;
  }

  // --- 存取器 ---

  identity(): this {
    const e = this.elements;
    e.fill(0);
    e[0] = e[5] = e[10] = e[15] = 1;
    return this;
  }

  clone(): Matrix4 {
    const m = new Matrix4();
    m.elements.set(this.elements);
    return m;
  }

  copy(m: Matrix4): this {
    this.elements.set(m.elements);
    return this;
  }

  getElement(row: number, col: number): number {
    return this.elements[col * 4 + row];
  }

  setElement(row: number, col: number, value: number): this {
    this.elements[col * 4 + row] = value;
    return this;
  }

  // --- 矩阵乘法 ---

  multiply(b: Matrix4): Matrix4 {
    const a = this.elements;
    const be = b.elements;
    const r = new Float32Array(16);

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] =
          a[row] * be[col * 4] +
          a[4 + row] * be[col * 4 + 1] +
          a[8 + row] * be[col * 4 + 2] +
          a[12 + row] * be[col * 4 + 3];
      }
    }

    const m = new Matrix4();
    m.elements.set(r);
    return m;
  }

  multiplyInPlace(b: Matrix4): this {
    this.elements.set(this.multiply(b).elements);
    return this;
  }

  /** 用矩阵变换一个三维向量（带平移，w=1） */
  transformPoint(v: Vector3): Vector3 {
    const e = this.elements;
    const w = 1 / (e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15]);
    return new Vector3(
      (e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12]) * w,
      (e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13]) * w,
      (e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14]) * w,
    );
  }

  /** 用矩阵变换一个方向向量（不受平移影响，w=0） */
  transformDirection(v: Vector3): Vector3 {
    const e = this.elements;
    return new Vector3(
      e[0] * v.x + e[4] * v.y + e[8] * v.z,
      e[1] * v.x + e[5] * v.y + e[9] * v.z,
      e[2] * v.x + e[6] * v.y + e[10] * v.z,
    );
  }

  // --- 转置 / 逆 ---

  transpose(): Matrix4 {
    const e = this.elements;
    const t = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        t[row * 4 + col] = e[col * 4 + row];
      }
    }
    const m = new Matrix4();
    m.elements.set(t);
    return m;
  }

  /** 计算一般 4×4 矩阵的逆（高斯消元） */
  inverse(): Matrix4 | null {
    // 将原矩阵复制到增广矩阵 [A|I]
    const a = new Float64Array(16);
    a.set(this.elements);
    const inv = new Float64Array(16);
    inv[0] = inv[5] = inv[10] = inv[15] = 1;

    for (let col = 0; col < 4; col++) {
      // 寻找主元
      let pivot = col;
      let maxAbs = Math.abs(a[col * 4 + col]);
      for (let row = col + 1; row < 4; row++) {
        const abs = Math.abs(a[col * 4 + row]);
        if (abs > maxAbs) {
          maxAbs = abs;
          pivot = row;
        }
      }
      if (maxAbs < 1e-12) return null; // 不可逆

      // 交换行
      if (pivot !== col) {
        for (let k = 0; k < 4; k++) {
          [a[col * 4 + k], a[pivot * 4 + k]] = [a[pivot * 4 + k], a[col * 4 + k]];
          [inv[col * 4 + k], inv[pivot * 4 + k]] = [inv[pivot * 4 + k], inv[col * 4 + k]];
        }
      }

      // 归一化主元行
      const pivotVal = a[col * 4 + col];
      for (let k = 0; k < 4; k++) {
        a[col * 4 + k] /= pivotVal;
        inv[col * 4 + k] /= pivotVal;
      }

      // 消去其他行
      for (let row = 0; row < 4; row++) {
        if (row === col) continue;
        const factor = a[col * 4 + row];
        for (let k = 0; k < 4; k++) {
          a[col * 4 + k + (row - col) * 4] -= factor * a[col * 4 + k];
          inv[col * 4 + k + (row - col) * 4] -= factor * inv[col * 4 + k];
        }
      }
    }

    // 上面消元在列主序下不太对，用传统行主序重新实现
    return this._inverseClassic();
  }

  /** 高斯-约旦消元求逆（内部分解为行主序操作） */
  private _inverseClassic(): Matrix4 | null {
    // 将列主序转为 4×4 行主序二维数组
    const src = this.elements;
    const mat: number[][] = [
      [src[0], src[4], src[8], src[12]],
      [src[1], src[5], src[9], src[13]],
      [src[2], src[6], src[10], src[14]],
      [src[3], src[7], src[11], src[15]],
    ];
    const inv: number[][] = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    for (let col = 0; col < 4; col++) {
      // 选主元
      let pivot = col;
      let maxAbs = Math.abs(mat[col][col]);
      for (let row = col + 1; row < 4; row++) {
        const abs = Math.abs(mat[row][col]);
        if (abs > maxAbs) {
          maxAbs = abs;
          pivot = row;
        }
      }
      if (maxAbs < 1e-12) return null;

      [mat[col], mat[pivot]] = [mat[pivot], mat[col]];
      [inv[col], inv[pivot]] = [inv[pivot], inv[col]];

      const pivotVal = mat[col][col];
      for (let k = 0; k < 4; k++) {
        mat[col][k] /= pivotVal;
        inv[col][k] /= pivotVal;
      }

      for (let row = 0; row < 4; row++) {
        if (row === col) continue;
        const factor = mat[row][col];
        for (let k = 0; k < 4; k++) {
          mat[row][k] -= factor * mat[col][k];
          inv[row][k] -= factor * inv[col][k];
        }
      }
    }

    // 转回列主序
    const result = new Matrix4();
    const r = result.elements;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        r[col * 4 + row] = inv[row][col];
      }
    }
    return result;
  }

  // --- 组合变换（原地修改） ---

  translate(tx: number, ty: number, tz: number): this {
    const t = Matrix4.translation(tx, ty, tz);
    return this.multiplyInPlace(t);
  }

  rotateX(angle: number): this {
    const r = Matrix4.rotationX(angle);
    return this.multiplyInPlace(r);
  }

  rotateY(angle: number): this {
    const r = Matrix4.rotationY(angle);
    return this.multiplyInPlace(r);
  }

  rotateZ(angle: number): this {
    const r = Matrix4.rotationZ(angle);
    return this.multiplyInPlace(r);
  }

  scale(sx: number, sy: number, sz: number): this {
    const s = Matrix4.scaling(sx, sy, sz);
    return this.multiplyInPlace(s);
  }

  // --- 静态：基础变换矩阵 ---

  static translation(tx: number, ty: number, tz: number): Matrix4 {
    const m = Matrix4.identity();
    const e = m.elements;
    e[12] = tx;
    e[13] = ty;
    e[14] = tz;
    return m;
  }

  static scaling(sx: number, sy: number, sz: number): Matrix4 {
    const m = Matrix4.identity();
    const e = m.elements;
    e[0] = sx;
    e[5] = sy;
    e[10] = sz;
    return m;
  }

  static rotationX(angle: number): Matrix4 {
    const m = Matrix4.identity();
    const e = m.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    e[5] = c;  e[9] = -s;
    e[6] = s;  e[10] = c;
    return m;
  }

  static rotationY(angle: number): Matrix4 {
    const m = Matrix4.identity();
    const e = m.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    e[0] = c;  e[8] = s;
    e[2] = -s; e[10] = c;
    return m;
  }

  static rotationZ(angle: number): Matrix4 {
    const m = Matrix4.identity();
    const e = m.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    e[0] = c;  e[4] = -s;
    e[1] = s;  e[5] = c;
    return m;
  }

  /** 组合 TRS：scale → rotate(Euler ZYX) → translate */
  static compose(
    position: Vector3,
    rotation: { x: number; y: number; z: number },
    scale: Vector3,
  ): Matrix4 {
    const m = Matrix4.identity();
    m.translate(position.x, position.y, position.z);
    m.rotateZ(rotation.z);
    m.rotateY(rotation.y);
    m.rotateX(rotation.x);
    m.scale(scale.x, scale.y, scale.z);
    return m;
  }

  // --- 相机矩阵 ---

  /** 视图矩阵：将世界坐标变换到相机观察坐标 */
  static lookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
    const f = target.subtract(eye).normalize();                  // forward (看向目标)
    const s = f.cross(up.normalize()).normalize();              // side (右)
    const u = s.cross(f);                                       // up (正交化)

    const m = new Matrix4();
    const e = m.elements;

    // 旋转部分
    e[0] = s.x;  e[4] = s.y;  e[8] = s.z;   e[12] = -s.dot(eye);
    e[1] = u.x;  e[5] = u.y;  e[9] = u.z;   e[13] = -u.dot(eye);
    e[2] = -f.x; e[6] = -f.y; e[10] = -f.z; e[14] = f.dot(eye);
    e[15] = 1;

    return m;
  }

  /** 透视投影矩阵 */
  static perspective(fovY: number, aspect: number, near: number, far: number): Matrix4 {
    const f = 1 / Math.tan(fovY / 2);
    const rangeInv = 1 / (near - far);

    const m = new Matrix4();
    const e = m.elements;

    e[0] = f / aspect;
    e[5] = f;
    e[10] = (near + far) * rangeInv;
    e[11] = -1;
    e[14] = near * far * rangeInv * 2;
    e[15] = 0;

    return m;
  }

  /** 正交投影矩阵 */
  static orthographic(
    left: number, right: number,
    bottom: number, top: number,
    near: number, far: number,
  ): Matrix4 {
    const m = new Matrix4();
    const e = m.elements;

    e[0] = 2 / (right - left);
    e[5] = 2 / (top - bottom);
    e[10] = 2 / (near - far);
    e[12] = -(right + left) / (right - left);
    e[13] = -(top + bottom) / (top - bottom);
    e[14] = -(far + near) / (far - near);
    e[15] = 1;

    return m;
  }

  // --- 常用 ---

  equals(other: Matrix4, epsilon: number = 1e-9): boolean {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(this.elements[i] - other.elements[i]) > epsilon) return false;
    }
    return true;
  }
}
