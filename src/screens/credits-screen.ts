import { isVerticalLayout } from "..";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { createButton, drawButton } from "../utils/button";

export class CreditsScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

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

    const backButton = this.buttons[0];
    backButton.x = isVerticalLayout() ? c.width / 2 - 75 : 50;
    backButton.y = c.height - 100;
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    // Credits title
    context.fillStyle = "#ffffff";
    context.font = "bold 48px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    const centerX = context.canvas.width / 2;
    context.fillText("Credits", centerX, 150);

    // Credits content
    context.font = "24px Arial, sans-serif";
    const creditsLines = ["First line", "Second line", "Third line"];

    let yPos = 250;
    for (const line of creditsLines) {
      context.fillText(line, centerX, yPos);
      yPos += 40;
    }

    drawButton(context, this.buttons[0]);
  }
}
