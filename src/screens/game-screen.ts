import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Event } from "../core/event";
import { MuteButton } from "../core/mute-button";
import { Popup } from "../core/popup";
import { Text } from "../core/text";
import { IGame } from "../game";
import { GameField } from "./game/game-field";
import { StartScreen } from "./start-screen";
export class GameScreen extends BaseScreen {
  private title: Text;
  private menuButton: Button;
  private pausePopup: Popup;

  private gameField: GameField;
  private originalGameFieldTick: (dt: number) => void;

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
            this.pausePopup.hidePopup();
          },
        },
        {
          text: "Menu",
          onClick: () => {
            this.pausePopup.hidePopup();
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
        this.pausePopup.showPopup();
      },
    });

    const muteButton = new MuteButton({
      x: 16,
      width: 60,
      fontSize: 24,
    });
    // TODO: delete - temporary hide mute button
    muteButton.isVisible = false;

    this.gameField = new GameField(c.width, c.height);

    // Store the original tick method and override it for pause functionality
    this.originalGameFieldTick = this.gameField.tick.bind(this.gameField);
    this.gameField.tick = (dt: number) => {
      if (!this.pausePopup.isVisible) {
        this.originalGameFieldTick(dt);
      }
    };

    this.add(this.title, this.gameField, muteButton, this.menuButton, this.pausePopup);

    // TODO: uncomment - temporary turn off music
    // playMusic();

    if (import.meta.env.DEV) {
      import("dat.gui").then((dat) => {
        const gui = new dat.GUI();
        const fieldFolder = gui.addFolder("GameField");
        this.gameField.setupGUI(fieldFolder);
        fieldFolder.open();
      });
    }
  }

  override emitEvent(event: Event): void {
    if (this.pausePopup.isVisible) {
      this.pausePopup.emitEvent(event);
      if (event.isAcknowledged) {
        return;
      }
    }
    super.emitEvent(event);
  }

  override doResize(): void {
    this.title.setPos(c.width / 2, c.height / 2);

    this.gameField.setSize(c.width, c.height);

    this.menuButton.setPos(c.width - this.menuButton.width - 16, 16);
    this.pausePopup.onResize();

    console.log("🔥 GameScreen onResize");
  }
}
