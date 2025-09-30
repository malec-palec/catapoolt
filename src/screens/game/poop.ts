import { IRenderable, ITickable } from "../../core/display";
import { Point2D } from "../../core/geom";
import { Vector2D } from "../../core/vector2d";
import { Color, createRadialGradientWithStops, ShadowGradients, wrapContext } from "../../registry";
import { cos, PI, random, sin, TWO_PI } from "../../system";

type Fly = {
  tick: (dt: number) => void;
  render: (context: CanvasRenderingContext2D) => void;
};

const createFly = (
  position: Point2D,
  poopPos: Point2D,
  angle: number = random() * TWO_PI,
  ellipseRadius: Point2D = { x: 10 + random() * 20, y: 5 + random() * 15 },
  centerOffset: Point2D = { x: (random() - 0.5) * 15, y: -10 - random() * 15 },
): Fly => ({
  tick(dt: number) {
    angle += (0.002 + random() * 0.006) * dt;

    if (angle > TWO_PI) angle -= TWO_PI;

    position.x = poopPos.x + centerOffset.x + cos(angle) * ellipseRadius.x;
    position.y = poopPos.y + centerOffset.y + sin(angle) * ellipseRadius.y;
  },
  render(context: CanvasRenderingContext2D) {
    context.fillStyle = Color.Black;
    context.beginPath();
    context.arc(position.x, position.y, 0.8, 0, TWO_PI);
    context.fill();
  },
});

const WOBBLE_SPEED = 0.003; // Speed of wobble animation
const WOBBLE_AMPLITUDE = 2; // How much the lines wobble
const MARGIN = 50; // Extra margin for flies
export class Poop implements ITickable, IRenderable {
  position: Vector2D;

  private wobbleTime = 0;
  private isVisible = true;
  private flies: Fly[] = [];

  constructor(
    x: number,
    y: number,
    public size: number,
    private cameraPos: Point2D,
  ) {
    this.position = new Vector2D(x, y);

    // Create random number of flies (2-3)
    const addFly = (random() * 2) | 0;
    for (let i = 0; i < 2 + addFly; i++) {
      this.flies[i] = createFly({ x, y }, this.position);
    }
  }

  tick(dt: number): void {
    // Check if poop is visible on screen (inline inBounds)
    const poopRadius = this.size * 0.6; // Approximate visual radius
    this.isVisible =
      this.position.x + poopRadius >= this.cameraPos.x - MARGIN &&
      this.position.x - poopRadius <= this.cameraPos.x + c.width + MARGIN &&
      this.position.y + poopRadius >= this.cameraPos.y - MARGIN &&
      this.position.y - poopRadius <= this.cameraPos.y + c.height + MARGIN;

    this.wobbleTime += dt;

    for (const fly of this.flies) {
      fly.tick(dt);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    const { x, y } = this.position;

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

    context.strokeStyle = context.fillStyle = Color.Brown; // Solid brown color
    context.lineWidth = 3;

    // Pre-calculate triangle dimensions
    const halfHeight = this.size * 0.5;
    const halfBaseWidth = this.size * 0.6; // size * 1.2 / 2

    context.beginPath();

    // Draw wobble lines for each side of triangle using math to cycle through points
    for (let i = 0; i < 3; i++) {
      // Calculate current and next vertex using trigonometry
      // Triangle vertices are at angles: -90°, 30°, 150° (or -π/2, π/6, 5π/6 radians)
      const currentAngle = -PI / 2 + (i * TWO_PI) / 3; // Start at top, go clockwise
      const nextAngle = -PI / 2 + ((i + 1) * TWO_PI) / 3;

      this.drawWobbleLine(
        context,
        x + cos(currentAngle) * halfBaseWidth,
        y + sin(currentAngle) * halfHeight,
        x + cos(nextAngle) * halfBaseWidth,
        y + sin(nextAngle) * halfHeight,
        i,
        8,
      );
    }
    context.fill();
    context.stroke();

    for (const fly of this.flies) {
      fly.render(context);
    }
  }

  private drawWobbleLine(
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    index: number,
    segments: number = 8,
  ): void {
    const deltaX = (endX - startX) / segments;
    const deltaY = (endY - startY) / segments;

    if (index === 0) {
      context.moveTo(startX, startY);
    }

    // Don't moveTo - just continue the path with lineTo
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + deltaX * i;
      const baseY = startY + deltaY * i;

      // Add wobble perpendicular to the line direction
      const perpX = -deltaY / segments; // Perpendicular X
      const perpY = deltaX / segments; // Perpendicular Y

      const wobble = sin(this.wobbleTime * WOBBLE_SPEED + t * PI * 4) * WOBBLE_AMPLITUDE;

      const wobbleX = baseX + perpX * wobble;
      const wobbleY = baseY + perpY * wobble;

      context.lineTo(wobbleX, wobbleY);
    }
  }
}
