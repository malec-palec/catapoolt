import { isVerticalLayout } from "..";
import { createButton } from "../core/button";
import { ButtonVariant, drawButton, drawHeading } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";
import { CreditsScreen } from "./credits-screen";
import { LevelSelectScreen } from "./level-select-screen";

export class MenuScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

    const width = 200;
    const height = 48;
    this.buttons.push(
      createButton({
        width,
        height,
        text: "Play",
        clickHandler: () => {
          this.game.changeScreen(LevelSelectScreen);
        },
      }),
      createButton({
        width,
        height,
        text: "Credits",
        clickHandler: () => {
          this.game.changeScreen(CreditsScreen);
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
      const startY = c.height / 2 - 30;
      playButton.x = x;
      playButton.y = startY;
      creditsButton.x = x;
      creditsButton.y = startY + 80;
    } else {
      playButton.x = x;
      playButton.y = 380;
      creditsButton.x = x;
      creditsButton.y = 450;
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    drawHeading(context, "PAWS", c.width / 2, 200, "lg");

    this.buttons.forEach((button, index) => {
      const variant: ButtonVariant = index === 0 ? "default" : "neutral";
      drawButton(context, button, variant);
    });
  }
}
