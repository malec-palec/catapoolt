import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { drawButton } from "../utils/button";

export class LevelSelectScreen extends BaseScreen {
  readonly LEVEL_COUNT = 10; // Configurable number of levels
  readonly GRID_COLS = 5; // Configurable grid columns

  constructor(game: IGame) {
    super(game);

    const tileSize = 80;
    const spacing = 20;
    const gridRows = Math.ceil(this.LEVEL_COUNT / this.GRID_COLS);

    // Calculate total grid dimensions
    const totalGridWidth = this.GRID_COLS * tileSize + (this.GRID_COLS - 1) * spacing;
    const totalGridHeight = gridRows * tileSize + (gridRows - 1) * spacing;

    // Center the grid on screen
    const startX = (c.width - totalGridWidth) / 2;
    const startY = (c.height - totalGridHeight) / 2 + 20; // Offset down a bit for title

    for (let i = 0; i < this.LEVEL_COUNT; i++) {
      const row = Math.floor(i / this.GRID_COLS);
      const col = i % this.GRID_COLS;

      const x = startX + col * (tileSize + spacing);
      const y = startY + row * (tileSize + spacing);

      this.buttons.push({
        x,
        y,
        width: tileSize,
        height: tileSize,
        text: (i + 1).toString(),
        action: () => {
          this.game.changeScreen(ScreenName.Game, i);
        },
      });
    }

    this.buttons.push({
      x: 50,
      y: c.height - 100,
      width: 150,
      height: 50,
      text: "Back",
      action: () => {
        this.game.changeScreen(ScreenName.Menu);
      },
    });
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
