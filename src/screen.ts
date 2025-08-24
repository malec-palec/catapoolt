export const enum ScreenName {
  Game,
}

export interface IScreen {
  init(): void;
  update(dt: number): void;
  draw(context: CanvasRenderingContext2D): void;
  destroy(): void;
}

export interface IScreenManager {
  changeScreen(screenName: ScreenName, ...rest: unknown[]): void;
}

export class BaseScreen implements IScreen {
  init(): void {}
  update(dt: number): void {}
  draw(context: CanvasRenderingContext2D): void {}
  destroy(): void {}
}
