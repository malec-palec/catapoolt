import { DisplayObject } from "../core/display";

export class Text extends DisplayObject {
  constructor(
    private text: string,
    private fontSize: number,
    private fontFamily: string = "Arial",
    private fontWeight: string = "normal",
    x: number = 0,
    y: number = 0,
  ) {
    super(text.length * fontSize * 0.6, fontSize * 1.2, x, y);
  }
  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    context.fillText(this.text, 0, 0);
  }
}
