import { ITickable } from "../../core/display";
import { Point2D } from "../../core/geom";
import { Vector2D } from "../../core/vector2d";
import { max, min } from "../../system";
import { GameField } from "./game-field";

export class Camera implements ITickable {
  constructor(
    private target: Point2D,
    private gameField: GameField,
    public readonly position: Point2D = { x: 0, y: 0 },
    private tempWorldPos: Vector2D = new Vector2D(0, 0),
  ) {}

  tick(dt: number): void {
    const { position, target, gameField } = this;
    position.x = target.x - c.width / 2;
    position.y = target.y - c.height / 2;

    position.x = max(-gameField.bufferZone, min(gameField.width + gameField.bufferZone - c.width, position.x));
    position.y = max(-gameField.bufferZone, min(gameField.height + gameField.bufferZone - c.height, position.y));
  }

  screenToWorld(x: number, y: number): Vector2D {
    return this.tempWorldPos.set(x + this.position.x, y + this.position.y);
  }
}
