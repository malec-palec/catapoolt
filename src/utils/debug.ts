import { Point2D } from "./geom";

export interface DebugInfo {
  lastTopDownClick?: Point2D;
  lastIsometricClick?: Point2D;
  fps?: number;
}

export const drawDebugInfo = (
  ctx: CanvasRenderingContext2D,
  debugInfo: DebugInfo,
  canvasWidth: number,
  x?: number,
  y: number = 10,
): void => {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = "12px monospace";
  ctx.textBaseline = "top";

  const panelWidth = 250;
  const panelHeight = 80; // Increased height to accommodate FPS
  const actualX = x !== undefined ? x : canvasWidth - panelWidth - 10; // Right side if x not specified

  let currentY = y;
  const lineHeight = 16;

  // Background for better readability
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(actualX - 5, y - 5, panelWidth, panelHeight);

  ctx.fillStyle = "#000";
  ctx.fillText("Debug Info:", actualX, currentY);
  currentY += lineHeight;

  // Display FPS
  if (debugInfo.fps !== undefined) {
    ctx.fillText(`FPS: ${debugInfo.fps}`, actualX, currentY);
    currentY += lineHeight;
  }

  if (debugInfo.lastTopDownClick) {
    ctx.fillText(
      `2D: (${debugInfo.lastTopDownClick.x.toFixed(1)}, ${debugInfo.lastTopDownClick.y.toFixed(1)})`,
      actualX,
      currentY,
    );
    currentY += lineHeight;
  }

  if (debugInfo.lastIsometricClick) {
    ctx.fillText(
      `Iso: (${debugInfo.lastIsometricClick.x.toFixed(1)}, ${debugInfo.lastIsometricClick.y.toFixed(1)})`,
      actualX,
      currentY,
    );
    currentY += lineHeight;
  }

  ctx.restore();
};
