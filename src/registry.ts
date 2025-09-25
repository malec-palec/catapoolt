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

/**
 * Color stop configuration for gradients as array: [offset, red, green, blue, alpha?]
 * - offset: number (0-1)
 * - red: number (0-255)
 * - green: number (0-255)
 * - blue: number (0-255)
 * - alpha: number (0-1, optional, defaults to 1)
 */
export type ColorStop = [number, number, number, number, number?];

/**
 * Helper function to create and configure gradients with multiple color stops
 * Reduces the number of addColorStop calls by batching them in a single loop
 */
export const createGradientWithStops = (gradient: CanvasGradient, colorStops: ColorStop[]): CanvasGradient => {
  // Single loop to add all color stops, reducing redundant function calls
  for (const [offset, r, g, b, a = 1] of colorStops) {
    gradient.addColorStop(offset, `rgba(${r}, ${g}, ${b}, ${a})`);
  }
  return gradient;
};

/**
 * Create a linear gradient with color stops
 */
export const createLinearGradientWithStops = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colorStops: ColorStop[],
): CanvasGradient => createGradientWithStops(context.createLinearGradient(x1, y1, x2, y2), colorStops);

/**
 * Create a radial gradient with color stops
 */
export const createRadialGradientWithStops = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  colorStops: ColorStop[],
): CanvasGradient => createGradientWithStops(context.createRadialGradient(x1, y1, r1, x2, y2, r2), colorStops);

/**
 * Wrapper function for canvas save/restore operations
 * Automatically calls save() before callback and restore() after
 */
export const wrapContext = (context: CanvasRenderingContext2D, callback: () => void): void => {
  context.save();
  callback();
  context.restore();
};

/**
 * Predefined shadow gradient configurations for reuse
 */
export const ShadowGradients = {
  // Standard shadow for poop - 2 stops
  poop: (alpha: number): ColorStop[] => [
    [0, 0, 0, 0, alpha], // Black with custom alpha at center
    [1, 0, 0, 0, 0], // Transparent black at edge
  ],

  // Cat shadow - 3 stops with solid center
  cat: (): ColorStop[] => [
    [0, 0, 0, 0, 1], // Solid black center
    [0.6, 0, 0, 0, 0.9], // Almost solid black
    [1, 0, 0, 0, 0], // Transparent edge
  ],

  // Vehicle/mouse shadow - 3 stops with lighter center
  vehicle: (): ColorStop[] => [
    [0, 0, 0, 0, 0.15], // Much lighter center for mice
    [0.7, 0, 0, 0, 0.1], // Very light transparency
    [1, 0, 0, 0, 0], // Transparent edge
  ],
};
