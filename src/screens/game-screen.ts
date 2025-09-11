import { BaseScreen } from "../base-screen";
import { Text } from "../core/text";
import { IGame } from "../game";

export class GameScreen extends BaseScreen {
  private title: Text;

  constructor(game: IGame) {
    super(game);

    this.title = new Text("Game Screen", 64, "Arial", "bold");

    this.add(this.title);

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

    console.log("GameScreen doResize");
  }
}

if (import.meta.hot) import.meta.hot.accept();
