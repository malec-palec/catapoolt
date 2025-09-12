import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Event } from "../core/event";
import { MuteButton } from "../core/mute-button";
import { Popup } from "../core/popup";
import { Text } from "../core/text";
import { IGame } from "../game";
import { playMusic } from "../music";
import { StartScreen } from "./start-screen";

export class GameScreen extends BaseScreen {
  private title: Text;
  private menuButton: Button;
  private pausePopup: Popup;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("Game Screen", 64, "Arial", "bold");

    this.pausePopup = new Popup({
      title: "Pause",
      width: 400,
      height: 280,
      buttons: [
        {
          text: "Continue",
          onClick: () => {
            this.pausePopup.hide();
          },
        },
        {
          text: "Menu",
          onClick: () => {
            this.pausePopup.hide();
            game.changeScreen(StartScreen);
          },
        },
      ],
    });

    this.menuButton = new Button({
      width: 60,
      x: 16,
      text: "☰",
      fontSize: 32,
      clickHandler: () => {
        this.pausePopup.show();
      },
    });

    const muteButton = new MuteButton({
      x: 16,
      width: 60,
      fontSize: 24,
    });

    this.add(this.title, muteButton, this.menuButton, this.pausePopup);

    playMusic();

    if (import.meta.env.DEV) {
      import("dat.gui").then((dat) => {
        const gui = new dat.GUI();
        const gameFolder = gui.addFolder("GameScreen");
        gameFolder.open();
      });
    }
  }

  override dispatchEvent(event: Event): void {
    if (this.pausePopup.isVisible) {
      this.pausePopup.dispatchEvent(event);
      if (event.isAccepted) {
        return;
      }
    }
    super.dispatchEvent(event);
  }

  override doResize(): void {
    this.title.setPosition(c.width / 2, c.height / 2);

    this.menuButton.setPosition(c.width - this.menuButton.width - 16, 16);
    this.pausePopup.onResize();
  }
}

// if (import.meta.hot) import.meta.hot.accept(()=>{});
