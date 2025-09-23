import { BaseScreen } from "../base-screen";
import { playMusic } from "../core/audio/sound";
import { Button } from "../core/button";
import { Event } from "../core/event";
import { MuteButton } from "../core/mute-button";
import { Popup } from "../core/popup";
import { Text } from "../core/text";
import { IGame } from "../game";
import { HIGH_SCORE_KEY } from "../registry";
import { isDev } from "../system";
import { GameScene } from "./game/game-scene";
import { HighScoresScreen } from "./high-scores-screen";
import { StartScreen } from "./start-screen";
export class GameScreen extends BaseScreen {
  private title: Text;
  private menuButton: Button;
  private pausePopup: Popup;
  private gameOverPopup: Popup;
  private nextWavePopup: Popup;
  private currentWaveCallback: (() => void) | null = null;

  private gameScene: GameScene;
  private originalGameSceneTick: (dt: number) => void;

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

    this.gameOverPopup = new Popup({
      title: "Game Over",
      width: 400,
      height: 300,
      onClose() {
        game.changeScreen(StartScreen);
      },
      buttons: [
        {
          text: "Scores",
          onClick: () => {
            game.changeScreen(HighScoresScreen);
          },
        },
        {
          text: "Restart",
          onClick: () => {
            game.changeScreen(GameScreen);
          },
        },
      ],
    });

    // Initialize with placeholder - will be updated when wave advances
    this.nextWavePopup = new Popup({
      title: "Next Wave",
      width: 400,
      height: 200,
      onClose: () => {
        // Same behavior as Continue button when closed by X or area click
        if (this.currentWaveCallback) {
          this.currentWaveCallback();
          this.currentWaveCallback = null;
        }
      },
      buttons: [
        {
          text: "Continue",
          onClick: () => {
            this.nextWavePopup.hidePopup();
            if (this.currentWaveCallback) {
              this.currentWaveCallback();
              this.currentWaveCallback = null;
            }
          },
        },
      ],
    });
    this.nextWavePopup.setBodyText("Mice became stronger");

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

    this.gameScene = new GameScene(c.width, c.height);

    this.gameScene.onGameOverCallback = (miceEaten: number) => {
      const currentHighScore = localStorage.getItem(HIGH_SCORE_KEY);
      const currentHighScoreNum = currentHighScore ? parseInt(currentHighScore, 10) : 0;

      if (miceEaten > currentHighScoreNum) {
        localStorage.setItem(HIGH_SCORE_KEY, miceEaten.toString());
      }

      this.gameOverPopup.updateTitle("Game Over");
      this.gameOverPopup.setBodyText(`Your score: ${miceEaten} mice eaten`);
      this.gameOverPopup.showPopup();
    };

    this.gameScene.onNextWaveCallback = (waveNumber: number, onContinue: () => void) => {
      this.nextWavePopup.updateTitle(`Next Wave ${waveNumber}`);
      this.currentWaveCallback = onContinue;
      this.nextWavePopup.showPopup();
    };

    // Store the original tick method and override it for pause functionality
    this.originalGameSceneTick = this.gameScene.tick.bind(this.gameScene);
    this.gameScene.tick = (dt: number) => {
      if (!this.pausePopup.isVisible && !this.gameOverPopup.isVisible && !this.nextWavePopup.isVisible) {
        this.originalGameSceneTick(dt);
      }
    };

    this.add(
      this.title,
      this.gameScene,
      muteButton,
      this.menuButton,
      this.pausePopup,
      this.gameOverPopup,
      this.nextWavePopup,
    );

    if (isDev) {
      import("dat.gui").then((dat) => {
        const gui = new dat.GUI();
        const sceneFolder = gui.addFolder("GameScene");
        this.gameScene.setupGUI(sceneFolder);
        sceneFolder.open();
      });
    } else {
      playMusic();
    }
  }

  override emitEvent(event: Event): void {
    if (this.gameOverPopup.isVisible) {
      this.gameOverPopup.emitEvent(event);
      if (event.isAcknowledged) {
        return;
      }
    }
    if (this.pausePopup.isVisible) {
      this.pausePopup.emitEvent(event);
      if (event.isAcknowledged) {
        return;
      }
    }
    if (this.nextWavePopup.isVisible) {
      this.nextWavePopup.emitEvent(event);
      if (event.isAcknowledged) {
        return;
      }
    }
    super.emitEvent(event);
  }

  override doResize(): void {
    this.title.setPos(c.width / 2, c.height / 2);

    this.gameScene.setSize(c.width, c.height);

    this.menuButton.setPos(c.width - this.menuButton.width - 16, 16);
    this.pausePopup.onResize();
    this.gameOverPopup.onResize();
    this.nextWavePopup.onResize();
  }
}
