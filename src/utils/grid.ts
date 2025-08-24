import { Point2D } from "./geom";

export interface GridConfig {
  cellSize: number;
  majorGridInterval: number;
  fineLineWidth: number;
  boldLineWidth: number;
  fineLineColor: string;
  boldLineColor: string;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellSize: 40,
  majorGridInterval: 5, // Every 5th line is bold (40 * 5 = 200px)
  fineLineWidth: 1,
  boldLineWidth: 2,
  fineLineColor: "#ddd",
  boldLineColor: "#999",
};

export interface WorldBounds {
  width: number;
  height: number;
  lineWidth: number;
  color: string;
}

export const DEFAULT_WORLD_BOUNDS: WorldBounds = {
  width: 1200,
  height: 1200,
  lineWidth: 3,
  color: "#0000FF",
};

export const draw2DGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: GridConfig = DEFAULT_GRID_CONFIG,
  offset: Point2D = { x: 0, y: 0 },
): void => {
  const { cellSize, majorGridInterval, fineLineWidth, boldLineWidth, fineLineColor, boldLineColor } = config;

  ctx.save();
  ctx.translate(offset.x, offset.y);

  // Draw vertical lines
  for (let x = 0; x <= width; x += cellSize) {
    const gridIndex = x / cellSize;
    const isMajorLine = gridIndex % majorGridInterval === 0;

    ctx.strokeStyle = isMajorLine ? boldLineColor : fineLineColor;
    ctx.lineWidth = isMajorLine ? boldLineWidth : fineLineWidth;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += cellSize) {
    const gridIndex = y / cellSize;
    const isMajorLine = gridIndex % majorGridInterval === 0;

    ctx.strokeStyle = isMajorLine ? boldLineColor : fineLineColor;
    ctx.lineWidth = isMajorLine ? boldLineWidth : fineLineWidth;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

export const draw2DWorldBounds = (
  ctx: CanvasRenderingContext2D,
  bounds: WorldBounds = DEFAULT_WORLD_BOUNDS,
  offset: Point2D = { x: 0, y: 0 },
): void => {
  const { width, height, lineWidth, color } = bounds;

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Draw world boundary rectangle
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.stroke();

  ctx.restore();
};

export const drawIsometricGrid = (
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  worldHeight: number,
  config: GridConfig = DEFAULT_GRID_CONFIG,
): void => {
  const { cellSize, majorGridInterval, fineLineWidth, boldLineWidth, fineLineColor, boldLineColor } = config;

  // Import isometric utilities
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // Calculate grid lines based on world coordinates
  const gridLinesX = Math.ceil(worldWidth / cellSize) + 1;
  const gridLinesY = Math.ceil(worldHeight / cellSize) + 1;

  ctx.save();

  // Get canvas center for offset
  const canvasWidth = ctx.canvas.width;
  const offsetX = canvasWidth / 2;
  const offsetY = 100;

  ctx.translate(offsetX, offsetY);

  // Draw vertical grid lines (X direction in world space)
  for (let i = 0; i < gridLinesX; i++) {
    const worldX = i * cellSize;
    const isMajorLine = i % majorGridInterval === 0;

    ctx.strokeStyle = isMajorLine ? boldLineColor : fineLineColor;
    ctx.lineWidth = isMajorLine ? boldLineWidth : fineLineWidth;

    // Start and end points in world coordinates
    const startWorld = { x: worldX, y: 0 };
    const endWorld = { x: worldX, y: worldHeight };

    // Convert to isometric screen coordinates
    const startIso = {
      x: (startWorld.x - startWorld.y) * cos30,
      y: (startWorld.x + startWorld.y) * sin30,
    };
    const endIso = {
      x: (endWorld.x - endWorld.y) * cos30,
      y: (endWorld.x + endWorld.y) * sin30,
    };

    ctx.beginPath();
    ctx.moveTo(startIso.x, startIso.y);
    ctx.lineTo(endIso.x, endIso.y);
    ctx.stroke();
  }

  // Draw horizontal grid lines (Y direction in world space)
  for (let i = 0; i < gridLinesY; i++) {
    const worldY = i * cellSize;
    const isMajorLine = i % majorGridInterval === 0;

    ctx.strokeStyle = isMajorLine ? boldLineColor : fineLineColor;
    ctx.lineWidth = isMajorLine ? boldLineWidth : fineLineWidth;

    // Start and end points in world coordinates
    const startWorld = { x: 0, y: worldY };
    const endWorld = { x: worldWidth, y: worldY };

    // Convert to isometric screen coordinates
    const startIso = {
      x: (startWorld.x - startWorld.y) * cos30,
      y: (startWorld.x + startWorld.y) * sin30,
    };
    const endIso = {
      x: (endWorld.x - endWorld.y) * cos30,
      y: (endWorld.x + endWorld.y) * sin30,
    };

    ctx.beginPath();
    ctx.moveTo(startIso.x, startIso.y);
    ctx.lineTo(endIso.x, endIso.y);
    ctx.stroke();
  }

  ctx.restore();
};
