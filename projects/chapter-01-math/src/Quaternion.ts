import { Vector3 } from './Vector3';
import { Matrix4 } from './Matrix4';

export class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  // --- 静态工厂 ---

  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  /** 从欧拉角创建（顺序 ZYX） */
  static fromEuler(x: number, y: number, z: number): Quaternion {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    // ZYX 顺序
    return new Quaternion(
      sx * cy * cz - cx * sy * sz,   // x
      cx * sy * cz + sx * cy * sz,   // y
      cx * cy * sz - sx * sy * cz,   // z
      cx * cy * cz + sx * sy * sz,   // w
    );
  }

  /** 绕任意轴旋转 */
  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const half = angle * 0.5;
    const s = Math.sin(half);
    const n = axis.normalize();
    return new Quaternion(n.x * s, n.y * s, n.z * s, Math.cos(half));
  }

  // --- 基本操作 ---

  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  copy(q: Quaternion): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  length(): number {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
    );
  }

  normalize(): Quaternion {
    const len = this.length();
    if (len === 0) return Quaternion.identity();
    return new Quaternion(
      this.x / len,
      this.y / len,
      this.z / len,
      this.w / len,
    );
  }

  normalizeInPlace(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
      this.w /= len;
    }
    return this;
  }

  /** 共轭 */
  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  /** 逆 */
  inverse(): Quaternion {
    const lenSq = this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2;
    if (lenSq === 0) return Quaternion.identity();
    const inv = 1 / lenSq;
    return new Quaternion(-this.x * inv, -this.y * inv, -this.z * inv, this.w * inv);
  }

  // --- 乘法 ---

  multiply(q: Quaternion): Quaternion {
    return new Quaternion(
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z,
      this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x,
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
    );
  }

  // --- 旋转向量 ---

  /** 用此四元数旋转一个向量 */
  rotateVector(v: Vector3): Vector3 {
    const qv = new Quaternion(v.x, v.y, v.z, 0);
    const q = this.normalize();
    const result = q.multiply(qv).multiply(q.conjugate());
    return new Vector3(result.x, result.y, result.z);
  }

  // --- 插值 ---

  /** 球面线性插值 */
  slerp(target: Quaternion, t: number): Quaternion {
    let cosTheta = this.x * target.x + this.y * target.y + this.z * target.z + this.w * target.w;

    // 如果夹角为负，取反一个四元数以走最短路径
    let qx = target.x, qy = target.y, qz = target.z, qw = target.w;
    if (cosTheta < 0) {
      qx = -qx;
      qy = -qy;
      qz = -qz;
      qw = -qw;
      cosTheta = -cosTheta;
    }

    // 夹角非常小时退化为线性插值
    if (cosTheta > 0.9999) {
      const result = new Quaternion(
        this.x + (qx - this.x) * t,
        this.y + (qy - this.y) * t,
        this.z + (qz - this.z) * t,
        this.w + (qw - this.w) * t,
      );
      return result.normalize();
    }

    const theta = Math.acos(cosTheta);
    const sinTheta = Math.sin(theta);
    const a = Math.sin((1 - t) * theta) / sinTheta;
    const b = Math.sin(t * theta) / sinTheta;

    return new Quaternion(
      this.x * a + qx * b,
      this.y * a + qy * b,
      this.z * a + qz * b,
      this.w * a + qw * b,
    );
  }

  // --- 矩阵转换 ---

  toMatrix4(): Matrix4 {
    const x = this.x, y = this.y, z = this.z, w = this.w;
    const xx = x * x, yy = y * y, zz = z * z;
    const xy = x * y, xz = x * z, yz = y * z;
    const wx = w * x, wy = w * y, wz = w * z;

    const m = Matrix4.identity();
    const e = m.elements;

    e[0] = 1 - 2 * (yy + zz);
    e[1] = 2 * (xy + wz);
    e[2] = 2 * (xz - wy);

    e[4] = 2 * (xy - wz);
    e[5] = 1 - 2 * (xx + zz);
    e[6] = 2 * (yz + wx);

    e[8] = 2 * (xz + wy);
    e[9] = 2 * (yz - wx);
    e[10] = 1 - 2 * (xx + yy);

    return m;
  }

  // --- 欧拉角（ZYX 顺序） ---

  toEuler(): { x: number; y: number; z: number } {
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    const x = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (this.w * this.y - this.z * this.x);
    const y = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);

    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    const z = Math.atan2(siny_cosp, cosy_cosp);

    return { x, y, z };
  }

  // --- 常用 ---

  equals(q: Quaternion, epsilon: number = 1e-9): boolean {
    return (
      Math.abs(this.x - q.x) <= epsilon &&
      Math.abs(this.y - q.y) <= epsilon &&
      Math.abs(this.z - q.z) <= epsilon &&
      Math.abs(this.w - q.w) <= epsilon
    );
  }
}
