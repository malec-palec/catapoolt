import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { StartScreen } from "./start-screen";

export class HighScoresScreen extends BaseScreen {
  private title: Text;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("High Scores", 64, "Arial", "bold");
    const backButton = new Button({
      width: 60,
      x: 20,
      text: "✖",
      fontSize: 32,
      clickHandler: () => this.game.changeScreen(StartScreen),
    });

    this.add(this.title, backButton);
  }

  override doResize(): void {
    this.title.setPosition(c.width / 2, c.height / 2);
  }
}
