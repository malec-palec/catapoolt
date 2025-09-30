import { Color } from "../registry";
import { sin } from "../system";
import { DisplayObject } from "./display";

export class AnimatedText extends DisplayObject {
  private letters: { char: string; phase: number; x: number }[] = [];
  private time = 0;
  private amplitude = 15;
  private frequency = 0.002;
  private phaseOffset = 0.5;

  constructor(
    public text: string,
    private fontSize: number,
    private fontFamily = "Arial",
    private fontWeight = "normal",
    x = 0,
    y = 0,
  ) {
    super(0, fontSize * 1.2, x, y);
    this.setupLetters();
  }

  private setupLetters(): void {
    this.letters = [];
    const charWidth = this.fontSize * 0.7;
    let currentX = 0;
    const chars = Array.from(this.text);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      this.letters.push({ char, phase: i * this.phaseOffset, x: currentX });
      if (char === " ") {
        currentX += charWidth * 0.7;
      } else {
        currentX += charWidth * (/\p{Emoji}/u.test(char) ? 1.5 : 1.2);
      }
    }
    this.width = currentX;
  }

  setFontSize(newSize: number): void {
    this.fontSize = newSize;
    this.height = newSize * 1.2;
    this.setupLetters();
  }

  setAnimationParams(amplitude: number, frequency: number, phaseOffset: number): void {
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.phaseOffset = phaseOffset;
    this.setupLetters();
  }

  override tick(dt: number): void {
    this.time += dt;
  }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = Color.Black;
    context.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    for (const letter of this.letters) {
      if (letter.char !== " ") {
        context.fillText(
          letter.char,
          -this.width / 2 + letter.x,
          sin(this.time * this.frequency + letter.phase) * this.amplitude,
        );
      }
    }
  }
}
