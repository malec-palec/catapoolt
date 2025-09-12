import { Event, IEventDispatcher } from "../core/event";
import { Point2D } from "./geom";

export interface IDisplayObject extends IEventDispatcher {
  position: Point2D;
  update(dt: number): void;
  draw(context: CanvasRenderingContext2D): void;
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

  dispatchEvent(event: Event): void {
    if (!event.isAccepted) {
      this.handleEvent(event);
    }
  }

  protected handleEvent(event: Event): void {}

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
