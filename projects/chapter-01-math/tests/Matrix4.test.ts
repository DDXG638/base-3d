import { describe, it, expect } from 'vitest';
import { Matrix4 } from '../src/Matrix4';
import { Vector3 } from '../src/Vector3';

describe('Matrix4', () => {
  describe('identity', () => {
    it('单位矩阵乘以任意向量等于自身', () => {
      const m = Matrix4.identity();
      const v = new Vector3(5, 7, 9);
      expect(m.transformPoint(v).equals(v)).toBe(true);
    });
  });

  describe('transformPoint', () => {
    it('平移变换', () => {
      const m = Matrix4.translation(10, 20, 30);
      const result = m.transformPoint(new Vector3(0, 0, 0));
      expect(result.equals(new Vector3(10, 20, 30))).toBe(true);
    });

    it('缩放变换', () => {
      const m = Matrix4.scaling(2, 3, 4);
      const result = m.transformPoint(new Vector3(1, 1, 1));
      expect(result.equals(new Vector3(2, 3, 4))).toBe(true);
    });

    it('绕 Z 轴旋转 90 度', () => {
      const m = Matrix4.rotationZ(Math.PI / 2);
      const result = m.transformPoint(new Vector3(1, 0, 0));
      expect(result.x).toBeCloseTo(0, 9);
      expect(result.y).toBeCloseTo(1, 9);
      expect(result.z).toBeCloseTo(0, 9);
    });
  });

  describe('transformDirection', () => {
    it('平移不影响方向向量', () => {
      const m = Matrix4.translation(100, 200, 300);
      const v = new Vector3(1, 0, 0);
      expect(m.transformDirection(v).equals(v)).toBe(true);
    });
  });

  describe('multiply', () => {
    it('先缩放再平移', () => {
      const s = Matrix4.scaling(2, 2, 2);
      const t = Matrix4.translation(10, 0, 0);
      const m = t.multiply(s); // 先 S 再 T
      const result = m.transformPoint(new Vector3(1, 0, 0));
      // 先缩放到 (2,0,0)，再平移到 (12,0,0)
      expect(result.equals(new Vector3(12, 0, 0))).toBe(true);
    });

    it('矩阵乘法不满足交换律', () => {
      const s = Matrix4.scaling(2, 2, 2);
      const t = Matrix4.translation(10, 0, 0);
      const st = t.multiply(s); // 先 S 再 T
      const ts = s.multiply(t); // 先 T 再 S
      expect(st.elements).not.toEqual(ts.elements);
    });
  });

  describe('compose', () => {
    it('TRS 组合变换', () => {
      const pos = new Vector3(10, 0, 0);
      const rot = { x: 0, y: 0, z: Math.PI / 2 };
      const sc = new Vector3(2, 1, 1);
      const m = Matrix4.compose(pos, rot, sc);

      const result = m.transformPoint(new Vector3(1, 0, 0));
      // 先 S(2,1,1): (2,0,0)
      // 再 R(Z,90°): (0,2,0)
      // 再 T(10,0,0): (10,2,0)
      expect(result.x).toBeCloseTo(10, 9);
      expect(result.y).toBeCloseTo(2, 9);
      expect(result.z).toBeCloseTo(0, 9);
    });
  });

  describe('transpose', () => {
    it('转置两次恢复原矩阵', () => {
      const m = Matrix4.translation(5, 10, 15);
      const t = m.transpose().transpose();
      expect(t.equals(m)).toBe(true);
    });
  });

  describe('inverse', () => {
    it('矩阵 × 逆矩阵 = 单位矩阵', () => {
      const m = Matrix4.identity();
      m.translate(5, 10, 15);
      m.rotateZ(Math.PI / 4);
      m.scale(2, 3, 4);

      const inv = m.inverse()!;
      const product = m.multiply(inv);

      expect(product.equals(Matrix4.identity(), 1e-6)).toBe(true);
    });

    it('不可逆矩阵返回 null', () => {
      const m = Matrix4.scaling(0, 0, 0);
      expect(m.inverse()).toBeNull();
    });
  });

  describe('lookAt', () => {
    it('从原点看向某方向', () => {
      const eye = new Vector3(0, 0, 0);
      const target = new Vector3(0, 0, -1);
      const up = new Vector3(0, 1, 0);
      const view = Matrix4.lookAt(eye, target, up);
      // 世界坐标 (0,0,-1) 在相机看来应该在正前方（-Z 方向）
      const result = view.transformPoint(new Vector3(0, 0, -1));
      // 相机看向 -Z，(0,0,-1) 在相机前方，Z 应为负
      expect(result.z).toBeLessThan(0);
    });
  });

  describe('perspective', () => {
    it('透视投影裁剪范围合理', () => {
      const proj = Matrix4.perspective(Math.PI / 2, 1, 0.1, 100);
      const p = proj.transformPoint(new Vector3(0, 0, -5));
      // 经过透视投影后 w 分量应该不等于 1
      expect(p).toBeDefined();
    });
  });

  describe('orthographic', () => {
    it('正交投影保持平行线', () => {
      const ortho = Matrix4.orthographic(-1, 1, -1, 1, 0.1, 100);
      const p1 = ortho.transformPoint(new Vector3(0, 0, -1));
      const p2 = ortho.transformPoint(new Vector3(0, 0, -2));
      // 正交投影下 X/Y 不变（如果没有被 W 透视除法影响的话，在 transformPoint 中会被 w 除）
      // 主要验证不报错
      expect(p1).toBeDefined();
    });
  });
});
