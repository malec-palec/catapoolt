export interface IEventDispatcher {
  dispatchEvent(event: Event): void;
}

export class Event {
  private _accepted = false;
  get isAccepted(): boolean {
    return this._accepted;
  }
  accept(): void {
    this._accepted = true;
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
