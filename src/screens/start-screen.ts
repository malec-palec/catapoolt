import { BaseScreen } from "../base-screen";
import { AnimatedText } from "../core/animated-text";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { stopMusic } from "../music";
import { getAdaptiveFontSize } from "../registry";
import { CreditsScreen } from "./credits-screen";
import { GameScreen } from "./game-screen";
import { HighScoresScreen } from "./high-scores-screen";

export class StartScreen extends BaseScreen {
  private title: AnimatedText;
  private buttons: Button[];
  private versionText: Text;

  constructor(game: IGame) {
    super(game);

    this.title = new AnimatedText("🅒🅐🅣🅐🅟🅞🅞🅛🅣", 72, "Arial", "bold");

    // Set animation parameters: amplitude, frequency, phase offset
    this.title.setAnimationParams(20, 0.003, 0.4);

    const version = import.meta.env.PACKAGE_VERSION || "1.0.0";
    this.versionText = new Text(`v${version}`, 16);

    const buttonSize = { width: 200, height: 60 };
    this.buttons = [
      new Button({
        ...buttonSize,
        text: "Play",
        clickHandler() {
          this.text = "Loading...";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              game.changeScreen(GameScreen);
            });
          });
        },
      }),
      new Button({
        ...buttonSize,
        text: "High Scores",
        clickHandler() {
          game.changeScreen(HighScoresScreen);
        },
      }),
      new Button({
        ...buttonSize,
        text: "Credits",
        clickHandler() {
          game.changeScreen(CreditsScreen);
        },
      }),
    ];
    this.add(this.title, ...this.buttons, this.versionText);

    stopMusic();
  }

  override doResize(): void {
    const adaptiveFontSize = getAdaptiveFontSize(72, this.title.text.length, 1);
    this.title.setFontSize(adaptiveFontSize);

    this.title.setPosition(c.width / 2, 150);

    const buttonSpacing = 80;
    const startY = c.height / 2 - buttonSpacing;
    this.buttons.forEach((button, index) => {
      button.position.x = c.width / 2 - button.width / 2;
      button.position.y = startY + buttonSpacing * index;
    });

    this.versionText.setPosition(c.width - 40, c.height - 20);
  }
}
