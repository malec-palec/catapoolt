import { Color, rgba } from "../registry";
import { min } from "../system";
import { Button } from "./button";
import { DisplayObject } from "./display";
import { Event, MouseEvent, MouseEventType } from "./event";
import { isCoordsInRect, Rectangle } from "./geom";
import { Text } from "./text";
import { easeInOut, easeOutBack } from "./tween";

export interface PopupOptions {
  title: string;
  width: number;
  height: number;
  onClose?: () => void;
  buttons?: { text: string; onClick: () => void }[];
}

class RoundCloseButton extends DisplayObject {
  private handler: () => void;
  private hovered = false;

  constructor(handler: () => void) {
    super(32, 32, 0, 0);
    this.handler = handler;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.beginPath();
    context.arc(16, 16, 16, 0, 6.28);
    context.fillStyle = this.hovered ? Color.LightCoral : Color.Tomato;
    context.fill();
    context.strokeStyle = Color.White;
    context.lineWidth = 2;
    context.stroke();

    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(8, 8);
    context.lineTo(24, 24);
    context.moveTo(24, 8);
    context.lineTo(8, 24);
    context.stroke();
    context.restore();
  }

  protected handleEvent(e: Event): void {
    if (!(e instanceof MouseEvent)) return;

    const over = this.isOver(e.mouseX, e.mouseY);

    if (e.type === MouseEventType.MouseMove) {
      this.hovered = over;
      c.style.cursor = over ? "pointer" : "default";
    } else if (over) {
      if (e.type === MouseEventType.Click) this.handler();
      e.acknowledge();
    }
  }

  private isOver(x: number, y: number): boolean {
    const dx = x - (this.pos.x + 16);
    const dy = y - (this.pos.y + 16);
    return dx * dx + dy * dy <= 256; // 16^2
  }
}

export class Popup extends DisplayObject {
  title: Text;
  isVisible = false;
  private body: Rectangle;
  private bodyText?: Text;
  private close: RoundCloseButton;
  private buttons: Button[] = [];
  private onClose?: () => void;

  // Animation properties
  private readonly ANIMATION_DURATION = 300; // ms
  private animationTime = 0;
  private animationState = 0; // 0: none, 1: in, 2: out
  private currentScale = 0;
  private currentAlpha = 0;

  constructor({ title, width, height, onClose, buttons }: PopupOptions) {
    super(width, height);
    this.onClose = onClose;
    this.body = { x: 0, y: 0, width, height };
    this.title = new Text(title, 24, "Arial", "bold");
    this.close = new RoundCloseButton(() => this.hidePopup());

    if (buttons) {
      this.buttons = buttons.map(
        ({ text, onClick }) =>
          new Button({
            width: 180,
            height: 45,
            text,
            fontSize: 16,
            clickHandler: onClick,
          }),
      );
    }
  }

  showPopup(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.animationState = 1;
    this.animationTime = 0;
    this.currentScale = 0;
    this.currentAlpha = 0;
    this.onResize();
  }

  updateTitle(newTitle: string): void {
    this.title = new Text(newTitle, 24, "Arial", "bold");
  }

  setBodyText(text: string): void {
    this.bodyText = new Text(text, 16, "Arial", "normal");
  }

  hidePopup(): void {
    if (!this.isVisible || this.animationState === 2) return;

    this.animationState = 2;
    this.animationTime = 0;
  }

  protected handleEvent(event: Event): void {
    if (!this.isVisible || this.animationState === 2) return;

    // Only handle interactions if animation is complete or nearly complete
    if (this.animationState === 1 && this.currentAlpha < 0.8) {
      if (event instanceof MouseEvent) event.acknowledge();
      return;
    }

    this.close.emitEvent(event);
    if (event.isAcknowledged) return;

    for (const btn of this.buttons) {
      btn.emitEvent(event);
      if (event.isAcknowledged) return;
    }

    if (event instanceof MouseEvent && event.type === MouseEventType.Click) {
      if (!isCoordsInRect(event.mouseX, event.mouseY, this.body)) {
        this.hidePopup();
        event.acknowledge();
        return;
      }
    }

    if (event instanceof MouseEvent) event.acknowledge();
  }

  onResize(): void {
    if (!this.isVisible) return;

    const x = (c.width - this.body.width) / 2;
    const y = (c.height - this.body.height) / 2;
    this.body.x = x;
    this.body.y = y;

    this.title.setPos(x + this.body.width * 0.5, y + 50);
    if (this.bodyText) {
      this.bodyText.setPos(x + this.body.width * 0.5, y + 90);
    }
    this.close.setPos(x + this.body.width - 47, y + 15);

    const totalH = this.buttons.length * 60 - 15;
    const startY = y + this.body.height - totalH - 40;
    const btnX = x + (this.body.width - 180) * 0.5;

    this.buttons.forEach((btn, i) => {
      btn.setPos(btnX, startY + i * 60);
    });
  }

  tick(dt: number): void {
    if (!this.isVisible) return;

    // Update animation
    if (this.animationState) {
      this.animationTime += dt;
      const progress = min(this.animationTime / this.ANIMATION_DURATION, 1);
      const easedProgress = easeInOut(progress);

      if (this.animationState === 1) {
        this.currentScale = easeOutBack(progress);
        this.currentAlpha = easedProgress;

        if (progress >= 1) {
          this.animationState = 0;
          this.currentScale = 1;
          this.currentAlpha = 1;
        }
      } else {
        this.currentScale = 1 - easedProgress;
        this.currentAlpha = 1 - easedProgress;

        if (progress >= 1) {
          this.animationState = 0;
          this.isVisible = false;
          this.currentScale = 0;
          this.currentAlpha = 0;
          this.onClose?.();
        }
      }
    }

    // Only update interactive elements if not animating out
    if (this.animationState !== 2) {
      this.title.tick(dt);
      if (this.bodyText) {
        this.bodyText.tick(dt);
      }
      this.close.tick(dt);
      this.buttons.forEach((btn) => btn.tick(dt));
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    // Apply alpha to overlay
    context.fillStyle = rgba(Color.BlackRGB, this.currentAlpha * 0.7);
    context.fillRect(0, 0, c.width, c.height);

    // Apply scale and alpha transforms for the popup body
    const { x, y, width: w, height: h } = this.body;
    const centerX = x + w * 0.5;
    const centerY = y + h * 0.5;

    context.save();
    context.translate(centerX, centerY);
    context.scale(this.currentScale, this.currentScale);
    context.globalAlpha = this.currentAlpha;
    context.translate(-centerX, -centerY);

    // Body
    const r = 8;
    context.fillStyle = Color.White;
    this.roundRect(context, x, y, w, h, r);
    context.fill();

    context.strokeStyle = Color.DarkGray;
    context.lineWidth = 2;
    this.roundRect(context, x, y, w, h, r);
    context.stroke();

    // Elements
    this.renderTranslated(context, this.title);
    if (this.bodyText) {
      this.renderTranslated(context, this.bodyText);
    }
    this.renderTranslated(context, this.close);
    this.buttons.forEach((btn) => this.renderTranslated(context, btn));

    context.restore(); // Restore scale and alpha transforms
  }

  private renderTranslated(
    context: CanvasRenderingContext2D,
    obj: { pos: { x: number; y: number }; render: (context: CanvasRenderingContext2D) => void },
  ): void {
    context.save();
    context.translate(obj.pos.x, obj.pos.y);
    obj.render(context);
    context.restore();
  }

  private roundRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }
}
