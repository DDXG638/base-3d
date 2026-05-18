import { describe, it, expect } from 'vitest';
import { Quaternion } from '../src/Quaternion';
import { Vector3 } from '../src/Vector3';

describe('Quaternion', () => {
  describe('静态工厂', () => {
    it('identity() 返回单位四元数', () => {
      const q = Quaternion.identity();
      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
      expect(q.w).toBe(1);
    });

    it('identity 旋转向量不改变它', () => {
      const v = new Vector3(1, 2, 3);
      const result = Quaternion.identity().rotateVector(v);
      expect(result.x).toBeCloseTo(1, 9);
      expect(result.y).toBeCloseTo(2, 9);
      expect(result.z).toBeCloseTo(3, 9);
    });
  });

  describe('fromAxisAngle', () => {
    it('绕 Y 轴旋转 90 度将 X 轴转到 Z 轴', () => {
      const q = Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      const result = q.rotateVector(new Vector3(1, 0, 0));
      expect(result.x).toBeCloseTo(0, 9);
      expect(result.y).toBeCloseTo(0, 9);
      expect(result.z).toBeCloseTo(-1, 9);
    });

    it('绕 X 轴旋转 90 度将 Y 轴转到 Z 轴', () => {
      const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
      const result = q.rotateVector(new Vector3(0, 1, 0));
      expect(result.x).toBeCloseTo(0, 9);
      expect(result.y).toBeCloseTo(0, 9);
      expect(result.z).toBeCloseTo(1, 9);
    });
  });

  describe('fromEuler', () => {
    it('欧拉角 (0, π/2, 0) 等效于绕 Y 轴旋转 90 度', () => {
      const q = Quaternion.fromEuler(0, Math.PI / 2, 0);
      const result = q.rotateVector(new Vector3(1, 0, 0));
      expect(result.x).toBeCloseTo(0, 9);
      expect(result.z).toBeCloseTo(-1, 9);
    });

    it('欧拉角 (π/2, 0, 0) 等效于绕 X 轴旋转 90 度', () => {
      const q = Quaternion.fromEuler(Math.PI / 2, 0, 0);
      const result = q.rotateVector(new Vector3(0, 1, 0));
      expect(result.z).toBeCloseTo(1, 9);
    });
  });

  describe('multiply', () => {
    it('两次旋转等价于一次组合旋转', () => {
      const q1 = Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
      // 先 Y 轴旋转，再 X 轴旋转
      const combined = q2.multiply(q1); // q2 * q1 表示先 q1 再 q2
      const v = new Vector3(1, 0, 0);
      const twoStep = q2.rotateVector(q1.rotateVector(v));
      const oneStep = combined.rotateVector(v);
      expect(oneStep.x).toBeCloseTo(twoStep.x, 9);
      expect(oneStep.y).toBeCloseTo(twoStep.y, 9);
      expect(oneStep.z).toBeCloseTo(twoStep.z, 9);
    });
  });

  describe('rotateVector', () => {
    it('旋转后向量长度不变', () => {
      const q = Quaternion.fromAxisAngle(new Vector3(1, 0.5, 0.2), Math.PI / 3);
      const v = new Vector3(3, 4, 5);
      const result = q.rotateVector(v);
      expect(result.length()).toBeCloseTo(v.length(), 9);
    });
  });

  describe('normalize', () => {
    it('归一化后长度为 1', () => {
      const q = new Quaternion(2, 2, 2, 2);
      expect(q.normalize().length()).toBeCloseTo(1, 9);
    });
  });

  describe('conjugate / inverse', () => {
    it('四元数 × 逆 = 单位四元数', () => {
      const q = Quaternion.fromAxisAngle(new Vector3(1, 0.5, 0.2), Math.PI / 3);
      const inv = q.inverse();
      const result = q.multiply(inv);
      expect(result.x).toBeCloseTo(0, 9);
      expect(result.y).toBeCloseTo(0, 9);
      expect(result.z).toBeCloseTo(0, 9);
      expect(result.w).toBeCloseTo(1, 9);
    });
  });

  describe('slerp', () => {
    it('slerp(t=0) 返回起始四元数', () => {
      const a = Quaternion.fromEuler(0, 0, 0);
      const b = Quaternion.fromEuler(0, Math.PI, 0);
      const result = a.slerp(b, 0);
      expect(result.equals(a, 1e-9)).toBe(true);
    });

    it('slerp(t=1) 返回目标四元数', () => {
      const a = Quaternion.fromEuler(0, 0, 0);
      const b = Quaternion.fromEuler(0, Math.PI, 0);
      const result = a.slerp(b, 1);
      expect(result.equals(b, 1e-9)).toBe(true);
    });

    it('slerp(t=0.5) 返回中间旋转', () => {
      const a = Quaternion.fromEuler(0, 0, 0);
      const b = Quaternion.fromEuler(0, Math.PI / 2, 0);
      const mid = a.slerp(b, 0.5);
      const v = new Vector3(1, 0, 0);
      const result = mid.rotateVector(v);
      // 从 X 轴旋转到 Z 轴的一半是 XZ 对角
      const expected = Math.SQRT1_2; // cos(π/4) = sin(π/4)
      expect(result.x).toBeCloseTo(expected, 5);
      expect(result.z).toBeCloseTo(-expected, 5);
    });
  });

  describe('toMatrix4', () => {
    it('四元数转矩阵旋转效果一致', () => {
      const q = Quaternion.fromEuler(0.3, 0.5, 0.7);
      const v = new Vector3(2, 3, 4);
      const byQuat = q.rotateVector(v);
      const byMatrix = q.toMatrix4().transformDirection(v);
      expect(byQuat.x).toBeCloseTo(byMatrix.x, 6);
      expect(byQuat.y).toBeCloseTo(byMatrix.y, 6);
      expect(byQuat.z).toBeCloseTo(byMatrix.z, 6);
    });
  });

  describe('toEuler', () => {
    it('fromEuler → toEuler 往返一致', () => {
      const original = { x: 0.3, y: 0.5, z: 0.7 };
      const q = Quaternion.fromEuler(original.x, original.y, original.z);
      const euler = q.toEuler();
      expect(euler.x).toBeCloseTo(original.x, 9);
      expect(euler.y).toBeCloseTo(original.y, 9);
      expect(euler.z).toBeCloseTo(original.z, 9);
    });
  });
});
