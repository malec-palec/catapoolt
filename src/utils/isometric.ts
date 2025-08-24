import { Point2D, Point3D } from "./geom";

export interface IsometricConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  angle: number; // Isometric angle in radians (typically 30 degrees)
}

export const DEFAULT_ISOMETRIC_CONFIG: IsometricConfig = {
  scale: 1,
  offsetX: 0, // Offset to center the view
  offsetY: 0,
  angle: Math.PI / 6, // 30 degrees
};

/**
 * Converts 3D world coordinates to 2D isometric screen coordinates
 */
export const worldToIsometric = (point: Point3D, config: IsometricConfig = DEFAULT_ISOMETRIC_CONFIG): Point2D => {
  const { scale, offsetX, offsetY, angle } = config;
  const cos30 = Math.cos(angle);
  const sin30 = Math.sin(angle);

  // Isometric projection with corrected coordinate system
  // In isometric view: X goes right-down, Y goes left-down
  const isoX = (point.x - point.y) * cos30 * scale;
  const isoY = (point.x + point.y) * sin30 * scale + point.z * scale;

  return {
    x: isoX + offsetX,
    y: isoY + offsetY,
  };
};

/**
 * Draws a circle in isometric perspective (flattened ellipse)
 */
export const drawIsometricCircle = (
  ctx: CanvasRenderingContext2D,
  center: Point3D,
  radius: number,
  config: IsometricConfig = DEFAULT_ISOMETRIC_CONFIG,
): void => {
  ctx.save();

  // Apply same offset as isometric grid
  const canvasWidth = ctx.canvas.width;
  const offsetX = canvasWidth / 2;
  const offsetY = 100;
  ctx.translate(offsetX, offsetY);

  // Convert to isometric coordinates directly
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const { scale, angle } = config;

  const isoPos = {
    x: (center.x - center.y) * cos30 * scale,
    y: (center.x + center.y) * sin30 * scale + center.z * scale,
  };

  // Isometric circles become ellipses
  const radiusX = radius * scale;
  const radiusY = radius * scale * Math.sin(angle); // Flatten vertically

  ctx.beginPath();
  ctx.ellipse(isoPos.x, isoPos.y, radiusX, radiusY, 0, 0, 2 * Math.PI);

  ctx.restore();
};

/**
 * Draws a line between two 3D points in isometric perspective
 */
export const drawIsometricLine = (
  ctx: CanvasRenderingContext2D,
  from: Point3D,
  to: Point3D,
  config: IsometricConfig = DEFAULT_ISOMETRIC_CONFIG,
): void => {
  ctx.save();

  // Apply same offset as isometric grid
  const canvasWidth = ctx.canvas.width;
  const offsetX = canvasWidth / 2;
  const offsetY = 100;
  ctx.translate(offsetX, offsetY);

  // Convert to isometric coordinates directly
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const { scale } = config;

  const fromIso = {
    x: (from.x - from.y) * cos30 * scale,
    y: (from.x + from.y) * sin30 * scale + from.z * scale,
  };
  const toIso = {
    x: (to.x - to.y) * cos30 * scale,
    y: (to.x + to.y) * sin30 * scale + to.z * scale,
  };

  ctx.beginPath();
  ctx.moveTo(fromIso.x, fromIso.y);
  ctx.lineTo(toIso.x, toIso.y);
  ctx.stroke();

  ctx.restore();
};

/**
 * Draws the borders of a 2D rectangular area in isometric perspective
 */
export const drawIsometricBorders = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: IsometricConfig = DEFAULT_ISOMETRIC_CONFIG,
  color: string = "#0066cc",
  lineWidth: number = 3,
  dashed: boolean = true,
): void => {
  // Define the four corners of the 2D view in world coordinates
  const corners: Point3D[] = [
    { x: 0, y: 0, z: 0 }, // Top-left
    { x: width, y: 0, z: 0 }, // Top-right
    { x: width, y: height, z: 0 }, // Bottom-right
    { x: 0, y: height, z: 0 }, // Bottom-left
  ];

  ctx.save();

  // Apply same offset as isometric grid
  const canvasWidth = ctx.canvas.width;
  const offsetX = canvasWidth / 2;
  const offsetY = 100;
  ctx.translate(offsetX, offsetY);

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dashed) {
    ctx.setLineDash([8, 4]); // Dashed line for border
  }

  // Draw the border rectangle using direct isometric projection
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  for (let i = 0; i < corners.length; i++) {
    const nextIndex = (i + 1) % corners.length;
    const from = corners[i];
    const to = corners[nextIndex];

    // Convert to isometric coordinates directly
    const fromIso = {
      x: (from.x - from.y) * cos30,
      y: (from.x + from.y) * sin30 + from.z,
    };
    const toIso = {
      x: (to.x - to.y) * cos30,
      y: (to.x + to.y) * sin30 + to.z,
    };

    ctx.beginPath();
    ctx.moveTo(fromIso.x, fromIso.y);
    ctx.lineTo(toIso.x, toIso.y);
    ctx.stroke();
  }

  ctx.restore();
};
