// Shared neobrutalism design system components
// Based on the neobrutalism-components library styling

import { Button } from "./button";

export interface NeobrutalistStyle {
  borderRadius: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  borderWidth: number;
  colors: {
    background: string;
    foreground: string;
    border: string;
    shadow: string;
  };
}

export const NB_SPACING_XL = 48;

export const NB_COLORS_BACKGROUND = "#e5f0ff";
export const NB_COLORS_SHADOW = "#000000";
export const NB_COLORS_BORDER = "#000000";
export const NB_COLORS_VARIANTS_NEUTRAL_BACKGROUND = "#ffffff";

export const NB_SHADOW_OFFSET = 4;
export const NB_BORDER_RADIUS = 5;
export const NB_BORDER_WIDTH = 2;

// export enum TypographyBodySize {
//   XS = "xs",
//   SM = "sm",
//   MD = "md",
//   LG = "lg",
// }

// Neobrutalism design system constants
const NEOBRUTALISM = {
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  typography: {
    heading: {
      weight: "700",
      sizes: {
        xs: "24px",
        sm: "32px",
        md: "48px",
        lg: "72px",
      },
    },
    body: {
      weight: "500",
      sizes: {
        xs: "12px",
        sm: "14px",
        md: "16px",
        lg: "18px",
      },
    },
  },
  colors: {
    background: "#e5f0ff", // Light blue background
    foreground: "#000000",
    variants: {
      default: {
        background: "#4285f4", // Blue
        foreground: "#000000",
        border: "#000000",
        shadow: "#000000",
      },
      neutral: {
        background: "#ffffff", // White
        foreground: "#000000",
        border: "#000000",
        shadow: "#000000",
      },
      secondary: {
        background: "#f5f5f5", // Light gray
        foreground: "#000000",
        border: "#000000",
        shadow: "#000000",
      },
      disabled: {
        background: "#666666", // Dark gray
        foreground: "#999999",
        border: "#333333",
        shadow: "#333333",
      },
    },
  },
} as const;

export type ButtonVariant = keyof typeof NEOBRUTALISM.colors.variants;

// Shared neobrutalism button drawing function
export const drawButton = (
  context: CanvasRenderingContext2D,
  button: Button,
  variant: ButtonVariant = "default",
): void => {
  const colors = NEOBRUTALISM.colors.variants[variant];

  // Handle hover state by adjusting position
  const buttonX = button.isHovered ? button.x + NB_SHADOW_OFFSET : button.x;
  const buttonY = button.isHovered ? button.y + NB_SHADOW_OFFSET : button.y;
  const showShadow = !button.isHovered;

  // Draw shadow (only when not hovered)
  if (showShadow) {
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
  context.font = `${NEOBRUTALISM.typography.body.weight} ${NEOBRUTALISM.typography.body.sizes.md} Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(button.text, buttonX + button.width / 2, buttonY + button.height / 2);
};

// Shared neobrutalism heading drawing function
export const drawHeading = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: keyof typeof NEOBRUTALISM.typography.heading.sizes = "md",
  withShadow = false,
): void => {
  withShadow = false;
  context.fillStyle = NEOBRUTALISM.colors.foreground;
  context.font = `${NEOBRUTALISM.typography.heading.weight} ${NEOBRUTALISM.typography.heading.sizes[size]} Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (withShadow) {
    // Add text shadow effect
    context.shadowColor = NB_COLORS_SHADOW;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 0;
  }

  context.fillText(text, x, y);

  if (withShadow) {
    // Reset shadow
    context.shadowColor = "transparent";
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
  size: keyof typeof NEOBRUTALISM.typography.body.sizes = "md",
  align: CanvasTextAlign = "center",
): void => {
  context.fillStyle = NEOBRUTALISM.colors.foreground;
  context.font = `${NEOBRUTALISM.typography.body.weight} ${NEOBRUTALISM.typography.body.sizes[size]} Arial, sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(text, x, y);
};
