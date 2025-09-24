import { floor } from "./system";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const isVerticalLayout = (): boolean => window.innerHeight > window.innerWidth;

export const HIGH_SCORE_KEY = "catapoolt_highScore";

/**
 * Calculate adaptive font size based on screen width and text length
 * @param originalSize - The desired font size for normal screens
 * @param textLength - Length of the text to be displayed
 * @param maxWidthRatio - Maximum ratio of screen width the text should occupy (default 0.9)
 * @returns Scaled font size
 */
export const getAdaptiveFontSize = (originalSize: number, textLength: number, maxWidthRatio: number): number => {
  const maxAllowedWidth = c.width * maxWidthRatio;
  const estimatedWidth = textLength * originalSize * 0.6;

  // Approximate character width is about 0.6 * fontSize
  return estimatedWidth > maxAllowedWidth ? floor(maxAllowedWidth / textLength / 0.6) : originalSize;
};

export const enum Color {
  Black = "#000",
  White = "#FFF",
  DarkGray = "#333",
  LightGray = "#e0e0e0",
  VeryLightGray = "#f0f0f0",
  Brown = "#654321",
  MediumGray = "#999",
  DarkerGray = "#666",
  // Additional colors found in the codebase
  ForestGreen = "#228B22",
  Blue = "#4444ff",
  Red = "#ff0000",
  LightBlue = "#0066ff",
  Orange = "#ff6600",
  LightCoral = "#ff6b6b",
  Tomato = "#ff4757",
  Gray = "#7f7f7f",
  LightSilver = "#d0d0d0",
  WhiteSmoke = "#f5f5f5",
  Silver = "#ccc",
  DarkGray2 = "#aaa",
  BrightGreen = "#00FF00",
  DarkSlateGray = "#2a2c35",
  BrightGreen2 = "#00ff00",
  // For RGB values
  SkyBlue = "0, 150, 255",
  DarkRed = "204, 0, 0",
  BlackRGB = "0, 0, 0",
  RedRGB = "255, 0, 0",
}

/**
 * Helper function to create rgba color strings
 */
export const rgba = (color: string, alpha: number): string => `rgba(${color}, ${alpha})`;

/**
 * Helper function to create rgba color strings with dynamic RGB values
 */
export const rgbaValues = (red: number, green: number, blue: number, alpha: number): string =>
  `rgba(${red}, ${green}, ${blue}, ${alpha})`;
