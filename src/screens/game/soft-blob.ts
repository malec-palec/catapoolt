import { Point2D } from "../../core/geom";
import { Color } from "../../registry";
import { abs, cos, hypot, max, min, PI, random, sin, TWO_PI } from "../../system";

export interface ICircleCollider {
  position: Point2D;
  radius: number;
}

export interface IContainsPoint {
  isPointInside(x: number, y: number): boolean;
}

const DAMPING = 0.99;

export class BlobPoint {
  pos: Point2D;
  prevPos: Point2D;
  displacement: Point2D;
  displacementWeight: number;

  constructor(position: Point2D) {
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

    // Apply gravity
    pos.y += 0.15; // GRAVITY
  }

  accumulateDisplacement(offset: Point2D): void {
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
    this.pos.x = max(0, min(width, this.pos.x));
    this.pos.y = max(0, min(height, this.pos.y));
  }

  collideWith(collider: ICircleCollider): void {
    const { pos } = this;
    const dx = pos.x - collider.position.x;
    const dy = pos.y - collider.position.y;
    const distance = hypot(dx, dy);

    if (distance < collider.radius) {
      if (distance > 0) {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        pos.x = collider.position.x + normalizedX * collider.radius;
        pos.y = collider.position.y + normalizedY * collider.radius;
      } else {
        const angle = random() * TWO_PI;
        pos.x = collider.position.x + cos(angle) * collider.radius;
        pos.y = collider.position.y + sin(angle) * collider.radius;
      }
    }
  }
}

export class SoftBlob implements IContainsPoint {
  points: BlobPoint[] = [];
  area: number;
  baseArea: number; // Original area for reference
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
    this.baseArea = radius * radius * PI * puffiness;
    this.area = this.baseArea;
    this.circumference = radius * 2 * PI;
    this.chordLength = this.circumference / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * PI * i) / numPoints - PI / 2;
      const offsetX = cos(angle) * radius;
      const offsetY = sin(angle) * radius;
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
    }

    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];

        const dx = next.pos.x - current.pos.x;
        const dy = next.pos.y - current.pos.y;
        const distance = hypot(dx, dy);

        if (distance > chordLength) {
          const error = (distance - chordLength) / 2;
          const normalizedX = (dx / distance) * error;
          const normalizedY = (dy / distance) * error;

          current.accumulateDisplacement({ x: normalizedX, y: normalizedY });
          next.accumulateDisplacement({ x: -normalizedX, y: -normalizedY });
        }
      }

      // Calculate current area inline
      let currentArea = 0;
      for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        currentArea += ((current.pos.x - next.pos.x) * (current.pos.y + next.pos.y)) / 2;
      }
      currentArea = abs(currentArea);
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

        const length = hypot(normalX, normalY);
        if (length > 0) {
          const normalizedX = (normalX / length) * offset;
          const normalizedY = (normalY / length) * offset;

          current.accumulateDisplacement({ x: normalizedX, y: normalizedY });
        }
      }

      for (const point of points) {
        point.applyDisplacement();
        point.keepInBounds(canvasWidth, canvasHeight);
        point.collideWith(collider);
      }
    }
  }

  getCenterOfMass(): Point2D {
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

    context.strokeStyle = context.fillStyle = Color.Black;
    context.lineWidth = outlineSize;

    context.beginPath();
    if (points.length > 3) {
      const smoothPoints: Array<{ pos: Point2D; cp1: Point2D; cp2: Point2D }> = [];
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

    // context.fillStyle = Colors.DarkSlateGray;
    // for (const point of this.points) {
    //   context.beginPath();
    //   context.arc(point.pos.x, point.pos.y, 3, 0, 2 * PI);
    //   context.fill();
    // }
  }

  getExtremestPoint(dir: -1 | 1): { point: BlobPoint; index: number } {
    const { points } = this;

    let extremestPoint = points[0];
    let extremestIndex = 0;

    for (let i = 1; i < points.length; i++) {
      const isMoreExtreme =
        dir === -1
          ? points[i].pos.x < extremestPoint.pos.x // leftmost
          : points[i].pos.x > extremestPoint.pos.x; // rightmost

      if (isMoreExtreme) {
        extremestPoint = points[i];
        extremestIndex = i;
      }
    }
    return { point: extremestPoint, index: extremestIndex };
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
