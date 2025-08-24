export const enum ScreenName {
  Game,
}

export interface IScreen {
  // Do I need it?
  init(): void;
  update(dt: number): void;
  draw(topDownContext: CanvasRenderingContext2D, isometricContext: CanvasRenderingContext2D): void;
  handleTopDownClick(x: number, y: number): void;
  handleIsometricClick(x: number, y: number): void;
  destroy(): void;
}

export interface IScreenManager {
  changeScreen(screenName: ScreenName, ...rest: unknown[]): void;
}

export class BaseScreen implements IScreen {
  init(): void {}
  update(dt: number): void {}
  draw(topDownContext: CanvasRenderingContext2D, isometricContext: CanvasRenderingContext2D): void {}
  handleTopDownClick(x: number, y: number): void {}
  handleIsometricClick(x: number, y: number): void {}
  destroy(): void {}
}
