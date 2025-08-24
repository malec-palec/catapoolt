export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function worldToScreen(worldX: number, worldY: number, worldZ: number = 0): Point2D {
  const screenX = (worldX - worldY) * Math.cos(Math.PI / 6);
  const screenY = (worldX + worldY) * Math.sin(Math.PI / 6) - worldZ;
  return { x: screenX, y: screenY };
}

export function screenToWorld(screenX: number, screenY: number): Point2D {
  const worldX = (screenX / Math.cos(Math.PI / 6) + screenY / Math.sin(Math.PI / 6)) / 2;
  const worldY = (screenY / Math.sin(Math.PI / 6) - screenX / Math.cos(Math.PI / 6)) / 2;
  return { x: worldX, y: worldY };
}
