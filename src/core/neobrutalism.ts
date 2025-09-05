import { Button } from "./button";

export const enum Spacing {
  XS = 8,
  SM = 16,
  MD = 24,
  LG = 32,
  XL = 48,
}

// Typography heading sizes (in pixels)
export const enum HeadingSize {
  XS = 24,
  SM = 32,
  MD = 48,
  LG = 72,
}

// Typography body sizes (in pixels)
export const enum BodySize {
  XS = 12,
  SM = 14,
  MD = 16,
  LG = 18,
}

export const enum ButtonVariant {
  DEFAULT,
  NEUTRAL,
  SECONDARY,
  DISABLED,
}

export const NB_COLOR_BLACK = "#000000";
export const NB_COLOR_WHITE = "#ffffff";
export const NB_COLOR_BLUE = "#4285f4";
export const NB_COLOR_LIGHT_BLUE = "#e5f0ff";
export const NB_COLOR_LIGHT_GRAY = "#f5f5f5";
export const NB_COLOR_DARK_GRAY = "#666666";
export const NB_COLOR_MEDIUM_GRAY = "#999999";
export const NB_COLOR_DARKER_GRAY = "#333333";
export const NB_COLOR_TRANSPARENT = "transparent";

export const NB_COLORS_BACKGROUND = NB_COLOR_LIGHT_BLUE;
export const NB_COLORS_BORDER = NB_COLOR_BLACK;
export const NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND = NB_COLOR_WHITE;

export const NB_SHADOW_OFFSET = 4;
export const NB_BORDER_RADIUS = 5;
export const NB_BORDER_WIDTH = 2;

// Neobrutalism design system constants
const NEOBRUTALISM = {
  typography: {
    heading: {
      weight: "700",
    },
    body: {
      weight: "500",
    },
  },
  colors: {
    variants: [
      {
        background: NB_COLOR_BLUE, // Blue
        foreground: NB_COLOR_BLACK,
        border: NB_COLOR_BLACK,
        shadow: NB_COLOR_BLACK,
      },
      {
        background: NB_COLOR_WHITE, // White
        foreground: NB_COLOR_BLACK,
        border: NB_COLOR_BLACK,
        shadow: NB_COLOR_BLACK,
      },
      {
        background: NB_COLOR_LIGHT_GRAY, // Light gray
        foreground: NB_COLOR_BLACK,
        border: NB_COLOR_BLACK,
        shadow: NB_COLOR_BLACK,
      },
      {
        background: NB_COLOR_DARK_GRAY, // Dark gray
        foreground: NB_COLOR_MEDIUM_GRAY,
        border: NB_COLOR_DARKER_GRAY,
        shadow: NB_COLOR_DARKER_GRAY,
      },
    ],
  },
} as const;

export const drawButton = (
  context: CanvasRenderingContext2D,
  button: Button,
  variant: ButtonVariant = ButtonVariant.DEFAULT,
  dropShadow = true,
): void => {
  if (button.isDisabled) variant = ButtonVariant.DISABLED;

  const colors = NEOBRUTALISM.colors.variants[variant];

  let buttonX = button.x;
  let buttonY = button.y;
  if (button.isHovered) {
    buttonX = button.x + NB_SHADOW_OFFSET;
    buttonY = button.y + NB_SHADOW_OFFSET;
  }

  if (!button.isHovered && dropShadow) {
    context.fillStyle = colors.shadow;
    context.beginPath();
    context.roundRect(
      button.x + NB_SHADOW_OFFSET,
      button.y + NB_SHADOW_OFFSET,
      button.width,
      button.height,
      NB_BORDER_RADIUS,
    );
    context.fill();
  }

  // Draw main button background
  context.fillStyle = colors.background;
  context.beginPath();
  context.roundRect(buttonX, buttonY, button.width, button.height, NB_BORDER_RADIUS);
  context.fill();

  // Draw border
  context.strokeStyle = colors.border;
  context.lineWidth = NB_BORDER_WIDTH;
  context.beginPath();
  context.roundRect(buttonX, buttonY, button.width, button.height, NB_BORDER_RADIUS);
  context.stroke();

  // Draw button text
  context.fillStyle = colors.foreground;
  context.font = `${NEOBRUTALISM.typography.body.weight} ${BodySize.MD}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(button.text, buttonX + button.width / 2, buttonY + button.height / 2);
};

export const drawHeading = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: HeadingSize = HeadingSize.MD,
  withShadow = false,
): void => {
  withShadow = false;
  context.fillStyle = NB_COLOR_BLACK;
  context.font = `${NEOBRUTALISM.typography.heading.weight} ${size}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (withShadow) {
    // Add text shadow effect
    context.shadowColor = NB_COLOR_BLACK;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 0;
  }

  context.fillText(text, x, y);

  if (withShadow) {
    // Reset shadow
    context.shadowColor = NB_COLOR_TRANSPARENT;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;
  }
};

export const drawText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: BodySize = BodySize.MD,
): void => {
  context.fillStyle = NB_COLOR_BLACK;
  context.font = `${NEOBRUTALISM.typography.body.weight} ${size}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, x, y);
};
