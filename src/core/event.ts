export interface IEventEmitter {
  emitEvent(event: Event): void;
}

export class Event {
  private _isAcknowledged = false;
  get isAcknowledged(): boolean {
    return this._isAcknowledged;
  }
  acknowledge(): void {
    this._isAcknowledged = true;
  }
}

export const enum MouseEventType {
  CLICK,
  MOUSE_DOWN,
  MOUSE_UP,
  MOUSE_MOVE,
}

export class MouseEvent extends Event {
  constructor(
    public mouseX: number,
    public mouseY: number,
    public type: MouseEventType,
  ) {
    super();
  }
}
