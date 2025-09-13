import { Vector2D } from "../../core/vector2d";

class Fly {
  public position: Vector2D;
  public angle: number = Math.random() * Math.PI * 2; // Current angle on ellipse
  public speed: number; // Angular speed (radians per ms) - will be set in constructor
  public radius: number = 0.8; // Smaller fly size
  public ellipseRadiusX: number; // Ellipse width - will be set in constructor
  public ellipseRadiusY: number; // Ellipse height - will be set in constructor
  public centerOffsetX: number; // Small random offset from poop center
  public centerOffsetY: number; // Above poop with small variation

  constructor(centerX: number, centerY: number) {
    this.position = new Vector2D(centerX, centerY);

    // Much more varied parameters for each fly
    this.speed = 0.002 + Math.random() * 0.006; // Faster speeds: 0.002-0.008 rad/ms
    this.ellipseRadiusX = 10 + Math.random() * 20; // Wider variety: 10-30px
    this.ellipseRadiusY = 5 + Math.random() * 15; // More height variety: 5-20px
    this.centerOffsetX = (Math.random() - 0.5) * 15; // Larger offset: ±7.5px
    this.centerOffsetY = -10 - Math.random() * 15; // More height variation: -10 to -25px
  }

  tick(dt: number, poopX: number, poopY: number): void {
    // Update angle for circular motion
    this.angle += this.speed * dt;

    // Keep angle in 0-2π range (avoid expensive modulo)
    if (this.angle > 6.283185307179586) {
      // 2 * Math.PI as constant
      this.angle -= 6.283185307179586;
    }

    // Calculate elliptical position around poop center (reuse position object)
    const ellipseCenterX = poopX + this.centerOffsetX;
    const ellipseCenterY = poopY + this.centerOffsetY;

    this.position.x = ellipseCenterX + Math.cos(this.angle) * this.ellipseRadiusX;
    this.position.y = ellipseCenterY + Math.sin(this.angle) * this.ellipseRadiusY;
  }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}

export class Poop {
  position: Vector2D;
  size: number;
  wobbleTime: number = 0;
  wobbleSpeed: number = 0.003; // Speed of wobble animation
  wobbleAmplitude: number = 2; // How much the lines wobble

  private flies: Fly[] = [];

  constructor(x: number, y: number, size: number = 20) {
    this.position = new Vector2D(x, y);
    this.size = size;

    // Create random number of flies (2-3)
    const flyCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 flies
    for (let i = 0; i < flyCount; i++) {
      this.flies.push(new Fly(x, y));
    }
  }

  // Check if poop is visible on screen (to be called from GameField)
  isVisible(cameraX: number, cameraY: number, screenWidth: number, screenHeight: number): boolean {
    const margin = 50; // Extra margin for flies
    const poopRadius = this.size * 0.6; // Approximate visual radius

    return (
      this.position.x + poopRadius >= cameraX - margin &&
      this.position.x - poopRadius <= cameraX + screenWidth + margin &&
      this.position.y + poopRadius >= cameraY - margin &&
      this.position.y - poopRadius <= cameraY + screenHeight + margin
    );
  }

  tick(dt: number): void {
    this.wobbleTime += dt;

    // Update flies (no forEach to avoid function call overhead)
    for (let i = 0; i < this.flies.length; i++) {
      this.flies[i].tick(dt, this.position.x, this.position.y);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Draw shadow first (behind the poop)
    const shadowRadius = this.size * 0.6;
    const shadowCenterX = x + 3;
    const shadowCenterY = y + 3 + this.size * 0.5;

    // Draw shadow as flattened ellipse
    context.save();
    context.translate(shadowCenterX, shadowCenterY);
    context.scale(1, 0.5); // Flatten vertically

    // Create gradient for shadow (reuse if possible, but createRadialGradient is unavoidable)
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, shadowRadius);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.3)"); // Darker center
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent edge

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
    context.fill();
    context.restore();

    context.strokeStyle = "#654321"; // Solid brown color
    context.fillStyle = "#654321"; // Solid brown fill (same as stroke)
    context.lineWidth = 3;

    // Pre-calculate triangle dimensions
    const halfHeight = this.size * 0.5;
    const halfBaseWidth = this.size * 0.6; // size * 1.2 / 2

    // Calculate triangle points (avoid repeated calculations)
    const topX = x;
    const topY = y - halfHeight;
    const leftX = x - halfBaseWidth;
    const leftY = y + halfHeight;
    const rightX = x + halfBaseWidth;
    const rightY = y + halfHeight;

    context.beginPath();
    context.moveTo(leftX, leftY);

    // Draw wobble lines for each side of triangle
    this.drawWobbleLine(context, leftX, leftY, topX, topY, 8);
    this.drawWobbleLine(context, topX, topY, rightX, rightY, 8);
    this.drawWobbleLine(context, rightX, rightY, leftX, leftY, 8);

    context.closePath();
    context.fill();
    context.stroke();

    // Draw flies on top of everything (avoid forEach)
    for (let i = 0; i < this.flies.length; i++) {
      this.flies[i].render(context);
    }
  }

  private drawWobbleLine(
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    segments: number,
  ): void {
    const deltaX = (endX - startX) / segments;
    const deltaY = (endY - startY) / segments;

    // Don't moveTo - just continue the path with lineTo
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + deltaX * i;
      const baseY = startY + deltaY * i;

      // Add wobble perpendicular to the line direction
      const perpX = -deltaY / segments; // Perpendicular X
      const perpY = deltaX / segments; // Perpendicular Y

      const wobble = Math.sin(this.wobbleTime * this.wobbleSpeed + t * Math.PI * 4) * this.wobbleAmplitude;

      const wobbleX = baseX + perpX * wobble;
      const wobbleY = baseY + perpY * wobble;

      context.lineTo(wobbleX, wobbleY);
    }
  }
}
