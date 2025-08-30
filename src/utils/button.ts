import { Rectangle } from "./geom";

export type Button = Rectangle & {
  text: string;
  action: () => void;
};

export function drawButton(ctx: CanvasRenderingContext2D, button: Button): void {
  ctx.fillStyle = "#333333";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
}
