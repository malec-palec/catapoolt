import { atan2, cos, hypot, random, sin, TWO_PI } from "../system";

export const vecDist = (v1: Vector2D, v2: Vector2D): number => hypot(v1.x - v2.x, v1.y - v2.y);

export const vecFromAngle = (angle: number, magnitude: number = 1): Vector2D =>
  new Vector2D(cos(angle) * magnitude, sin(angle) * magnitude);

export const vecRandom = (): Vector2D => vecFromAngle(random() * TWO_PI);

export const vecAdd = (v1: Vector2D, v2: Vector2D): Vector2D => new Vector2D(v1.x + v2.x, v1.y + v2.y);

export const vecSub = (v1: Vector2D, v2: Vector2D): Vector2D => new Vector2D(v1.x - v2.x, v1.y - v2.y);

export const vecMult = (v: Vector2D, scalar: number): Vector2D => new Vector2D(v.x * scalar, v.y * scalar);

export class Vector2D {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}

  copy(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  add(other: Vector2D): Vector2D {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  sub(other: Vector2D): Vector2D {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  mult(scalar: number): Vector2D {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  div(scalar: number): Vector2D {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  mag(): number {
    return hypot(this.x, this.y);
  }

  normalize(): Vector2D {
    const magnitude = this.mag();
    if (magnitude > 0) {
      this.div(magnitude);
    }
    return this;
  }

  setMag(magnitude: number): Vector2D {
    this.normalize();
    this.mult(magnitude);
    return this;
  }

  limit(max: number): Vector2D {
    const magnitude = this.mag();
    if (magnitude > max) {
      this.setMag(max);
    }
    return this;
  }

  heading(): number {
    return atan2(this.y, this.x);
  }

  set(x: number, y: number): Vector2D {
    this.x = x;
    this.y = y;
    return this;
  }
}
