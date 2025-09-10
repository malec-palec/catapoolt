import { IDisplayObject } from "./core/display";
import { Event, MouseEvent, MouseEventType } from "./core/event";
import { easeInOut } from "./core/tween";
import { IGame } from "./game";
import { COLOR_WHITE, GAME_HEIGHT, GAME_WIDTH, isVerticalLayout } from "./registry";

export interface ScreenConstructor {
  new (game: IGame, ...rest: any[]): BaseScreen;
}

export interface IScreen {
  onClick(x: number, y: number): void;

  onMouseDown(x: number, y: number): void;
  onMouseUp(x: number, y: number): void;
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
  protected currentTime = 0;

  private children: IDisplayObject[] = [];

  protected bgColor = COLOR_WHITE;

  constructor(protected game: IGame) {}

  add(...children: IDisplayObject[]): void {
    this.children.push(...children);
  }

  update(dt: number): void {
    for (const child of this.children) {
      child.update(dt);
    }
    this.currentTime += dt;
    this.alpha = this.currentTime < this.FADE_IN_TIME_MS ? easeInOut(this.currentTime / this.FADE_IN_TIME_MS) : 1;

    this.doUpdate(dt);
  }
  protected doUpdate(dt: number): void {}

  draw(context: CanvasRenderingContext2D): void {
    const { alpha, bgColor } = this;

    context.fillStyle = bgColor;
    context.fillRect(0, 0, c.width, c.height);

    this.children.forEach((child) => {
      context.save();
      context.translate(child.position.x, child.position.y);
      // context.rotate(child.rotation);
      // context.globalAlpha = child.alpha * this.alpha;
      // context.scale(child.scale.x, child.scale.y);
      child.draw(context);
      context.restore();
    });

    if (alpha <= 1) {
      context.globalAlpha = 1 - alpha;
      context.fillStyle = bgColor;
      context.fillRect(0, 0, c.width, c.height);
      context.globalAlpha = 1;
    }
  }

  protected isTransitionComplete(): boolean {
    return this.alpha >= 1;
  }

  onResize(): void {
    if (isVerticalLayout()) {
      c.width = GAME_HEIGHT;
      c.height = GAME_WIDTH;
    } else {
      c.width = GAME_WIDTH;
      c.height = GAME_HEIGHT;
    }
    this.doResize();
  }
  protected doResize(): void {}

  onClick(mouseX: number, mouseY: number): void {
    this.dispatchEvent(new MouseEvent(mouseX, mouseY, MouseEventType.CLICK));
  }
  onMouseDown(mouseX: number, mouseY: number): void {
    this.dispatchEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_DOWN));
  }
  onMouseUp(mouseX: number, mouseY: number): void {
    this.dispatchEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_UP));
  }
  onMouseMove(mouseX: number, mouseY: number): void {
    this.dispatchEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_MOVE));
  }

  dispatchEvent(event: Event): void {
    for (const child of this.children) {
      child.dispatchEvent(event);
      if (event.isAccepted) {
        break;
      }
    }
    if (!event.isAccepted) {
      this.handleEvent(event);
    }
  }
  protected handleEvent(event: Event): void {}

  destroy(): void {}
}
