import { isVerticalLayout } from "../..";
import { Button, createButton } from "../../core/button";
import { DisplayObject } from "../../core/display";
import { isCoordsInRect } from "../../core/geom";
import {
  ButtonVariant,
  HeadingSize,
  NB_BORDER_RADIUS,
  NB_BORDER_WIDTH,
  NB_COLORS_BORDER,
  NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND,
  NB_COLOR_BLACK,
  NB_SHADOW_OFFSET,
  drawButton,
  drawHeading,
} from "../../core/neobrutalism";
import { GAME_FIELD_SIZE, HUD_SIZE } from "../game-screen";

const UI_MARGIN = 10;
const BACK_BUTTON_SIZE = 50;
const ACTION_BUTTON_HEIGHT = 40;
const BUTTON_GAP = 12;

export class HUD extends DisplayObject {
  private backButton: Button;

  private actionButtons: Button[] = [];

  constructor(
    width: number,
    height: number,
    private levelIndex: number,
    onBackClick: () => void,
  ) {
    super(width, height);

    this.backButton = createButton({
      x: UI_MARGIN,
      y: UI_MARGIN,
      width: BACK_BUTTON_SIZE,
      height: BACK_BUTTON_SIZE,
      text: "⟵",
      clickHandler: onBackClick,
    });

    this.actionButtons = [
      createButton({
        width: 0,
        height: ACTION_BUTTON_HEIGHT,
        text: "Start",
        clickHandler: () => console.log("Start button clicked"),
      }),
      createButton({
        width: 0,
        height: ACTION_BUTTON_HEIGHT,
        text: "Reset",
        clickHandler: () => console.log("Reset button clicked"),
      }),
    ];
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

    this.updateButtonPositions();
  }

  private updateButtonPositions(): void {
    const isVertical = isVerticalLayout();
    const panelWidth = this.width - UI_MARGIN * 2;
    const panelHeight = this.height - UI_MARGIN * 2;

    const [startButton, resetButton] = this.actionButtons;

    const buttonWidth = isVertical ? panelHeight : panelWidth - BUTTON_GAP * 2;
    if (isVertical) {
      const buttonsStartY = UI_MARGIN + BUTTON_GAP;

      startButton.x = UI_MARGIN + BUTTON_GAP;
      startButton.y = buttonsStartY;
      startButton.width = buttonWidth;

      resetButton.x = UI_MARGIN + BUTTON_GAP;
      resetButton.y = buttonsStartY + ACTION_BUTTON_HEIGHT + BUTTON_GAP;
      resetButton.width = buttonWidth;
    } else {
      const buttonsStartY = UI_MARGIN + BACK_BUTTON_SIZE + BUTTON_GAP;

      startButton.x = UI_MARGIN + BUTTON_GAP;
      startButton.y = buttonsStartY;
      startButton.width = buttonWidth;

      resetButton.x = UI_MARGIN + BUTTON_GAP;
      resetButton.y = buttonsStartY + ACTION_BUTTON_HEIGHT + BUTTON_GAP;
      resetButton.width = buttonWidth;
    }
  }

  private drawPanel(context: CanvasRenderingContext2D): void {
    const isVertical = isVerticalLayout();
    const headerHeight = !isVertical ? BACK_BUTTON_SIZE : 0; // Header in landscape mode (!isVertical)

    const panelX = UI_MARGIN;
    const panelY = UI_MARGIN;
    const panelWidth = this.width - UI_MARGIN * 2;
    const panelHeight = this.height - UI_MARGIN * 2;

    context.fillStyle = NB_COLOR_BLACK;
    context.beginPath();
    context.roundRect(panelX + NB_SHADOW_OFFSET, panelY + NB_SHADOW_OFFSET, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.fill();

    // Draw panel background (includes header if present)
    context.fillStyle = NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND;
    context.beginPath();
    context.roundRect(panelX, panelY, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.fill();

    // Draw panel border (includes header if present)
    context.strokeStyle = NB_COLORS_BORDER;
    context.lineWidth = NB_BORDER_WIDTH;
    context.beginPath();
    context.roundRect(panelX, panelY, panelWidth, panelHeight, NB_BORDER_RADIUS);
    context.stroke();

    // If in landscape mode, draw header section within the panel
    if (!isVertical) {
      const { backButton } = this;
      // Draw separator line between header and content
      const separatorY = panelY + headerHeight;
      context.strokeStyle = context.fillStyle = NB_COLORS_BORDER;
      context.lineWidth = NB_BORDER_WIDTH;
      context.moveTo(panelX, separatorY);
      context.lineTo(panelX + panelWidth, separatorY);
      context.stroke();

      // Draw integrated back button in header
      context.moveTo(backButton.x + backButton.width, backButton.y + backButton.height);
      context.lineTo(backButton.x + backButton.width, backButton.y);
      context.stroke();
      context.font = "500 16px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(backButton.text, backButton.x + backButton.width / 2, backButton.y + backButton.height / 2);

      const buttonRightEdge = backButton.x + backButton.width;
      const availableSpace = panelX + panelWidth - buttonRightEdge;
      drawHeading(
        context,
        `Level ${this.levelIndex + 1}`,
        buttonRightEdge + availableSpace / 2,
        panelY + headerHeight / 2,
        HeadingSize.XS,
      );
    }
  }

  handleMouseMove(x: number, y: number): void {
    const [startButton, resetButton] = this.actionButtons;
    startButton.isHovered = isCoordsInRect(x, y, startButton);
    resetButton.isHovered = isCoordsInRect(x, y, resetButton);
    c.style.cursor = this.actionButtons.some((button) => button.isHovered) ? "pointer" : "default";
  }

  handleMouseClick(x: number, y: number): boolean {
    const [startButton, resetButton] = this.actionButtons;
    if (isCoordsInRect(x, y, startButton)) {
      startButton.clickHandler();
      return true;
    }
    if (isCoordsInRect(x, y, resetButton)) {
      resetButton.clickHandler();
      return true;
    }
    return false;
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#ADD8E6";
    context.fillRect(0, 0, this.width, this.height);

    this.drawPanel(context);

    const [startButton, resetButton] = this.actionButtons;
    drawButton(context, startButton, ButtonVariant.DEFAULT, false);
    drawButton(context, resetButton, ButtonVariant.SECONDARY, false);
  }
}
