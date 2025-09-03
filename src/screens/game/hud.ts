import { isVerticalLayout } from "../..";
import { DisplayObject } from "../../core/display";
import {
  NB_BORDER_RADIUS,
  NB_BORDER_WIDTH,
  NB_COLORS_BORDER,
  NB_COLORS_SHADOW,
  NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND,
  NB_SHADOW_OFFSET,
  drawText,
} from "../../core/neobrutalism";
import { GAME_FIELD_SIZE, HUD_SIZE } from "../game-screen";

export class HUD extends DisplayObject {
  constructor(
    width: number,
    height: number,
    private levelIndex: number,
  ) {
    super(width, height);
  }

  override update(dt: number): void {
    const isVertical = isVerticalLayout();
    if (isVertical) {
      this.position.y = GAME_FIELD_SIZE;
      this.width = GAME_FIELD_SIZE;
      this.height = HUD_SIZE;
    } else {
      this.position.y = 0;
      this.width = HUD_SIZE;
      this.height = GAME_FIELD_SIZE;
    }
  }

  private drawPanel(context: CanvasRenderingContext2D): void {
    const margin = 10;
    const panelX = margin;
    const panelY = margin;
    const panelWidth = this.width - margin * 2;
    const panelHeight = this.height - margin * 2;

    context.fillStyle = NB_COLORS_SHADOW;
    context.beginPath();
    context.roundRect(panelX + NB_SHADOW_OFFSET, panelY + NB_SHADOW_OFFSET, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.fill();

    context.fillStyle = NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND;
    context.beginPath();
    context.roundRect(panelX, panelY, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.fill();

    context.strokeStyle = NB_COLORS_BORDER;
    context.lineWidth = NB_BORDER_WIDTH;
    context.beginPath();
    context.roundRect(panelX, panelY, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.stroke();
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#ADD8E6";
    context.fillRect(0, 0, this.width, this.height);

    this.drawPanel(context);

    const isVertical = isVerticalLayout();
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    if (isVertical) {
      drawText(context, `Level ${this.levelIndex + 1}`, centerX - 60, centerY, "lg");
    } else {
      drawText(context, `Level ${this.levelIndex + 1}`, centerX, 40, "lg");
    }
  }
}
