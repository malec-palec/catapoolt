import { GAME_HEIGHT, GAME_WIDTH, isVerticalLayout } from ".";
import { Button } from "./core/button";
import { isCoordsInRect } from "./core/geom";
import { NB_COLORS_BACKGROUND } from "./core/neobrutalism";
import { easeInOut } from "./core/tween";
import { IGame } from "./game";

export interface ScreenConstructor {
  new (game: IGame, ...rest: any[]): BaseScreen;
}

export interface IScreen {
  onClick(x: number, y: number): void;
  onMouseDown?(x: number, y: number): void;
  onMouseUp?(x: number, y: number): void;
  onMouseMove(x: number, y: number): void;
  onResize(): void;
  update(dt: number): void;
  draw(context: CanvasRenderingContext2D): void;
  destroy(): void;
}

export interface IScreenManager {
  changeScreen(screenCtor: ScreenConstructor, ...rest: any[]): void;
}

export class BaseScreen implements IScreen {
  readonly FADE_IN_TIME_MS = 500;

  private alpha = 0;
  private currentTime = 0;

  protected buttons: Button[] = [];
  protected bgColor = NB_COLORS_BACKGROUND;

  constructor(protected game: IGame) {}

  onClick(x: number, y: number): void {
    for (const button of this.buttons) {
      if (isCoordsInRect(x, y, button)) {
        if (!button.isDisabled) button.clickHandler();
        break;
      }
    }
  }

  onMouseDown?(x: number, y: number): void {
    // Default implementation - can be overridden
  }

  onMouseUp?(x: number, y: number): void {
    // Default implementation - can be overridden
  }

  onMouseMove(x: number, y: number): void {
    for (const button of this.buttons) {
      button.isHovered = isCoordsInRect(x, y, button) && !button.isDisabled;
    }
    c.style.cursor = this.buttons.some((button) => button.isHovered) ? "pointer" : "default";
  }

  onResize(): void {
    if (isVerticalLayout()) {
      c.width = GAME_HEIGHT;
      c.height = GAME_WIDTH;
    } else {
      c.width = GAME_WIDTH;
      c.height = GAME_HEIGHT;
    }
  }

  update(dt: number): void {
    this.currentTime += dt;
    this.alpha = this.currentTime < this.FADE_IN_TIME_MS ? easeInOut(this.currentTime / this.FADE_IN_TIME_MS) : 1;
  }

  draw(context: CanvasRenderingContext2D): void {
    const { alpha, bgColor } = this;

    context.fillStyle = bgColor;
    context.fillRect(0, 0, c.width, c.height);

    this.doDraw(context);

    if (alpha <= 1) {
      context.globalAlpha = 1 - alpha;
      context.fillStyle = bgColor;
      context.fillRect(0, 0, c.width, c.height);
      context.globalAlpha = 1;
    }
  }

  protected doDraw(context: CanvasRenderingContext2D): void {}

  protected isTransitionComplete(): boolean {
    return this.alpha >= 1;
  }

  destroy(): void {}
}
