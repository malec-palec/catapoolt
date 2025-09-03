import { drawText } from "../core/neobrutalism";
import { BaseScreen } from "../screen";
import { MenuScreen } from "./menu-screen";

export class SplashScreen extends BaseScreen {
  private timer = 0;

  override update(dt: number): void {
    super.update(dt);

    this.timer += dt;
    if (this.timer >= 1000 && this.isTransitionComplete()) {
      this.game.changeScreen(MenuScreen);
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    drawText(context, "logo goes here", c.width / 2, c.height / 2, "lg");
  }
}
