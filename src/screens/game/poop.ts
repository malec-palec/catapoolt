import { IRenderable, ITickable } from "../../core/display";
import { Point2D } from "../../core/geom";
import { Vector2D } from "../../core/vector2d";
import { Color, createRadialGradientWithStops, ShadowGradients, wrapContext } from "../../registry";
import { cos, floor, PI, random, sin, TWO_PI } from "../../system";

class Fly {
  public position: Vector2D;
  public angle: number = random() * TWO_PI; // Current angle on ellipse
  public speed: number; // Angular speed (radians per ms) - will be set in constructor
  public radius: number = 0.8; // Smaller fly size
  public ellipseRadiusX: number; // Ellipse width - will be set in constructor
  public ellipseRadiusY: number; // Ellipse height - will be set in constructor
  public centerOffsetX: number; // Small random offset from poop center
  public centerOffsetY: number; // Above poop with small variation

  constructor(centerX: number, centerY: number) {
    this.position = new Vector2D(centerX, centerY);

    // Much more varied parameters for each fly
    this.speed = 0.002 + random() * 0.006; // Faster speeds: 0.002-0.008 rad/ms
    this.ellipseRadiusX = 10 + random() * 20; // Wider variety: 10-30px
    this.ellipseRadiusY = 5 + random() * 15; // More height variety: 5-20px
    this.centerOffsetX = (random() - 0.5) * 15; // Larger offset: ±7.5px
    this.centerOffsetY = -10 - random() * 15; // More height variation: -10 to -25px
  }

  tick(dt: number, poopX: number, poopY: number): void {
    // Update angle for circular motion
    this.angle += this.speed * dt;

    // Keep angle in 0-2π range (avoid expensive modulo)
    if (this.angle > 6.283185307179586) {
      // 2 * PI as constant
      this.angle -= 6.283185307179586;
    }

    // Calculate elliptical position around poop center (reuse position object)
    const ellipseCenterX = poopX + this.centerOffsetX;
    const ellipseCenterY = poopY + this.centerOffsetY;

    this.position.x = ellipseCenterX + cos(this.angle) * this.ellipseRadiusX;
    this.position.y = ellipseCenterY + sin(this.angle) * this.ellipseRadiusY;
  }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = Color.Black;
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, TWO_PI);
    context.fill();
  }
}

export class Poop implements ITickable, IRenderable {
  position: Vector2D;
  wobbleTime: number = 0;
  wobbleSpeed: number = 0.003; // Speed of wobble animation
  wobbleAmplitude: number = 2; // How much the lines wobble

  isVisible: boolean = true;

  private flies: Fly[] = [];

  constructor(
    x: number,
    y: number,
    public size: number,
    private cameraPos: Point2D,
  ) {
    this.position = new Vector2D(x, y);

    // Create random number of flies (2-3)
    const flyCount = 2 + floor(random() * 2); // 2 or 3 flies
    for (let i = 0; i < flyCount; i++) {
      this.flies.push(new Fly(x, y));
    }
  }

  tick(dt: number): void {
    // Check if poop is visible on screen (inline inBounds)
    const margin = 50; // Extra margin for flies
    const poopRadius = this.size * 0.6; // Approximate visual radius

    this.isVisible =
      this.position.x + poopRadius >= this.cameraPos.x - margin &&
      this.position.x - poopRadius <= this.cameraPos.x + c.width + margin &&
      this.position.y + poopRadius >= this.cameraPos.y - margin &&
      this.position.y - poopRadius <= this.cameraPos.y + c.height + margin;

    this.wobbleTime += dt;

    // Update flies (no forEach to avoid function call overhead)
    for (let i = 0; i < this.flies.length; i++) {
      this.flies[i].tick(dt, this.position.x, this.position.y);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    const x = this.position.x;
    const y = this.position.y;

    // Draw shadow first (behind the poop)
    const shadowRadius = this.size * 0.6;
    const shadowCenterX = x + 3;
    const shadowCenterY = y + 3 + this.size * 0.5;

    // Draw shadow as flattened ellipse
    wrapContext(context, () => {
      context.translate(shadowCenterX, shadowCenterY);
      context.scale(1, 0.5); // Flatten vertically

      // Create shadow gradient using predefined configuration
      const gradient = createRadialGradientWithStops(context, 0, 0, 0, 0, 0, shadowRadius, ShadowGradients.poop(0.3));

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, shadowRadius, 0, 2 * PI);
      context.fill();
    });

    context.strokeStyle = Color.Brown; // Solid brown color
    context.fillStyle = Color.Brown; // Solid brown fill (same as stroke)
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

      const wobble = sin(this.wobbleTime * this.wobbleSpeed + t * PI * 4) * this.wobbleAmplitude;

      const wobbleX = baseX + perpX * wobble;
      const wobbleY = baseY + perpY * wobble;

      context.lineTo(wobbleX, wobbleY);
    }
  }
}
