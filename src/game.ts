import { IScreen, IScreenManager, ScreenName } from "./screen";
import { GameScreen } from "./screens/game-screen";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

export class Game implements IGame {
  private context: CanvasRenderingContext2D;
  private screen: IScreen;

  constructor() {
    this.context = c.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.screen = new GameScreen(this);
    this.screen.init();
  }

  changeScreen(name: ScreenName, ...rest: any[]): void {
    const { screen } = this;
    screen.destroy();

    let newScreen: IScreen;
    switch (name) {
      case ScreenName.Game:
        newScreen = new GameScreen(this);
        break;
    }
    newScreen.init();
    this.screen = newScreen;
  }

  update(dt: number): void {
    const { screen, context } = this;
    screen.update(dt);

    // context.clearRect(0, 0, c.width, c.height);
    screen.draw(context);
  }
}
