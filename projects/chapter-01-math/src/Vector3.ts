export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  // --- 静态工厂 ---

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  static one(): Vector3 {
    return new Vector3(1, 1, 1);
  }

  static up(): Vector3 {
    return new Vector3(0, 1, 0);
  }

  static right(): Vector3 {
    return new Vector3(1, 0, 0);
  }

  static forward(): Vector3 {
    return new Vector3(0, 0, 1);
  }

  // --- 基本运算（返回新对象，不修改原对象） ---

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: number): Vector3 {
    return new Vector3(this.x * s, this.y * s, this.z * s);
  }

  negate(): Vector3 {
    return new Vector3(-this.x, -this.y, -this.z);
  }

  // --- 原地运算（修改自身，返回 this 支持链式调用） ---

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: Vector3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  addInPlace(v: Vector3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  scaleInPlace(s: number): this {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  // --- 向量属性 ---

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3 {
    const len = this.length();
    if (len === 0) return new Vector3(0, 0, 0);
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  normalizeInPlace(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  distanceTo(v: Vector3): number {
    return this.subtract(v).length();
  }

  // --- 向量代数 ---

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    );
  }

  angleTo(v: Vector3): number {
    const denom = Math.sqrt(this.lengthSquared() * v.lengthSquared());
    if (denom === 0) return 0;
    const cosTheta = Math.max(-1, Math.min(1, this.dot(v) / denom));
    return Math.acos(cosTheta);
  }

  // --- 插值与比较 ---

  lerp(target: Vector3, t: number): Vector3 {
    return new Vector3(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t,
      this.z + (target.z - this.z) * t,
    );
  }

  equals(v: Vector3, epsilon: number = 1e-9): boolean {
    return (
      Math.abs(this.x - v.x) <= epsilon &&
      Math.abs(this.y - v.y) <= epsilon &&
      Math.abs(this.z - v.z) <= epsilon
    );
  }

  // --- 投影 ---

  projectOnPlane(planeNormal: Vector3): Vector3 {
    const n = planeNormal.normalize();
    const dot = this.dot(n);
    return new Vector3(
      this.x - dot * n.x,
      this.y - dot * n.y,
      this.z - dot * n.z,
    );
  }

  reflect(normal: Vector3): Vector3 {
    const n = normal.normalize();
    const dot = this.dot(n) * 2;
    return new Vector3(
      this.x - dot * n.x,
      this.y - dot * n.y,
      this.z - dot * n.z,
    );
  }
}
