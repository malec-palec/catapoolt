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

export const enum PointerEventType {
  PointerDown,
  PointerUp,
  PointerMove,
  PointerLeave,
}

export class GamePointerEvent extends Event {
  constructor(
    public pointerX: number,
    public pointerY: number,
    public type: PointerEventType,
  ) {
    super();
  }
}
