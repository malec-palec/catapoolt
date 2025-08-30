import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { drawButton } from "../utils/button";

export class CreditsScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

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
