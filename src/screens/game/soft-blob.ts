export interface ICircleCollider {
  position: Vector2D;
  radius: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

const DAMPING = 0.99;
const GRAVITY = 0.15;

export class BlobPoint {
  pos: Vector2D;
  prevPos: Vector2D;
  displacement: Vector2D;
  displacementWeight: number;

  constructor(position: Vector2D) {
    this.pos = { x: position.x, y: position.y };
    this.prevPos = { x: position.x, y: position.y };
    this.displacement = { x: 0, y: 0 };
    this.displacementWeight = 0;
  }

  verletIntegrate(): void {
    const { pos, prevPos } = this;

    const tempX = pos.x;
    const tempY = pos.y;

    const velX = (pos.x - prevPos.x) * DAMPING;
    const velY = (pos.y - prevPos.y) * DAMPING;

    pos.x += velX;
    pos.y += velY;

    prevPos.x = tempX;
    prevPos.y = tempY;
  }

  applyGravity(): void {
    this.pos.y += GRAVITY;
  }

  accumulateDisplacement(offset: Vector2D): void {
    this.displacement.x += offset.x;
    this.displacement.y += offset.y;
    this.displacementWeight += 1;
  }

  applyDisplacement(): void {
    const { displacement, displacementWeight, pos } = this;
    if (displacementWeight > 0) {
      displacement.x /= displacementWeight;
      displacement.y /= displacementWeight;

      pos.x += displacement.x;
      pos.y += displacement.y;

      displacement.x = 0;
      displacement.y = 0;
      this.displacementWeight = 0;
    }
  }

  keepInBounds(width: number, height: number): void {
    this.pos.x = Math.max(0, Math.min(width, this.pos.x));
    this.pos.y = Math.max(0, Math.min(height, this.pos.y));
  }

  collideWith(collider: ICircleCollider): void {
    const { pos } = this;
    const dx = pos.x - collider.position.x;
    const dy = pos.y - collider.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < collider.radius) {
      if (distance > 0) {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        pos.x = collider.position.x + normalizedX * collider.radius;
        pos.y = collider.position.y + normalizedY * collider.radius;
      } else {
        const angle = Math.random() * Math.PI * 2;
        pos.x = collider.position.x + Math.cos(angle) * collider.radius;
        pos.y = collider.position.y + Math.sin(angle) * collider.radius;
      }
    }
  }
}

export class SoftBlob {
  points: BlobPoint[] = [];
  area: number;
  circumference: number;
  chordLength: number;

