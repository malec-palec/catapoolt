import { createButton } from "../core/button";
import { BodySize, ButtonVariant, drawButton, drawHeading, drawText, HeadingSize, Spacing } from "../core/neobrutalism";
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

  protected override doDraw(context: CanvasRenderingContext2D): void {
    const centerX = c.width / 2;
    drawHeading(context, "Credits", centerX, 150, HeadingSize.MD);

    const creditsLines = ["A game by Gleb V.", "Cover art by Alisa A."];
    let yPos = 280;
    for (const line of creditsLines) {
      drawText(context, line, centerX, yPos, BodySize.MD);
      yPos += Spacing.XL;
    }

    drawButton(context, this.buttons[0], ButtonVariant.SECONDARY);
  }
}
