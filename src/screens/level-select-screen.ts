import { isVerticalLayout } from "..";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { createButton, drawButton } from "../utils/button";

const LEVEL_COUNT = 10;
const GRID_COLS = 5;
const TILE_SIZE = 80;
const TILE_SPACING = 20;
const GRID_ROWS = Math.ceil(LEVEL_COUNT / GRID_COLS);
const TOTAL_GRID_WIDTH = GRID_COLS * TILE_SIZE + (GRID_COLS - 1) * TILE_SPACING;
const TOTAL_GRID_HEIGHT = GRID_ROWS * TILE_SIZE + (GRID_ROWS - 1) * TILE_SPACING;

export class LevelSelectScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

    for (let i = 0; i < LEVEL_COUNT; i++) {
      this.buttons.push(
        createButton({
          width: TILE_SIZE,
          height: TILE_SIZE,
          text: (i + 1).toString(),
          action: () => {
            this.game.changeScreen(ScreenName.Game, i);
          },
        }),
      );
    }

    this.buttons.push(
      createButton({
        width: 150,
        height: 50,
        text: "Back",
        action: () => {
          this.game.changeScreen(ScreenName.Menu);
        },
      }),
    );
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

    const backButtonIndex = this.buttons.length - 1;
    this.buttons[backButtonIndex].x = isVerticalLayout()
      ? c.width / 2 - 75 // Center button (150px width / 2) in portrait
      : 50; // Original left positioning in landscape
    this.buttons[backButtonIndex].y = c.height - 100;
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    // Title
    context.fillStyle = "#ffffff";
    context.font = "bold 48px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Select Level", c.width / 2, 100);

    for (const button of this.buttons) {
      drawButton(context, button);
    }
  }
}
