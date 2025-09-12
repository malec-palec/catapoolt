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
  tick(dt: number): void;
  render(context: CanvasRenderingContext2D): void;
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

  tick(dt: number): void {
    this.children.forEach((child) => child.tick(dt));
    this.currentTime += dt;
    this.alpha = this.currentTime < this.FADE_IN_TIME_MS ? easeInOut(this.currentTime / this.FADE_IN_TIME_MS) : 1;
    this.doUpdate(dt);
  }
  protected doUpdate(dt: number): void {}

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.bgColor;
    context.fillRect(0, 0, c.width, c.height);

    this.children.forEach((child) => {
      context.save();
      context.translate(child.pos.x, child.pos.y);
      // context.rotate(child.rotation);
      // context.globalAlpha = child.alpha * this.alpha;
      // context.scale(child.scale.x, child.scale.y);
      child.render(context);
      context.restore();
    });

    if (this.alpha < 1) {
      context.globalAlpha = 1 - this.alpha;
      context.fillStyle = this.bgColor;
      context.fillRect(0, 0, c.width, c.height);
      context.globalAlpha = 1;
    }
  }

  protected isTransitionComplete(): boolean {
    return this.alpha >= 1;
  }

  onResize(): void {
    const vertical = isVerticalLayout();
    c.width = vertical ? GAME_HEIGHT : GAME_WIDTH;
    c.height = vertical ? GAME_WIDTH : GAME_HEIGHT;
    this.doResize();
  }
  protected doResize(): void {}

  onClick(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.CLICK));
  }
  onMouseDown(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_DOWN));
  }
  onMouseUp(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_UP));
  }
  onMouseMove(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MOUSE_MOVE));
  }

  emitEvent(event: Event): void {
    for (const child of this.children) {
      child.emitEvent(event);
      if (event.isAcknowledged) return;
    }
    if (!event.isAcknowledged) {
      this.handleEvent(event);
    }
  }
  protected handleEvent(event: Event): void {}

  destroy(): void {}
}
