import { Event, GamePointerEvent, PointerEventType } from "../core/event";
import { Color, wrapContext } from "../registry";
import { playSound, Sound } from "./audio/sound";
import { DisplayObject } from "./display";

export const enum ButtonState {
  Normal,
  Hover,
  Pressed,
  Disabled,
}
export class Button extends DisplayObject {
  text: string;
  isVisible: boolean = true;

  private currentState: ButtonState = ButtonState.Normal;
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

  private isPointerOver(pointerX: number, pointerY: number): boolean {
    return (
      pointerX >= this.pos.x &&
      pointerX <= this.pos.x + this.width &&
      pointerY >= this.pos.y &&
      pointerY <= this.pos.y + this.height
    );
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    if (!this.isEnabled) {
      this.currentState = ButtonState.Disabled;
    }

    // Button colors based on state
    const colors =
      this.currentState === ButtonState.Hover
        ? { bg: Color.LightGray, border: Color.MediumGray, text: Color.Black }
        : this.currentState === ButtonState.Pressed
          ? { bg: Color.LightSilver, border: Color.DarkerGray, text: Color.Black }
          : this.currentState === ButtonState.Disabled
            ? { bg: Color.WhiteSmoke, border: Color.Silver, text: Color.MediumGray }
            : { bg: Color.VeryLightGray, border: Color.DarkGray2, text: Color.Black };

    // Draw button background
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, this.width, this.height);

    // Draw button border
    context.strokeStyle = colors.border;
    context.lineWidth = 2;
    context.strokeRect(0, 0, this.width, this.height);

    // Draw text centered
    wrapContext(context, () => {
      context.fillStyle = colors.text;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `${this.fontSize}px Arial`;
      context.fillText(this.text, this.width / 2, this.height / 2);
    });
  }

  protected handleEvent(event: Event): void {
    if (!this.isEnabled) {
      c.style.cursor = "default";
      return;
    }

    if (event instanceof GamePointerEvent) {
      const isOver = this.isPointerOver(event.pointerX, event.pointerY);

      switch (event.type) {
        case PointerEventType.PointerMove:
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

        case PointerEventType.PointerDown:
          if (isOver) {
            this.currentState = ButtonState.Pressed;
            event.acknowledge();
          }
          break;

        case PointerEventType.PointerUp:
          if (this.currentState === ButtonState.Pressed) {
            if (isOver) {
              playSound(Sound.Beep);
              this.clickHandler();
              event.acknowledge();
            }
            this.currentState = isOver ? ButtonState.Hover : ButtonState.Normal;
          }
          break;
      }
    }
  }
}
