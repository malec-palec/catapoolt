import { Rectangle } from "./geom";

export type Button = Rectangle & {
  text: string;
  action: () => void;
};

export const createButton = (obj: Omit<Button, "x" | "y"> & Partial<{ x: number; y: number }>): Button => ({
  x: 0,
  y: 0,
  ...obj,
});

export function drawButton(context: CanvasRenderingContext2D, button: Button): void {
  context.fillStyle = "#333333";
  context.fillRect(button.x, button.y, button.width, button.height);
  context.strokeStyle = context.fillStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(button.x, button.y, button.width, button.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "20px Arial, sans-serif";
  context.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
}
