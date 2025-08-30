import { isVerticalLayout } from "..";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { drawButton } from "../utils/button";

const GAME_FIELD_SIZE = 600;
const HUD_SIZE = 200;
export class GameScreen extends BaseScreen {
  constructor(
    game: IGame,
    private levelIndex: number = 0,
  ) {
    super(game);
    this.bgColor = "#d3d3d3";

    this.buttons.push({
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      text: "⟵",
      action: () => {
        this.game.changeScreen(ScreenName.LevelSelect);
      },
    });
  }

  override onResize(): void {
    super.onResize();
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    const isVertical = isVerticalLayout();
    let hudWidth: number, hudHeight: number, hudY: number, gameFieldX: number;
    if (isVertical) {
      gameFieldX = 0;
      hudWidth = GAME_FIELD_SIZE;
      hudHeight = HUD_SIZE;
      hudY = GAME_FIELD_SIZE;
    } else {
      gameFieldX = HUD_SIZE;
      hudWidth = HUD_SIZE;
      hudHeight = GAME_FIELD_SIZE;
      hudY = 0;
    }

    // Draw HUD border
    context.strokeStyle = "#000000";
    context.lineWidth = 2;
    context.strokeRect(0, hudY, hudWidth, hudHeight);

    // Draw Game Field border
    context.strokeRect(gameFieldX, 0, GAME_FIELD_SIZE, GAME_FIELD_SIZE);

    // Draw HUD title
    context.fillStyle = "#000000";
    context.font = "14px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText("HUD", hudWidth / 2, hudY + 10);

    // Draw Game Field title
    context.fillText("Game Field", gameFieldX + GAME_FIELD_SIZE / 2, 10);

    // Game title with level (positioned in Game Field area)
    context.fillStyle = "#000000";
    context.font = "bold 48px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(`Level ${this.levelIndex}`, gameFieldX + GAME_FIELD_SIZE / 2, GAME_FIELD_SIZE / 2 - 50);

    drawButton(context, this.buttons[0]);
  }
}
