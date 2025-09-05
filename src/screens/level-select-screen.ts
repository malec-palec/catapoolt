import { isVerticalLayout } from "..";
import { createButton } from "../core/button";
import { ButtonVariant, HeadingSize, drawButton, drawHeading } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";
import { GameScreen } from "./game-screen";
import levels from "./game/levels.js";
import { MenuScreen } from "./menu-screen";

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
          isDisabled: !(i < levels.length && levels[i] !== null),
          clickHandler: () => {
            this.game.changeScreen(GameScreen, i);
          },
        }),
      );
    }

    this.buttons.push(
      createButton({
        x: 10,
        y: 10,
        width: 48,
        height: 48,
        text: "⟵",
        clickHandler: () => {
          this.game.changeScreen(MenuScreen);
        },
      }),
    );
  }

  override onResize(): void {
    super.onResize();

    const sx = (c.width - TOTAL_GRID_WIDTH) / 2;
    const sy = (c.height - TOTAL_GRID_HEIGHT) / 2 + (isVerticalLayout() ? 60 : 20);
    for (let i = 0; i < LEVEL_COUNT; i++) {
      this.buttons[i].x = sx + (i % GRID_COLS) * (TILE_SIZE + TILE_SPACING);
      this.buttons[i].y = sy + Math.floor(i / GRID_COLS) * (TILE_SIZE + TILE_SPACING);
    }
  }

  protected override doDraw(context: CanvasRenderingContext2D): void {
    drawHeading(context, "Select Level", c.width / 2, 100, HeadingSize.MD);
    for (let i = 0; i < LEVEL_COUNT; i++) {
      drawButton(context, this.buttons[i]);
    }
    drawButton(context, this.buttons[LEVEL_COUNT], ButtonVariant.SECONDARY);
  }
}
