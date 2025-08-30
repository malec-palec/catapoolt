import { isVerticalLayout } from "..";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { createButton, drawButton } from "../utils/button";

export class MenuScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

    const width = 200;
    const height = 60;
    this.buttons.push(
      createButton({
        width,
        height,
        text: "Play",
        action: () => {
          this.game.changeScreen(ScreenName.LevelSelect);
        },
      }),
      createButton({
        width,
        height,
        text: "Credits",
        action: () => {
          this.game.changeScreen(ScreenName.Credits);
        },
      }),
    );
  }

  override onResize(): void {
    super.onResize();

    const width = 200;
    const x = c.width / 2 - width / 2;

    const playButton = this.buttons[0];
    const creditsButton = this.buttons[1];

    if (isVerticalLayout()) {
      // Portrait: Stack buttons vertically with more spacing
      const startY = c.height / 2 - 40; // Center vertically
      playButton.x = x;
      playButton.y = startY;
      creditsButton.x = x;
      creditsButton.y = startY + 80;
    } else {
      // Landscape: Original positioning
      playButton.x = x;
      playButton.y = 350;
      creditsButton.x = x;
      creditsButton.y = 430;
    }
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    super.draw(ctx);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAWS", c.width / 2, 200);

    for (const button of this.buttons) {
      drawButton(ctx, button);
    }
  }
}
