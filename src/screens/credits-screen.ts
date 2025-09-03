import { createButton } from "../core/button";
import { NB_SPACING_XL, drawButton, drawHeading, drawText } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";
import { MenuScreen } from "./menu-screen";

export class CreditsScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

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

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    const centerX = c.width / 2;
    drawHeading(context, "Credits", centerX, 150, "md");

    const creditsLines = ["A game by Gleb V.", "Cover art by Alisa A."];
    let yPos = 280;
    for (const line of creditsLines) {
      drawText(context, line, centerX, yPos, "md");
      yPos += NB_SPACING_XL;
    }

    drawButton(context, this.buttons[0], "secondary");
  }
}
