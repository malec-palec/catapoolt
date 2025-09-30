import { IRenderable } from "../../core/display";
import { Color } from "../../registry";

export interface IGameFieldSizeProvider {
  width: number;
  height: number;
}

export interface GameField extends IGameFieldSizeProvider, IRenderable {
  bufferZone: number;
}

export const createGameField = (width: number, height: number, bufferZone: number): GameField => ({
  width,
  height,
  bufferZone,
  render(context) {
    // Draw buffer zone background (darker to show it's outside the play area);
    context.fillStyle = Color.LightGray;
    context.fillRect(-bufferZone, -bufferZone, width + bufferZone * 2, height + bufferZone * 2);

    // Draw game field background
    context.fillStyle = Color.VeryLightGray;
    context.fillRect(0, 0, width, height);

    // Draw game field borders (main play area)
    context.strokeStyle = Color.DarkGray;
    context.lineWidth = 4;
    context.strokeRect(0, 0, width, height);
  },
});
