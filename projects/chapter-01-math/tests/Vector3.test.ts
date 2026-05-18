import { describe, it, expect } from 'vitest';
import { Vector3 } from '../src/Vector3';

describe('Vector3', () => {
  describe('静态工厂', () => {
    it('zero() 返回零向量', () => {
      expect(Vector3.zero().equals(new Vector3(0, 0, 0))).toBe(true);
    });

    it('up() 返回 Y 轴正方向', () => {
      expect(Vector3.up().equals(new Vector3(0, 1, 0))).toBe(true);
    });

    it('right() 返回 X 轴正方向', () => {
      expect(Vector3.right().equals(new Vector3(1, 0, 0))).toBe(true);
    });

    it('forward() 返回 Z 轴正方向', () => {
      expect(Vector3.forward().equals(new Vector3(0, 0, 1))).toBe(true);
    });
  });

  describe('基本运算', () => {
    it('add() 两个向量相加', () => {
      const a = new Vector3(1, 2, 3);
      const b = new Vector3(4, 5, 6);
      expect(a.add(b).equals(new Vector3(5, 7, 9))).toBe(true);
    });

    it('subtract() 两个向量相减', () => {
      const a = new Vector3(5, 7, 9);
      const b = new Vector3(1, 2, 3);
      expect(a.subtract(b).equals(new Vector3(4, 5, 6))).toBe(true);
    });

    it('scale() 标量乘法', () => {
      expect(new Vector3(1, 2, 3).scale(2).equals(new Vector3(2, 4, 6))).toBe(true);
    });

    it('negate() 取反', () => {
      expect(new Vector3(1, -2, 3).negate().equals(new Vector3(-1, 2, -3))).toBe(true);
    });
  });

  describe('原地运算', () => {
    it('addInPlace() 原地加法', () => {
      const v = new Vector3(1, 2, 3);
      v.addInPlace(new Vector3(4, 5, 6));
      expect(v.equals(new Vector3(5, 7, 9))).toBe(true);
    });

    it('scaleInPlace() 原地缩放', () => {
      const v = new Vector3(1, 2, 3);
      v.scaleInPlace(3);
      expect(v.equals(new Vector3(3, 6, 9))).toBe(true);
    });
  });

  describe('向量属性', () => {
    it('length() 计算向量长度', () => {
      expect(new Vector3(3, 4, 0).length()).toBe(5);
      expect(new Vector3(1, 0, 0).length()).toBe(1);
    });

    it('lengthSquared() 计算长度平方', () => {
      expect(new Vector3(3, 4, 0).lengthSquared()).toBe(25);
    });

    it('normalize() 归一化', () => {
      const n = new Vector3(3, 0, 0).normalize();
      expect(n.equals(new Vector3(1, 0, 0))).toBe(true);
    });

    it('normalize() 零向量归一化返回零向量', () => {
      expect(Vector3.zero().normalize().equals(Vector3.zero())).toBe(true);
    });

    it('distanceTo() 计算两点距离', () => {
      expect(new Vector3(0, 0, 0).distanceTo(new Vector3(3, 4, 0))).toBe(5);
    });
  });

  describe('向量代数', () => {
    it('dot() 点乘——垂直向量结果为 0', () => {
      expect(new Vector3(1, 0, 0).dot(new Vector3(0, 1, 0))).toBe(0);
    });

    it('dot() 点乘——同向向量结果为正', () => {
      expect(new Vector3(2, 0, 0).dot(new Vector3(3, 0, 0))).toBe(6);
    });

    it('dot() 点乘——反向向量结果为负', () => {
      expect(new Vector3(1, 0, 0).dot(new Vector3(-1, 0, 0))).toBe(-1);
    });

    it('cross() 叉乘——X × Y = Z', () => {
      const result = new Vector3(1, 0, 0).cross(new Vector3(0, 1, 0));
      expect(result.equals(new Vector3(0, 0, 1))).toBe(true);
    });

    it('cross() 叉乘——Y × X = -Z', () => {
      const result = new Vector3(0, 1, 0).cross(new Vector3(1, 0, 0));
      expect(result.equals(new Vector3(0, 0, -1))).toBe(true);
    });

    it('cross() 平行向量叉乘为零向量', () => {
      const result = new Vector3(1, 0, 0).cross(new Vector3(2, 0, 0));
      expect(result.equals(Vector3.zero())).toBe(true);
    });

    it('angleTo() 计算两向量夹角', () => {
      const angle = new Vector3(1, 0, 0).angleTo(new Vector3(0, 1, 0));
      expect(angle).toBeCloseTo(Math.PI / 2, 9);
    });
  });

  describe('插值与比较', () => {
    it('lerp() t=0 返回起点', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, 0).equals(a)).toBe(true);
    });

    it('lerp() t=1 返回终点', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, 1).equals(b)).toBe(true);
    });

    it('lerp() t=0.5 返回中点', () => {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 10, 10);
      expect(a.lerp(b, 0.5).equals(new Vector3(5, 5, 5))).toBe(true);
    });
  });

  describe('投影', () => {
    it('projectOnPlane() 投影到水平面', () => {
      const v = new Vector3(1, 5, 2);
      const result = v.projectOnPlane(new Vector3(0, 1, 0));
      expect(result.equals(new Vector3(1, 0, 2))).toBe(true);
    });

    it('reflect() 反射', () => {
      const v = new Vector3(1, -1, 0);
      const normal = new Vector3(0, 1, 0);
      const result = v.reflect(normal);
      expect(result.equals(new Vector3(1, 1, 0))).toBe(true);
    });
  });

  describe('clone', () => {
    it('clone() 创建独立副本', () => {
      const a = new Vector3(1, 2, 3);
      const b = a.clone();
      b.x = 99;
      expect(a.x).toBe(1);
      expect(b.x).toBe(99);
    });
  });
});
