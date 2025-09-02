import { isVerticalLayout } from "..";
import { createButton, drawButton } from "../core/button";
import { isCoordsInRect } from "../core/geom";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import levels from "./game/levels.js";

const LEVEL_COUNT = 10;
const GRID_COLS = 5;
const TILE_SIZE = 80;
const TILE_SPACING = 20;
const GRID_ROWS = Math.ceil(LEVEL_COUNT / GRID_COLS);
const TOTAL_GRID_WIDTH = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_SPACING;
const TOTAL_GRID_HEIGHT = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_SPACING;

export class LevelSelectScreen extends BaseScreen {
  private levelExists: boolean[] = [];

  constructor(game: IGame) {
    super(game);

    for (let i = 0; i < LEVEL_COUNT; i++) {
      const exists = i < levels.length && levels[i] !== null;
      this.levelExists[i] = exists;

      this.buttons.push(
        createButton({
          width: TILE_SIZE,
          height: TILE_SIZE,
          text: (i + 1).toString(),
          action: exists
            ? () => {
                this.game.changeScreen(ScreenName.Game, i);
              }
            : () => {
                // Do nothing for disabled levels
              },
        }),
      );
    }

    this.buttons.push({
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      text: "⟵",
      action: () => {
        this.game.changeScreen(ScreenName.Menu);
      },
    });
  }

  override onClick(x: number, y: number): void {
    // Check level buttons first
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const button = this.buttons[i];
      if (isCoordsInRect(x, y, button)) {
        // Only allow clicking if level exists
        if (this.levelExists[i]) {
          button.action();
        }
        return;
      }
    }

    // Check back button
    const backButton = this.buttons[LEVEL_COUNT];
    if (isCoordsInRect(x, y, backButton)) {
      backButton.action();
    }
  }

  override onResize(): void {
    super.onResize();

    const startX = (c.width - TOTAL_GRID_WIDTH) / 2;
    const startY = (c.height - TOTAL_GRID_HEIGHT) / 2 + (isVerticalLayout() ? 60 : 20);

    // Reposition level buttons
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;

      const x = startX + col * (TILE_SIZE + TILE_SPACING);
      const y = startY + row * (TILE_SIZE + TILE_SPACING);

      this.buttons[i].x = x;
      this.buttons[i].y = y;
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    // Title
    context.fillStyle = "#ffffff";
    context.font = "bold 48px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Select Level", c.width / 2, 100);

    // Draw level buttons
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const button = this.buttons[i];
      const exists = this.levelExists[i];

      if (exists) {
        // Draw normal button
        drawButton(context, button);
      } else {
        // Draw disabled button with cross
        context.fillStyle = "#666666";
        context.fillRect(button.x, button.y, button.width, button.height);

        context.strokeStyle = "#333333";
        context.lineWidth = 2;
        context.strokeRect(button.x, button.y, button.width, button.height);

        // Draw button text (grayed out)
        context.fillStyle = "#999999";
        context.font = "bold 24px Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);

        // Draw cross over disabled button
        context.strokeStyle = "#ff0000";
        context.lineWidth = 4;
        context.beginPath();
        // Top-left to bottom-right
        context.moveTo(button.x + 10, button.y + 10);
        context.lineTo(button.x + button.width - 10, button.y + button.height - 10);
        // Top-right to bottom-left
        context.moveTo(button.x + button.width - 10, button.y + 10);
        context.lineTo(button.x + 10, button.y + button.height - 10);
        context.stroke();
      }
    }

    // Draw back button (always enabled)
    drawButton(context, this.buttons[LEVEL_COUNT]);
  }
}
