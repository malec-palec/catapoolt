import { Button } from "./button";
import { DisplayObject } from "./display";
import { Event, MouseEvent, MouseEventType } from "./event";
import { isCoordsInRect, Rectangle } from "./geom";
import { Text } from "./text";

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

  draw(ctx: CanvasRenderingContext2D): void {
    const r = 16;
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r, 0, 6.28);
    ctx.fillStyle = this.hovered ? "#ff6b6b" : "#ff4757";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(24, 24);
    ctx.moveTo(24, 8);
    ctx.lineTo(8, 24);
    ctx.stroke();
    ctx.restore();
  }

  protected handleEvent(e: Event): void {
    if (!(e instanceof MouseEvent)) return;

    const over = this.isOver(e.mouseX, e.mouseY);

    if (e.type === MouseEventType.MOUSE_MOVE) {
      this.hovered = over;
      c.style.cursor = over ? "pointer" : "default";
    } else if (over && (e.type === MouseEventType.MOUSE_DOWN || e.type === MouseEventType.MOUSE_UP)) {
      e.accept();
    } else if (over && e.type === MouseEventType.CLICK) {
      this.handler();
      e.accept();
    }
  }

  private isOver(x: number, y: number): boolean {
    const dx = x - (this.position.x + 16);
    const dy = y - (this.position.y + 16);
    return dx * dx + dy * dy <= 256; // 16^2
  }
}

export class Popup extends DisplayObject {
  isVisible = false;
  private body: Rectangle;
  private title: Text;
  private close: RoundCloseButton;
  private buttons: Button[] = [];
  private onClose?: () => void;

  constructor({ title, width, height, onClose, buttons }: PopupOptions) {
    super(width, height);
    this.onClose = onClose;
    this.body = { x: 0, y: 0, width, height };
    this.title = new Text(title, 24, "Arial", "bold");
    this.close = new RoundCloseButton(() => this.hide());

    buttons?.forEach(({ text, onClick }) => {
      this.buttons.push(
        new Button({
          width: 180,
          height: 45,
          text,
          fontSize: 16,
          clickHandler: onClick,
        }),
      );
    });
  }

  show(): void {
    this.isVisible = true;
    this.onResize();
  }

  hide(): void {
    this.isVisible = false;
    this.onClose?.();
  }

  protected handleEvent(event: Event): void {
    if (!this.isVisible) return;

    this.close.dispatchEvent(event);
    if (event.isAccepted) return;

    for (const btn of this.buttons) {
      btn.dispatchEvent(event);
      if (event.isAccepted) return;
    }

    if (event instanceof MouseEvent && event.type === MouseEventType.CLICK) {
      if (!isCoordsInRect(event.mouseX, event.mouseY, this.body)) {
        this.hide();
        event.accept();
        return;
      }
    }

    if (event instanceof MouseEvent) event.accept();
  }

  onResize(): void {
    if (!this.isVisible) return;

    const x = (c.width - this.body.width) / 2;
    const y = (c.height - this.body.height) / 2;
    this.body.x = x;
    this.body.y = y;

    this.title.setPosition(x + this.body.width / 2, y + 50);
    this.close.setPosition(x + this.body.width - 47, y + 15);

    const spacing = 15;
    const totalH = this.buttons.length * 45 + (this.buttons.length - 1) * spacing;
    const startY = y + this.body.height - totalH - 40;
    const btnX = x + (this.body.width - 180) / 2;

    this.buttons.forEach((btn, i) => {
      btn.setPosition(btnX, startY + i * 60);
    });
  }

  update(dt: number): void {
    if (!this.isVisible) return;
    this.title.update(dt);
    this.close.update(dt);
    this.buttons.forEach((btn) => btn.update(dt));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    // Overlay
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, c.width, c.height);

    // Body
    const { x, y, width: w, height: h } = this.body;
    const r = 8;

    ctx.fillStyle = "#fff";
    this.roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, w, h, r);
    ctx.stroke();

    // Elements
    ctx.save();
    ctx.translate(this.title.position.x, this.title.position.y);
    this.title.draw(ctx);
    ctx.restore();

    ctx.save();
    ctx.translate(this.close.position.x, this.close.position.y);
    this.close.draw(ctx);
    ctx.restore();

    this.buttons.forEach((btn) => {
      ctx.save();
      ctx.translate(btn.position.x, btn.position.y);
      btn.draw(ctx);
      ctx.restore();
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
