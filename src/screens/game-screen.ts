import { IDisplayObject } from "../core/display";
import { IGame } from "../game";
import { BaseScreen, ScreenName } from "../screen";
import { drawButton } from "../utils/button";
import { GameField } from "./game/game-field";
import { HUD } from "./game/hud";

export const GAME_FIELD_SIZE = 600;
export const HUD_SIZE = 200;
export class GameScreen extends BaseScreen {
  private children: IDisplayObject[] = [];

  private gameField: GameField;
  private hud: HUD;

  constructor(game: IGame, levelIndex: number = 0) {
    super(game);
    this.bgColor = "#d3d3d3";

    this.gameField = new GameField(levelIndex);
    this.hud = new HUD(HUD_SIZE, GAME_FIELD_SIZE);

    this.children.push(this.gameField, this.hud);

    this.buttons.push({
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      text: "⟵",
      action: () => {
        this.game.changeScreen(ScreenName.LevelSelect);
      },
    });
  }

  override update(dt: number): void {
    super.update(dt);

    for (const child of this.children) {
      child.update(dt);
    }
  }

  override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    for (const child of this.children) {
      context.save();
      context.translate(child.position.x, child.position.y);
      child.draw(context);
      context.restore();
    }

    drawButton(context, this.buttons[0]);
  }
}
