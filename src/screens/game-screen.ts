import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { MuteButton } from "../core/mute-button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { playMusic } from "../music";
import { StartScreen } from "./start-screen";

export class GameScreen extends BaseScreen {
  private title: Text;
  private muteButton: MuteButton;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("Game Screen", 64, "Arial", "bold");

    const backButton = new Button({
      width: 60,
      x: 20,
      text: "✖",
      fontSize: 32,
      clickHandler: () => this.game.changeScreen(StartScreen),
    });

    this.muteButton = new MuteButton({
      width: 60,
      height: 60,
      fontSize: 24,
    });

    this.add(this.title, backButton, this.muteButton);

    playMusic();

    if (import.meta.env.DEV) {
      import("dat.gui").then((dat) => {
        const gui = new dat.GUI();
        const gameFolder = gui.addFolder("GameScreen");
        gameFolder.open();
      });
    }
  }

  override doResize(): void {
    this.title.setPosition(c.width / 2, c.height / 2);

    this.muteButton.setPosition(c.width - this.muteButton.width - 20, 20);
  }
}

if (import.meta.hot) import.meta.hot.accept();
