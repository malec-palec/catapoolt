import { Point2D, Point3D, worldToScreen } from "./geom";

export type ActorType = "head" | "tail";

export class Actor {
  public direction: number = 0;

  private worldPosition: Point3D;
  private radius: number;
  private targetPosition: Point2D | null = null;
  private speed: number = 0.1;
  private type: ActorType;
  private previousActor: Actor | null = null;
  private constraintDistance: number = 0.5; // Distance to maintain from previous actor

  constructor(x: number, y: number, z: number = 0, type: ActorType = "head") {
    this.worldPosition = { x, y, z };
    this.radius = 20;
    this.type = type;
  }

  setTarget(target: Point2D): void {
    if (this.type === "head") {
      this.targetPosition = target;
    }
    // Only head can have explicit targets
  }

  setPreviousActor(actor: Actor): void {
    this.previousActor = actor;
  }

  getType(): ActorType {
    return this.type;
  }

  update(): void {
    if (this.type === "head") {
      this.updateHead();
    } else {
      this.updateTail();
    }
  }

  private updateHead(): void {
    if (!this.targetPosition) return;

    const dx = this.targetPosition.x - this.worldPosition.x;
    const dy = this.targetPosition.y - this.worldPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.lookAt(this.targetPosition);

    if (distance < this.speed) {
      // Reached target
      this.worldPosition.x = this.targetPosition.x;
      this.worldPosition.y = this.targetPosition.y;
      this.targetPosition = null;
    } else {
      // Move towards target in 2D top-down space
      const moveX = (dx / distance) * this.speed;
      const moveY = (dy / distance) * this.speed;
      this.worldPosition.x += moveX;
      this.worldPosition.y += moveY;
    }
  }

  private updateTail(): void {
    if (!this.previousActor) return;

    const prevPos = this.previousActor.getPosition();
    const dx = prevPos.x - this.worldPosition.x;
    const dy = prevPos.y - this.worldPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.lookAt(prevPos);

    // Only move if distance exceeds constraint
    if (distance > this.constraintDistance) {
      const excess = distance - this.constraintDistance;
      const moveRatio = excess / distance;

      this.worldPosition.x += dx * moveRatio;
      this.worldPosition.y += dy * moveRatio;
    }
  }

  /**
   * Get current world position (in 2D top-down space)
   */
  getPosition(): Point3D {
    return { ...this.worldPosition };
  }

  /**
   * Get current direction in radians
   */
  getDirection(): number {
    return this.direction;
  }

  /**
   * Set direction to point toward a specific position (in 2D top-down space)
   */
  lookAt(target: Point2D): void {
    const dx = target.x - this.worldPosition.x;
    const dy = target.y - this.worldPosition.y;
    this.direction = Math.atan2(dy, dx);
  }

  /**
   * Render the actor at its current position with camera offset
   */
  draw(ctx: CanvasRenderingContext2D, cameraPos: Point2D, gridSize: number, offsetX: number, offsetY: number): void {
    // Calculate actor position relative to camera
    const relativeX = this.worldPosition.x - cameraPos.x;
    const relativeY = this.worldPosition.y - cameraPos.y;

    // Convert to isometric screen position
    const screenPos = worldToScreen(relativeX, relativeY, this.worldPosition.z);

    const centerX = screenPos.x * gridSize + offsetX;
    const centerY = screenPos.y * gridSize + offsetY;

    // Create ellipse for isometric projection (circle squished on Y-axis)
    const radiusX = this.radius;
    const radiusY = this.radius * 0.5; // Squish factor for isometric view

    ctx.save();

    // Draw oval body with different colors for head vs tail
    // if (this.type === "head") {
    //   ctx.fillStyle = "#4a90e2";
    //   ctx.strokeStyle = "#2c5aa0";
    // } else {
    //   ctx.fillStyle = "#90e24a";
    //   ctx.strokeStyle = "#5aa02c";
    // }
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    // ctx.fill();
    // ctx.stroke();

    // ctx.strokeStyle = "#ff6b6b";
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.ellipse(centerX, centerY, radiusX, radiusX, 0, 0, Math.PI * 2);
    // ctx.stroke();

    // Get actor direction and render direction line

    // Convert 2D direction to isometric space for proper line rendering
    const dirX = Math.cos(this.direction);
    const dirY = Math.sin(this.direction);

    // Transform direction to isometric space
    const isoDir = worldToScreen(dirX, dirY, 0);
    const isoDirLength = Math.sqrt(isoDir.x * isoDir.x + isoDir.y * isoDir.y);
    const normalizedIsoDirX = isoDir.x / isoDirLength;
    const normalizedIsoDirY = isoDir.y / isoDirLength;

    // Calculate intersection with ellipse boundary
    const angle = Math.atan2(normalizedIsoDirY * radiusX, normalizedIsoDirX * radiusY);
    const edgeX = centerX + radiusX * Math.cos(angle);
    const edgeY = centerY + radiusY * Math.sin(angle);

    // Draw direction line from center to edge
    // ctx.strokeStyle = "#ff6b6b";
    // ctx.lineWidth = 3;
    // ctx.beginPath();
    // ctx.moveTo(centerX, centerY);
    // ctx.lineTo(edgeX, edgeY);
    // ctx.stroke();

    ctx.restore();
  }
}
