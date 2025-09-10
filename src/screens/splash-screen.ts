import { BaseScreen } from "../base-screen";
import { Text } from "../core/text";
import { IGame } from "../game";
import { StartScreen } from "./start-screen";

export class SplashScreen extends BaseScreen {
  private title: Text;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("Splash Screen", 64, "Arial", "bold");
    this.add(this.title);
  }

  override doResize(): void {
    this.title.setPosition(c.width / 2, c.height / 2);
  }

  override doUpdate(dt: number): void {
    if (this.currentTime >= 1000 && this.isTransitionComplete()) {
      this.game.changeScreen(StartScreen);
    }
  }
}
