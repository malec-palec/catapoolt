import { BaseScreen, ScreenName } from "../screen";

export class SplashScreen extends BaseScreen {
  readonly DISPLAY_TIME_MS = 1000;
  private timer = 0;

  override update(dt: number): void {
    super.update(dt);

    this.timer += dt;
    if (this.timer >= this.DISPLAY_TIME_MS && this.isTransitionComplete()) {
      this.game.changeScreen(ScreenName.Menu);
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    context.fillStyle = "#ffffff";
    context.font = "48px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("game by glebv", c.width / 2, c.height / 2);
  }
}
