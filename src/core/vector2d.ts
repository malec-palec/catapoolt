export class Vector2D {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static create(x: number = 0, y: number = 0): Vector2D {
    return new Vector2D(x, y);
  }

  static fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return new Vector2D(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }

  static random(): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return Vector2D.fromAngle(angle);
  }

  static add(v1: Vector2D, v2: Vector2D): Vector2D {
    return new Vector2D(v1.x + v2.x, v1.y + v2.y);
  }

  static sub(v1: Vector2D, v2: Vector2D): Vector2D {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  static mult(v: Vector2D, scalar: number): Vector2D {
    return new Vector2D(v.x * scalar, v.y * scalar);
  }

  static div(v: Vector2D, scalar: number): Vector2D {
    return new Vector2D(v.x / scalar, v.y / scalar);
  }

  static dot(v1: Vector2D, v2: Vector2D): number {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static dist(v1: Vector2D, v2: Vector2D): number {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

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
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
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
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  set(x: number, y: number): Vector2D {
    this.x = x;
    this.y = y;
    return this;
  }

  lerp(other: Vector2D, amount: number): Vector2D {
    this.x += (other.x - this.x) * amount;
    this.y += (other.y - this.y) * amount;
    return this;
  }

  toString(): string {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
