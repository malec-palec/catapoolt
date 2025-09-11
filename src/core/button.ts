import { Event, MouseEvent, MouseEventType } from "../core/event";
import { DisplayObject } from "./display";

export const enum ButtonState {
  Normal,
  Hover,
  Pressed,
  Disabled,
}
export class Button extends DisplayObject {
  private currentState: ButtonState = ButtonState.Normal;
  private text: string;
  private clickHandler: () => void;
  private isEnabled: boolean = true;
  private fontSize: number = 16;

  constructor({
    width,
    height = width,
    x = 0,
    y = x,
    text,
    clickHandler,
    isEnabled = true,
    fontSize = 16,
  }: {
    width: number;
    height?: number;
    x?: number;
    y?: number;
    text: string;
    clickHandler: () => void;
    isEnabled?: boolean;
    fontSize?: number;
  }) {
    super(width, height, x, y);
    this.text = text;
    this.clickHandler = clickHandler;
    this.isEnabled = isEnabled;
    this.fontSize = fontSize;
  }

  private isMouseOver(mouseX: number, mouseY: number): boolean {
    return (
      mouseX >= this.position.x &&
      mouseX <= this.position.x + this.width &&
      mouseY >= this.position.y &&
      mouseY <= this.position.y + this.height
    );
  }

  draw(context: CanvasRenderingContext2D): void {
    if (!this.isEnabled) {
      this.currentState = ButtonState.Disabled;
    }

    // Button colors based on state
    let bgColor: string;
    let borderColor: string;
    let textColor: string;

    switch (this.currentState) {
      case ButtonState.Hover:
        bgColor = "#e0e0e0";
        borderColor = "#999";
        textColor = "#000";
        break;
      case ButtonState.Pressed:
        bgColor = "#d0d0d0";
        borderColor = "#666";
        textColor = "#000";
        break;
      case ButtonState.Disabled:
        bgColor = "#f5f5f5";
        borderColor = "#ccc";
        textColor = "#999";
        break;
      default: // NORMAL
        bgColor = "#f0f0f0";
        borderColor = "#aaa";
        textColor = "#000";
        break;
    }

    // Draw button background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, this.width, this.height);

    // Draw button border
    context.strokeStyle = borderColor;
    context.lineWidth = 2;
    context.strokeRect(0, 0, this.width, this.height);

    // Draw text centered
    context.save();
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${this.fontSize}px Arial`;
    context.fillText(this.text, this.width / 2, this.height / 2);
    context.restore();
  }

  protected handleEvent(event: Event): void {
    if (!this.isEnabled) {
      c.style.cursor = "default";
      return;
    }

    if (event instanceof MouseEvent) {
      const isOver = this.isMouseOver(event.mouseX, event.mouseY);

      switch (event.type) {
        case MouseEventType.MOUSE_MOVE:
          if (isOver) {
            if (this.currentState === ButtonState.Normal) {
              this.currentState = ButtonState.Hover;
              c.style.cursor = "pointer";
            }
          } else {
            if (this.currentState === ButtonState.Hover || this.currentState === ButtonState.Pressed) {
              this.currentState = ButtonState.Normal;
              c.style.cursor = "default";
            }
          }
          break;

        case MouseEventType.MOUSE_DOWN:
          if (isOver) {
            this.currentState = ButtonState.Pressed;
            event.accept();
          }
          break;

        case MouseEventType.MOUSE_UP:
          if (this.currentState === ButtonState.Pressed) {
            this.currentState = isOver ? ButtonState.Hover : ButtonState.Normal;
          }
          break;

        case MouseEventType.CLICK:
          if (isOver) {
            this.clickHandler();
            event.accept();
          }
          break;
      }
    }
  }
}
