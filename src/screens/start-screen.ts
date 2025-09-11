import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { CreditsScreen } from "./credits-screen";
import { GameScreen } from "./game-screen";
import { HighScoresScreen } from "./high-scores-screen";

export class StartScreen extends BaseScreen {
  private title: Text;
  private buttons: Button[];

  constructor(game: IGame) {
    super(game);

    this.title = new Text("🅒🅐🅣🅐🅟🅞🅞🅛🅣", 72, "Arial", "bold");

    const buttonSize = { width: 200, height: 60 };
    this.buttons = [
      new Button({
        ...buttonSize,
        text: "Play",
        clickHandler: () => {
          this.game.changeScreen(GameScreen);
        },
      }),
      new Button({
        ...buttonSize,
        text: "High Scores",
        clickHandler: () => {
          this.game.changeScreen(HighScoresScreen);
        },
      }),
      new Button({
        ...buttonSize,
        text: "Credits",
        clickHandler: () => {
          this.game.changeScreen(CreditsScreen);
        },
      }),
    ];
    this.add(this.title, ...this.buttons);
  }

  override doResize(): void {
    this.title.setPosition(c.width / 2, 150);

    const buttonSpacing = 80;
    const startY = c.height / 2 - buttonSpacing;
    this.buttons.forEach((button, index) => {
      button.position.x = c.width / 2 - button.width / 2;
      button.position.y = startY + buttonSpacing * index;
    });
  }
}
