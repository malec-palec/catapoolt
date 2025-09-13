export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const isVerticalLayout = (): boolean => window.innerHeight > window.innerWidth;

export const COLOR_BLACK = "#000000";
export const COLOR_WHITE = "#FFFFFF";

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
  return estimatedWidth > maxAllowedWidth ? Math.floor(maxAllowedWidth / textLength / 0.6) : originalSize;
};
