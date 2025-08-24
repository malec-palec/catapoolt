import { IGame } from "../game";
import { BaseScreen } from "../screen";

export class GameScreen extends BaseScreen {
  constructor(private game: IGame) {
    super();
  }

  override init(): void {
    console.log("GameScreen init");
  }
}
