import { IDisplayObject } from "./core/display";
import { Event, MouseEvent, MouseEventType } from "./core/event";
import { easeInOut } from "./core/tween";
import { IGame } from "./game";
import { Color, GAME_HEIGHT, GAME_WIDTH, wrapContext } from "./registry";
import { floor, max, min } from "./system";

export interface ScreenConstructor {
  new (game: IGame, ...rest: any[]): BaseScreen;
}

export interface IScreen {
  onClick(x: number, y: number): void;

  onMouseDown(x: number, y: number): void;
  onMouseUp(x: number, y: number): void;
  onMouseMove(x: number, y: number): void;
  onMouseLeave(x: number, y: number): void;

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

  protected bgColor = Color.White;

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
      wrapContext(context, () => {
        context.translate(child.pos.x, child.pos.y);
        // context.rotate(child.rotation);
        // context.globalAlpha = child.alpha * this.alpha;
        // context.scale(child.scale.x, child.scale.y);
        child.render(context);
      });
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
    const isPortrait = window.innerWidth < window.innerHeight;
    const aspectRatio = isPortrait ? GAME_HEIGHT / GAME_WIDTH : GAME_WIDTH / GAME_HEIGHT;

    const { innerWidth: winW, innerHeight: winH } = window;
    const widthBased = winW / aspectRatio <= winH;

    const optimalW = widthBased ? winW : winH * aspectRatio;
    const optimalH = widthBased ? winW / aspectRatio : winH;

    const minW = isPortrait ? GAME_HEIGHT : GAME_WIDTH;
    const minH = isPortrait ? GAME_WIDTH : GAME_HEIGHT;
    const maxW = minW * 1.5;
    const maxH = minH * 1.5;

    let w = floor(optimalW);
    let h = floor(optimalH);

    if (w < minW || h < minH) {
      const scale = max(minW / w, minH / h);
      w = floor(w * scale);
      h = floor(h * scale);
    }

    if (w > maxW || h > maxH) {
      const scale = min(maxW / w, maxH / h);
      w = floor(w * scale);
      h = floor(h * scale);
    }

    c.width = w;
    c.height = h;
    this.doResize();
  }
  protected doResize(): void {}

  onClick(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.Click));
  }
  onMouseDown(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MouseDown));
  }
  onMouseUp(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MouseUp));
  }
  onMouseMove(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MouseMove));
  }
  onMouseLeave(mouseX: number, mouseY: number): void {
    this.emitEvent(new MouseEvent(mouseX, mouseY, MouseEventType.MouseLeave));
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
