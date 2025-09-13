import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { HIGH_SCORE_KEY } from "../registry";
import { StartScreen } from "./start-screen";

export class HighScoresScreen extends BaseScreen {
  private title: Text;
  private scoreText: Text;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("High Scores", 64, "Arial", "bold");

    const highScore = localStorage.getItem(HIGH_SCORE_KEY);
    const scoreMessage = highScore ? `Your best run: ${highScore} mice` : "Your best run is still ahead";

    this.scoreText = new Text(scoreMessage, 32);

    const backButton = new Button({
      width: 60,
      x: 20,
      text: "✖",
      fontSize: 32,
      clickHandler: () => this.game.changeScreen(StartScreen),
    });

    this.add(this.title, this.scoreText, backButton);
  }

  override doResize(): void {
    // Move title higher up (1/3 from top instead of center)
    this.title.setPos(c.width / 2, c.height / 3);

    // Position score text in center
    this.scoreText.setPos(c.width / 2, c.height / 2);
  }
}