  constructor(
    originX: number,
    originY: number,
    numPoints: number,
    radius: number,
    puffiness: number,
    public outlineSize: number,
  ) {
    this.area = radius * radius * Math.PI * puffiness;
    this.circumference = radius * 2 * Math.PI;
    this.chordLength = this.circumference / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints - Math.PI / 2;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      this.points.push(
        new BlobPoint({
          x: originX + offsetX,
          y: originY + offsetY,
        }),
      );
    }
  }

  tick(collider: ICircleCollider, canvasWidth: number, canvasHeight: number): void {
    const { points, chordLength, area, circumference } = this;
    for (const point of points) {
      point.verletIntegrate();
      point.applyGravity();
    }

    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];

        const dx = next.pos.x - current.pos.x;
        const dy = next.pos.y - current.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > chordLength) {
          const error = (distance - chordLength) / 2;
          const normalizedX = (dx / distance) * error;
          const normalizedY = (dy / distance) * error;

          current.accumulateDisplacement({ x: normalizedX, y: normalizedY });
          next.accumulateDisplacement({ x: -normalizedX, y: -normalizedY });
        }
      }

      const currentArea = this.getArea();
      const areaError = area - currentArea;
      const offset = areaError / circumference;

      for (let i = 0; i < points.length; i++) {
        const prev = points[(i - 1 + points.length) % points.length];
        const current = points[i];
        const next = points[(i + 1) % points.length];

        const secantX = next.pos.x - prev.pos.x;
        const secantY = next.pos.y - prev.pos.y;

        const normalX = -secantY;
        const normalY = secantX;

        const length = Math.sqrt(normalX * normalX + normalY * normalY);
        if (length > 0) {
          const normalizedX = (normalX / length) * offset;
          const normalizedY = (normalY / length) * offset;

          current.accumulateDisplacement({ x: normalizedX, y: normalizedY });
        }
      }

      for (const point of points) {
        point.applyDisplacement();
      }

      for (const point of points) {
        point.keepInBounds(canvasWidth, canvasHeight);
        point.collideWith(collider);
      }
    }
  }

  getArea(): number {
    const { points } = this;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      area += ((current.pos.x - next.pos.x) * (current.pos.y + next.pos.y)) / 2;
    }
    return Math.abs(area);
  }

  getCenterOfMass(): Vector2D {
    const { points } = this;
    let totalX = 0;
    let totalY = 0;
    for (const point of points) {
      totalX += point.pos.x;
      totalY += point.pos.y;
    }
    return {
      x: totalX / points.length,
      y: totalY / points.length,
    };
  }

  render(context: CanvasRenderingContext2D): void {
    const { points, outlineSize } = this;

    context.strokeStyle = context.fillStyle = "#000000";
    context.lineWidth = outlineSize;

    context.beginPath();
    if (points.length > 3) {
      const smoothPoints: Array<{ pos: Vector2D; cp1: Vector2D; cp2: Vector2D }> = [];
      for (let i = 0; i < points.length; i++) {
        const prev = points[(i - 1 + points.length) % this.points.length];
        const current = points[i];
        const next = points[(i + 1) % points.length];

        const smoothing = 0.2;
        const prevTangentX = (next.pos.x - prev.pos.x) * smoothing;
        const prevTangentY = (next.pos.y - prev.pos.y) * smoothing;

        smoothPoints.push({
          pos: current.pos,
          cp1: { x: current.pos.x - prevTangentX, y: current.pos.y - prevTangentY },
          cp2: { x: current.pos.x + prevTangentX, y: current.pos.y + prevTangentY },
        });
      }

      context.moveTo(smoothPoints[0].pos.x, smoothPoints[0].pos.y);
      for (let i = 0; i < smoothPoints.length; i++) {
        const current = smoothPoints[i];
        const next = smoothPoints[(i + 1) % smoothPoints.length];
        context.bezierCurveTo(current.cp2.x, current.cp2.y, next.cp1.x, next.cp1.y, next.pos.x, next.pos.y);
      }
    }
    context.closePath();
    context.fill();
    context.stroke();

    // context.fillStyle = "#2a2c35";
    // for (const point of this.points) {
    //   context.beginPath();
    //   context.arc(point.pos.x, point.pos.y, 3, 0, 2 * Math.PI);
    //   context.fill();
    // }
  }

  getLeftmostPoint(): { point: BlobPoint; index: number } {
    const { points } = this;

    let leftmostPoint = points[0];
    let leftmostIndex = 0;

    for (let i = 1; i < points.length; i++) {
      if (points[i].pos.x < leftmostPoint.pos.x) {
        leftmostPoint = points[i];
        leftmostIndex = i;
      }
    }
    return { point: leftmostPoint, index: leftmostIndex };
  }

  getRightmostPoint(): { point: BlobPoint; index: number } {
    const { points } = this;

    let rightmostPoint = points[0];
    let rightmostIndex = 0;

    for (let i = 1; i < points.length; i++) {
      if (points[i].pos.x > rightmostPoint.pos.x) {
        rightmostPoint = points[i];
        rightmostIndex = i;
      }
    }
    return { point: rightmostPoint, index: rightmostIndex };
  }

  // Check if a point is inside the soft body using ray casting algorithm
  isPointInside(x: number, y: number): boolean {
    const { points } = this;
    const n = points.length;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].pos.x;
      const yi = points[i].pos.y;
      const xj = points[j].pos.x;
      const yj = points[j].pos.y;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
}
