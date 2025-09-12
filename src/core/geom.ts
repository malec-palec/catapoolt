export interface Point2D {
  x: number;
  y: number;
}

export type Rectangle = { x: number; y: number; width: number; height: number };

export const isCoordsInRect = (x: number, y: number, rect: Rectangle): boolean =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
