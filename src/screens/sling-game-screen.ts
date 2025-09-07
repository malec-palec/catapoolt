import * as dat from "dat.gui";
import { BodySize, drawText } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";

export class SlingGameScreen extends BaseScreen {
  constructor(game: IGame) {
    super(game);

    const gui = new dat.GUI();
  }

  override update(dt: number): void {
    super.update(dt);
  }

  protected override doDraw(context: CanvasRenderingContext2D): void {
    drawText(context, "Cat Sling Game", c.width / 2, c.height / 2, BodySize.LG);
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("🔥 GameScreen module accept callback triggered");
  });
}
