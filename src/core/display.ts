import { Event, IEventEmitter } from "../core/event";
import { Point2D } from "./geom";

export interface IDisplayObject extends IEventEmitter {
  pos: Point2D;
  tick(dt: number): void;
  render(context: CanvasRenderingContext2D): void;
}

export class DisplayObject implements IDisplayObject {
  pos: Point2D;

  constructor(
    public width: number,
    public height: number,
    x = 0,
    y = 0,
  ) {
    this.pos = { x, y };
  }

  tick(dt: number): void {}
  render(context: CanvasRenderingContext2D): void {}

  emitEvent(event: Event): void {
    if (!event.isAcknowledged) {
      this.handleEvent(event);
    }
  }

  protected handleEvent(event: Event): void {}

  setPos(x: number, y: number): void {
    this.pos.x = x;
    this.pos.y = y;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
