import { IRenderable } from "../../core/display";

export interface IGameFieldSizeProvider {
  width: number;
  height: number;
}
export class GameField implements IRenderable, IGameFieldSizeProvider {
  constructor(
    public width: number,
    public height: number,
    public bufferZone: number,
  ) {}

  render(context: CanvasRenderingContext2D): void {
    const { width, height, bufferZone } = this;

    // Draw buffer zone background (darker to show it's outside the play area);
    context.fillStyle = "#e0e0e0";
    context.fillRect(-bufferZone, -bufferZone, width + bufferZone * 2, height + bufferZone * 2);

    // Draw game field background
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, width, height);

    // Draw game field borders (main play area)
    context.strokeStyle = "#333333";
    context.lineWidth = 4;
    context.strokeRect(0, 0, width, height);
  }
}
