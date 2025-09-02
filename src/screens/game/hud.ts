import { isVerticalLayout } from "../..";
import { DisplayObject } from "../../core/display";
import { GAME_FIELD_SIZE, HUD_SIZE } from "../game-screen";

export class HUD extends DisplayObject {
  constructor(
    width: number,
    height: number,
    private levelIndex: number,
  ) {
    super(width, height);
  }

  override update(dt: number): void {
    const isVertical = isVerticalLayout();
    if (isVertical) {
      this.position.y = GAME_FIELD_SIZE;
      this.width = GAME_FIELD_SIZE;
      this.height = HUD_SIZE;
    } else {
      this.position.y = 0;
      this.width = HUD_SIZE;
      this.height = GAME_FIELD_SIZE;
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    // Draw HUD solid background
    context.fillStyle = "#e0e0e0";
    context.fillRect(0, 0, this.width, this.height);

    // Draw HUD border
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.strokeRect(0, 0, this.width, this.height);

    // Draw Level title
    context.fillStyle = "#000000";
    context.font = "bold 24px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(`Level ${this.levelIndex + 1}`, this.width / 2, 20);

    // Draw HUD label
    context.font = "14px Arial, sans-serif";
    context.fillText("HUD", this.width / 2, 60);
  }
}
