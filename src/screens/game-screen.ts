import * as dat from "dat.gui";
import { isVerticalLayout } from "..";
import { createButton } from "../core/button";
import { IDisplayObject } from "../core/display";
import { ButtonVariant, HeadingSize, drawButton, drawHeading } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";
import { GameField } from "./game/game-field";
import { HUD } from "./game/hud";
import { LevelSelectScreen } from "./level-select-screen";

export const GAME_FIELD_SIZE = 600;
export const HUD_SIZE = 200;

const guiInstances = new Set<dat.GUI>();

export class GameScreen extends BaseScreen {
  private children: IDisplayObject[] = [];

  private gameField: GameField;
  private hud: HUD;

  constructor(
    game: IGame,
    private levelIndex: number = 0,
  ) {
    super(game);

    this.gameField = new GameField(levelIndex);
    this.hud = new HUD(HUD_SIZE, GAME_FIELD_SIZE, levelIndex, () => {
      this.game.changeScreen(LevelSelectScreen);
    });

    this.children.push(this.gameField, this.hud);

    this.buttons.push(
      createButton({
        x: 10,
        y: 10,
        width: 48,
        height: 48,
        text: "⟵",
        clickHandler: () => {
          this.game.changeScreen(LevelSelectScreen);
        },
      }),
    );

    if (import.meta.env.DEV) {
      import("dat.gui").then((dat) => {
        const gui = new dat.GUI();
        guiInstances.add(gui);
        this.gameField.initDebugControls(gui.addFolder("GameFiled"));
      });
    }
  }

  override update(dt: number): void {
    super.update(dt);

    for (const child of this.children) {
      child.update(dt);
    }
  }

  override onMouseMove(x: number, y: number): void {
    super.onMouseMove(x, y);
    const { hud } = this;
    hud.handleMouseMove(x - hud.position.x, y - hud.position.y);
  }

  override onClick(x: number, y: number): void {
    const { hud } = this;
    if (hud.handleMouseClick(x - hud.position.x, y - hud.position.y)) return;
    super.onClick(x, y);
  }

  protected override doDraw(context: CanvasRenderingContext2D): void {
    for (const child of this.children) {
      context.save();
      context.translate(child.position.x, child.position.y);
      child.draw(context);
      context.restore();
    }

    if (isVerticalLayout()) {
      drawButton(context, this.buttons[0], ButtonVariant.SECONDARY);
      drawHeading(context, `Level ${this.levelIndex + 1}`, c.width / 2, 40, HeadingSize.XS);
    }
  }
}

export const cleanupGuiInstances = (): void => {
  const instancesToCleanup = Array.from(guiInstances);
  for (const instance of instancesToCleanup) {
    instance.destroy();
  }
  guiInstances.clear();
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupGuiInstances();
  });
  import.meta.hot.accept(() => {
    console.log("🔥 GameScreen module accept callback triggered");
  });
}
