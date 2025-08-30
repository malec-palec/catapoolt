import { IGame } from "./game";
import { Button } from "./utils/button";
import { isCoordsInRect } from "./utils/geom";
import { easeInOut } from "./utils/tween";

export const enum ScreenName {
  Splash,
  Menu,
  Credits,
  LevelSelect,
  Game,
}

export interface IScreen {
  onClick(x: number, y: number): void;
  onMouseMove(x: number, y: number): void;
  update(dt: number): void;
  draw(context: CanvasRenderingContext2D): void;
  isTransitionComplete(): boolean;
  destroy(): void;
}

export interface IScreenManager {
  changeScreen(screenName: ScreenName, ...rest: unknown[]): void;
}
export class BaseScreen implements IScreen {
  readonly FADE_IN_TIME_MS = 500;

  private alpha = 0;
  private currentTime = 0;

  protected buttons: Button[] = [];

  constructor(protected game: IGame) {}

  onClick(x: number, y: number): void {
    for (const button of this.buttons) {
      if (isCoordsInRect(x, y, button)) {
        button.action();
        break;
      }
    }
  }

  onMouseMove(x: number, y: number): void {
    c.style.cursor = "default";
    for (const button of this.buttons) {
      if (isCoordsInRect(x, y, button)) {
        c.style.cursor = "pointer";
        break;
      }
    }
  }

  update(dt: number): void {
    this.currentTime += dt;
    this.alpha = this.currentTime < this.FADE_IN_TIME_MS ? easeInOut(this.currentTime / this.FADE_IN_TIME_MS) : 1;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, c.width, c.height);

    context.globalAlpha = this.alpha;
  }

  isTransitionComplete(): boolean {
    return this.alpha >= 1;
  }

  destroy(): void {}
}
