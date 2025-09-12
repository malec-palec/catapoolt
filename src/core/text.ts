import { DisplayObject } from "../core/display";

export class Text extends DisplayObject {
  constructor(
    public text: string,
    private fontSize: number,
    private fontFamily: string = "Arial",
    private fontWeight: string = "normal",
    x: number = 0,
    y: number = 0,
  ) {
    super(text.length * fontSize * 0.6, fontSize * 1.2, x, y);
  }

  public setFontSize(newSize: number): void {
    this.fontSize = newSize;
    this.width = this.text.length * newSize * 0.6;
    this.height = newSize * 1.2;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    context.fillText(this.text, 0, 0);
  }
}
