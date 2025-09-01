import { isVerticalLayout } from "../..";
import { DisplayObject } from "../../core/display";
import { GAME_FIELD_SIZE, HUD_SIZE } from "../game-screen";
import { getLevelData } from "./level-utils";

export class GameField extends DisplayObject {
  constructor(private levelIndex: number) {
    super(GAME_FIELD_SIZE, GAME_FIELD_SIZE);

    const levelData = getLevelData(levelIndex);
    const mapSize = Math.sqrt(levelData.length);
  }

  override update(dt: number): void {
    const isVertical = isVerticalLayout();
    this.position.x = isVertical ? 0 : HUD_SIZE;
  }

  override draw(context: CanvasRenderingContext2D): void {
    // Draw Game Field
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.strokeRect(0, 0, GAME_FIELD_SIZE, GAME_FIELD_SIZE);

    context.fillStyle = "#000000";
    context.font = "14px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText("Game Field", GAME_FIELD_SIZE / 2, 10);

    // Game title with level (positioned in Game Field area)
    context.font = "bold 48px Arial, sans-serif";
    context.textBaseline = "middle";
    context.fillText(`Level ${this.levelIndex}`, GAME_FIELD_SIZE / 2, GAME_FIELD_SIZE / 2 - 50);
  }
}
