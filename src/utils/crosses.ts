import { Point2D, Point3D } from "./geom";
import { IsometricConfig, worldToIsometric } from "./isometric";

export interface CrossMark {
  id: string;
  topDownPos: Point2D;
  isometricPos: Point2D;
  worldPos: Point3D;
  startTime: number;
  duration: number;
}

export interface CrossDrawConfig {
  size: number;
  lineWidth: number;
  color: string;
  rotation?: number; // Rotation in radians
  scaleY?: number; // Y-axis scaling factor
}

export const DEFAULT_CROSS_CONFIG: CrossDrawConfig = {
  size: 20,
  lineWidth: 2,
  color: "#ff6600",
  rotation: 0,
  scaleY: 1,
};

/**
 * Creates a cross mark from a 2D topDown position
 */
export const createCrossFromTopDown = (x: number, y: number, isometricConfig: IsometricConfig): CrossMark => {
  const worldPos: Point3D = { x, y, z: 0 };
  const topDownPos: Point2D = { x, y };
  const isometricPos = worldToIsometric(worldPos, isometricConfig);

  return {
    id: `cross_${Date.now()}_${Math.random()}`,
    topDownPos,
    isometricPos,
    worldPos,
    startTime: Date.now(),
    duration: 500, // 0.5 seconds
  };
};

/**
 * Creates a cross mark from an isometric screen position
 * Note: We approximate the world position since we don't have true inverse projection
 */
export const createCrossFromIsometric = (
  screenX: number,
  screenY: number,
  isometricConfig: IsometricConfig,
): CrossMark => {
  // Approximate inverse transformation
  const { scale, offsetX, offsetY, angle } = isometricConfig;
  const cos30 = Math.cos(angle);
  const sin30 = Math.sin(angle);

  const adjustedX = (screenX - offsetX) / scale;
  const adjustedY = (screenY - offsetY) / scale;

  // Corrected inverse isometric projection (assuming z = 0)
  const worldX = (adjustedX / cos30 + adjustedY / sin30) / 2;
  const worldY = (adjustedY / sin30 - adjustedX / cos30) / 2;

  const worldPos: Point3D = { x: worldX, y: worldY, z: 0 };
  const topDownPos: Point2D = { x: worldX, y: worldY };
  const isometricPos: Point2D = { x: screenX, y: screenY };

  return {
    id: `cross_${Date.now()}_${Math.random()}`,
    topDownPos,
    isometricPos,
    worldPos,
    startTime: Date.now(),
    duration: 500, // 0.5 seconds
  };
};

/**
 * Calculates the current opacity of a cross based on elapsed time
 */
export const getCrossOpacity = (cross: CrossMark, currentTime: number): number => {
  const elapsed = currentTime - cross.startTime;
  if (elapsed >= cross.duration) return 0;
  return 1 - elapsed / cross.duration; // Linear fade from 1 to 0
};

/**
 * Draws a cross at the specified position with optional rotation and scaling
 */
export const drawCross = (
  ctx: CanvasRenderingContext2D,
  position: Point2D,
  opacity: number,
  config: CrossDrawConfig = DEFAULT_CROSS_CONFIG,
): void => {
  if (opacity <= 0) return;

  const { size, lineWidth, color, rotation = 0, scaleY = 1 } = config;
  const halfSize = size / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  // Apply transformations
  ctx.translate(position.x, position.y);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  if (scaleY !== 1) {
    ctx.scale(1, scaleY);
  }

  // Draw horizontal line
  ctx.beginPath();
  ctx.moveTo(-halfSize, 0);
  ctx.lineTo(halfSize, 0);
  ctx.stroke();

  // Draw vertical line
  ctx.beginPath();
  ctx.moveTo(0, -halfSize);
  ctx.lineTo(0, halfSize);
  ctx.stroke();

  ctx.restore();
};

/**
 * Filters out expired crosses
 */
export const filterActiveCrosses = (crosses: CrossMark[], currentTime: number): CrossMark[] => {
  return crosses.filter((cross) => {
    const elapsed = currentTime - cross.startTime;
    return elapsed < cross.duration;
  });
};
