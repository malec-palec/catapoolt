import { BaseScreen } from "../base-screen";
import { AnimatedText } from "../core/animated-text";
import { stopMusic } from "../core/audio/sound";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
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

    const buttonConfigs = [
      {
        text: "Play",
        clickHandler() {
          this.text = "Loading...";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              game.changeScreen(GameScreen);
            });
          });
        },
      },
      {
        text: "High Scores",
        clickHandler: () => game.changeScreen(HighScoresScreen),
      },
      {
        text: "Credits",
        clickHandler: () => game.changeScreen(CreditsScreen),
      },
    ];

    this.buttons = buttonConfigs.map(
      (config) =>
        new Button({
          width: 200,
          height: 60,
          ...config,
        }),
    );
    this.add(this.title, ...this.buttons, this.versionText);

    stopMusic();
  }

  override doResize(): void {
    this.title.setFontSize(getAdaptiveFontSize(72, this.title.text.length, 1));
    this.title.setPos(c.width / 2, 150);

    const buttonSpacing = 80;
    const startY = c.height / 2 - buttonSpacing;
    const centerX = c.width / 2;

    this.buttons.forEach((button, index) => {
      button.setPos(centerX - button.width / 2, startY + buttonSpacing * index);
    });

    this.versionText.setPos(c.width - 40, c.height - 20);
  }
}
