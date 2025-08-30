import { Point2D } from "../utils/geom";

export interface IDisplayObject {
  position: Point2D;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export class DisplayObject implements IDisplayObject {
  position: Point2D;
  constructor(
    public width: number,
    public height: number,
    x = 0,
    y = 0,
  ) {
    this.position = { x, y };
  }
  update(dt: number): void {}
  draw(context: CanvasRenderingContext2D): void {}
}
