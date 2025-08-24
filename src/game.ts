import { GUI } from "dat.gui";
import { IScreen, IScreenManager, ScreenName } from "./screen";
import { GameScreen } from "./screens/game-screen";

export interface IGame extends IScreenManager {
  resize(width: number, height: number): void;
  gui: GUI;
  getFps(): number;
}

export class Game implements IGame {
  private topDownContext: CanvasRenderingContext2D;
  private isometricContext: CanvasRenderingContext2D;
  private screen: IScreen;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  readonly gui: GUI;

  constructor() {
    this.topDownContext = topDown.getContext("2d", {
      willReadFrequently: true,
    })!;
    this.isometricContext = isometric.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.gui = new GUI();
    this.screen = new GameScreen(this);
    this.screen.init();

    this.setupMouseHandlers();
  }

  private setupMouseHandlers(): void {
    topDown.onclick = (event) => {
      const rect = topDown.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.screen.handleTopDownClick(x, y);
    };
    isometric.onclick = (event) => {
      const rect = isometric.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.screen.handleIsometricClick(x, y);
    };
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
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const { screen, topDownContext, isometricContext } = this;
    screen.update(dt);

    topDownContext.clearRect(0, 0, topDown.width, topDown.height);
    isometricContext.clearRect(0, 0, isometric.width, isometric.height);

    screen.draw(topDownContext, isometricContext);
  }

  getFps(): number {
    return this.currentFps;
  }

  resize(width: number, height: number): void {
    const halfWidth = width / 2;

    topDown.width = halfWidth;
    topDown.height = height;

    isometric.width = halfWidth;
    isometric.height = height;
  }
}
