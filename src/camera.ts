import { Point2D } from "./geom";

export class Camera {
  private position: Point2D;
  private targetPosition: Point2D;
  private followSpeed: number = 0.05;

  constructor(x: number = 0, y: number = 0) {
    this.position = { x, y };
    this.targetPosition = { x, y };
  }

  /**
   * Update camera position with smooth interpolation
   */
  update(target: Point2D): void {
    this.targetPosition = { ...target };
    // Smooth interpolation towards target
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;

    this.position.x += dx * this.followSpeed;
    this.position.y += dy * this.followSpeed;
  }

  getPosition(): Point2D {
    return { ...this.position };
  }
}
