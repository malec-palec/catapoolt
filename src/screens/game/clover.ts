import { ICollidable, IRenderable, ITickable } from "../../core/display";
import { clonePoint, Point2D } from "../../core/geom";
import { Color } from "../../registry";
import { hypot, max, random } from "../../system";
import { IGameFieldSizeProvider } from "./game-field";

const MAX_LIFE_TIME = 3000; // 3 seconds in milliseconds
const FADE_RANGE = 0.9; // Fade from 1.0 to 0.1
const MIN_ALPHA = 0.1;
const CLOVER_EMOJI = "☘︎";
const GREEN_COLOR = Color.BrightGreen;
export class Clover implements ITickable, IRenderable, ICollidable {
  position: Point2D;
  alpha: number = 1.0;

  isVisible: boolean = true;

  private lifeTime: number = 0;
  isActive: boolean = true;

  collectedThisWave = false;
  lastPosition: Point2D | null = null;

  constructor(
    private gameField: IGameFieldSizeProvider,
    private cameraPos: Point2D,
    public size: number = 24,
  ) {
    this.position = this.getRandomPosition();
    this.lastPosition = clonePoint(this.position);
  }

  tick(dt: number): void {
    if (!this.isActive) return;
    if (this.collectedThisWave) return;

    // Check if clover is visible in camera viewport (inline inBounds)
    if (!this.isActive) {
      this.isVisible = false;
    } else {
      const x = this.position.x;
      const y = this.position.y;
      const margin = this.size;

      this.isVisible =
        x >= this.cameraPos.x - margin &&
        x <= this.cameraPos.x + c.width + margin &&
        y >= this.cameraPos.y - margin &&
        y <= this.cameraPos.y + c.height + margin;
    }

    this.lifeTime += dt;

    // Calculate alpha fade over the 3 seconds - optimized calculation
    // Start at full opacity (1.0), fade to almost transparent (0.1) over 3 seconds
    this.alpha = max(MIN_ALPHA, 1.0 - (this.lifeTime / MAX_LIFE_TIME) * FADE_RANGE);

    // Check if clover should be repositioned after 3 seconds
    if (this.lifeTime >= MAX_LIFE_TIME) {
      this.reposition();
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isActive) return;
    if (this.collectedThisWave) return;

    if (!this.isVisible) return;

    // Avoid save/restore by setting properties directly and not changing them permanently
    const prevAlpha = context.globalAlpha;
    const prevFillStyle = context.fillStyle;
    const prevFont = context.font;
    const prevTextAlign = context.textAlign;
    const prevTextBaseline = context.textBaseline;

    context.globalAlpha = this.alpha;
    context.fillStyle = GREEN_COLOR;
    context.font = `${this.size}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw the clover emoji ☘︎
    context.fillText(CLOVER_EMOJI, this.position.x, this.position.y);

    // Restore previous values
    context.globalAlpha = prevAlpha;
    context.fillStyle = prevFillStyle;
    context.font = prevFont;
    context.textAlign = prevTextAlign;
    context.textBaseline = prevTextBaseline;
  }

  // Reset the clover to a new position
  reposition(): void {
    this.position = this.getRandomPosition();
    this.lifeTime = 0;
    this.alpha = 1.0;
    this.lastPosition = clonePoint(this.position);
  }

  // Deactivate the clover (when collected)
  collect(): void {
    this.isActive = false;
    this.collectedThisWave = true;
  }

  // Generate a random clover position
  private getRandomPosition(
    fieldWidth: number = this.gameField.width,
    fieldHeight: number = this.gameField.height,
  ): { x: number; y: number } {
    const minDistance = 300; // Minimum distance from previous position
    const maxAttempts = 20; // Maximum attempts to find a good position
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = random() * fieldWidth;
      const y = random() * fieldHeight;

      // If no previous position, any position is fine
      if (!this.lastPosition) {
        return { x, y };
      }

      // Calculate distance from last position
      const distance = hypot(x - this.lastPosition.x, y - this.lastPosition.y);

      // If far enough from previous position, use this position
      if (distance >= minDistance) {
        return { x, y };
      }

      attempts++;
    }

    // If we couldn't find a good position after max attempts,
    // just use a position on the opposite side of the field
    if (this.lastPosition) {
      const oppositeX =
        this.lastPosition.x > fieldWidth / 2
          ? random() * (fieldWidth / 2)
          : fieldWidth / 2 + random() * (fieldWidth / 2);
      const oppositeY =
        this.lastPosition.y > fieldHeight / 2
          ? random() * (fieldHeight / 2)
          : fieldHeight / 2 + random() * (fieldHeight / 2);
      return { x: oppositeX, y: oppositeY };
    }

    // Fallback to random position
    return {
      x: random() * fieldWidth,
      y: random() * fieldHeight,
    };
  }
}
