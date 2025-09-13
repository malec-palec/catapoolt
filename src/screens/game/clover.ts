import { Vector2D } from "../../core/vector2d";

export class Clover {
  public position: Vector2D;
  public size: number;
  public alpha: number = 1.0;
  private lifeTime: number = 0;
  private isActive: boolean = true;

  // Constants moved to static to avoid repeated allocation
  private static readonly MAX_LIFE_TIME = 3000; // 3 seconds in milliseconds
  private static readonly FADE_RANGE = 0.9; // Fade from 1.0 to 0.1
  private static readonly MIN_ALPHA = 0.1;
  private static readonly CLOVER_EMOJI = "☘︎";
  private static readonly GREEN_COLOR = "#00FF00";

  constructor(x: number, y: number, size: number = 24) {
    this.position = new Vector2D(x, y);
    this.size = size;
  }

  tick(dt: number): void {
    if (!this.isActive) return;

    this.lifeTime += dt;

    // Calculate alpha fade over the 3 seconds - optimized calculation
    // Start at full opacity (1.0), fade to almost transparent (0.1) over 3 seconds
    this.alpha = Math.max(Clover.MIN_ALPHA, 1.0 - (this.lifeTime / Clover.MAX_LIFE_TIME) * Clover.FADE_RANGE);
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Avoid save/restore by setting properties directly and not changing them permanently
    const prevAlpha = context.globalAlpha;
    const prevFillStyle = context.fillStyle;
    const prevFont = context.font;
    const prevTextAlign = context.textAlign;
    const prevTextBaseline = context.textBaseline;

    context.globalAlpha = this.alpha;
    context.fillStyle = Clover.GREEN_COLOR;
    context.font = `${this.size}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw the clover emoji ☘︎
    context.fillText(Clover.CLOVER_EMOJI, this.position.x, this.position.y);

    // Restore previous values
    context.globalAlpha = prevAlpha;
    context.fillStyle = prevFillStyle;
    context.font = prevFont;
    context.textAlign = prevTextAlign;
    context.textBaseline = prevTextBaseline;
  }

  // Check if the clover should be repositioned (after 3 seconds)
  shouldReposition(): boolean {
    return this.isActive && this.lifeTime >= Clover.MAX_LIFE_TIME;
  }

  // Reset the clover to a new position
  reposition(x: number, y: number): void {
    this.position.set(x, y);
    this.lifeTime = 0;
    this.alpha = 1.0;
  }

  // Check collision with a point (cat position) - optimized with squared distance
  checkCollision(x: number, y: number, objectRadius: number = 0): boolean {
    if (!this.isActive) return false;

    const dx = x - this.position.x;
    const dy = y - this.position.y;
    const collisionRadius = this.size * 0.5 + objectRadius; // Use multiplication instead of division

    // Use squared distance comparison to avoid expensive sqrt
    return dx * dx + dy * dy <= collisionRadius * collisionRadius;
  }

  // Deactivate the clover (when collected)
  collect(): void {
    this.isActive = false;
  }

  get active(): boolean {
    return this.isActive;
  }

  // Check if clover is visible in camera viewport - optimized bounds checking
  isVisible(cameraX: number, cameraY: number, viewWidth: number, viewHeight: number): boolean {
    if (!this.isActive) return false;

    // Early exit optimizations and single variable for margin
    const x = this.position.x;
    const y = this.position.y;
    const margin = this.size;

    return (
      x >= cameraX - margin &&
      x <= cameraX + viewWidth + margin &&
      y >= cameraY - margin &&
      y <= cameraY + viewHeight + margin
    );
  }
}
