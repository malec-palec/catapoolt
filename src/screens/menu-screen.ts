import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { drawButton } from "../utils/button";

export class MenuScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

    const width = 200;
    const height = 60;
    const x = c.width / 2 - width / 2;
    this.buttons.push(
      {
        x,
        y: 350,
        width,
        height,
        text: "Play",
        action: () => {
          this.game.changeScreen(ScreenName.LevelSelect);
        },
      },
      {
        x,
        y: 430,
        width,
        height,
        text: "Credits",
        action: () => {
          this.game.changeScreen(ScreenName.Credits);
        },
      },
    );
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
