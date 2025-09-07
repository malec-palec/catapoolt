import * as dat from "dat.gui";
import { NB_COLOR_WHITE } from "../core/neobrutalism";
import { IGame } from "../game";
import { BaseScreen } from "../screen";
import { CatFace, MovementDirection } from "./game/cat/cat-face";
import { SoftBlob, Vector2D } from "./game/cat/soft-blob";
import { Tail } from "./game/cat/tail";

const guiInstances = new Set<dat.GUI>();

export class CatTestScreen extends BaseScreen {
  private catBody: SoftBlob;
  private catFace: CatFace;
  private catTail: Tail;

  private mousePos: Vector2D = { x: 0, y: 0 };
  private isMouseDown = false;

  outlineSize = 12;
  targetVerticalOffset = 45;
  drawGroundLevel = true;

  private currentGroundLevel = 0; // Current ground level for visualization

  constructor(game: IGame) {
    super(game);
    this.bgColor = NB_COLOR_WHITE;

    const sx = c.width / 2;
    const sy = c.height / 2;

    this.catFace = new CatFace(sx, sy - 1, 30, this.outlineSize);
    this.catBody = new SoftBlob(sx, sy, 20, 36, 1.5, this.outlineSize);

    const anchor = this.catBody.getRightmostPoint();
    this.catTail = new Tail(anchor.point, 8, 15, this.outlineSize);

    // Add event listeners
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousedown", this.handleMouseDown);

    const gui = new dat.GUI();

    // Global settings folder
    const globalFolder = gui.addFolder("Global Settings");
    globalFolder
      .add(this, "outlineSize", 1, 20)
      .name("Outline Size")
      .onChange(() => {
        this.updateOutlineSize();
      });
    globalFolder.add(this, "targetVerticalOffset", 0, 200).name("Target Vertical Offset");
    globalFolder.add(this, "drawGroundLevel").name("Draw Ground Level");
    globalFolder.open();

    // Head appearance folder
    const headFolder = gui.addFolder("Head Appearance");
    headFolder.add(this.catFace, "radius", 10, 50).name("Head Size");
    headFolder.add(this.catFace, "debugDraw").name("Draw Collider");
    headFolder.open();

    // Ears folder
    const earsFolder = gui.addFolder("Ears");
    earsFolder.add(this.catFace, "earAngle", 10, 120).name("Ear Angle");
    earsFolder.add(this.catFace, "earWidth", 5, 40).name("Ear Width");
    earsFolder.add(this.catFace, "earHeight", 10, 50).name("Ear Height");
    earsFolder.add(this.catFace, "earOffsetY", -20, 20).name("Ear Y Offset");
    earsFolder.open();

    // Eyes folder
    const eyesFolder = gui.addFolder("Eyes");
    eyesFolder.add(this.catFace, "eyeRadius", 0.05, 0.4).name("Eye Size");
    eyesFolder.add(this.catFace, "eyeOffsetX", 0.1, 0.5).name("Eye Distance");
    eyesFolder.add(this.catFace, "eyeOffsetY", 0, 0.5).name("Eye Y Offset");
    eyesFolder.add(this.catFace, "pupilWidth", 0.1, 0.8).name("Pupil Width");
    eyesFolder.add(this.catFace, "pupilHeight", 0.5, 2.0).name("Pupil Height");
    eyesFolder.open();

    // Tail folder
    const tailFolder = gui.addFolder("Tail");
    tailFolder.add(this.catTail, "segmentLength", 5, 30).name("Segment Length");
    tailFolder.open();
  }

  override onClick(x: number, y: number): void {
    super.onClick(x, y);
    this.mousePos.x = x;
    this.mousePos.y = y;

    // If click is outside the cat controller, move to that position at constant speed
    if (!this.catFace.containsPoint(x, y)) {
      this.catFace.moveTo(x, y);
    }
  }

  override onMouseMove(x: number, y: number): void {
    super.onMouseMove(x, y);
    this.mousePos.x = x;
    this.mousePos.y = y;

    // Handle dragging: start if mouse is down and not already dragging, or continue if already dragging
    if (this.isMouseDown) {
      if (!this.catFace.isDragging && this.catFace.containsPoint(x, y)) {
        this.catFace.startDrag(x, y);
      }
      this.catFace.updateDrag(x, y);
    }
  }

  private updateOutlineSize(): void {
    this.catFace.outlineSize = this.outlineSize;
    this.catBody.outlineSize = this.outlineSize;
    this.catTail.tailWidth = this.outlineSize;
  }

  override update(dt: number): void {
    super.update(dt);

    this.catFace.updateMovement();

    // Calculate ground level based on cat position and target offset
    const catY = this.catFace.position.y;
    const calculatedGroundLevel = catY + this.targetVerticalOffset;
    // Don't let ground level go below canvas height
    this.currentGroundLevel = Math.min(calculatedGroundLevel, c.height);

    this.catBody.update(this.catFace, c.width, this.currentGroundLevel);

    const movementDirection = this.catFace.getMovementDirection();
    if (
      this.catFace.hasDirectionChanged() &&
      (movementDirection === MovementDirection.Left || movementDirection === MovementDirection.Right)
    ) {
      const { point } =
        movementDirection === MovementDirection.Left
          ? this.catBody.getRightmostPoint()
          : this.catBody.getLeftmostPoint();
      this.catTail.setAnchor(point);
    }

    this.catTail.stickTo(this.catBody);

    this.catTail.update();
  }

  override doDraw(context: CanvasRenderingContext2D): void {
    this.catBody.draw(context);
    this.catTail.draw(context);
    this.catFace.draw(context);

    if (this.drawGroundLevel) {
      // Draw ground level visualization line
      context.strokeStyle = "#FF6B6B";
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(0, this.currentGroundLevel);
      context.lineTo(c.width, this.currentGroundLevel);
      context.stroke();
      context.setLineDash([]); // Reset line dash
    }

    context.fillStyle = "#666666";
    context.font = "14px Arial";
    context.fillText("Click to move cat", 10, 25);
  }

  override destroy(): void {
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousedown", this.handleMouseDown);
  }

  private handleMouseUp = (): void => {
    this.isMouseDown = false;
    this.catFace.stopDrag();
  };

  private handleMouseDown = (): void => {
    this.isMouseDown = true;
  };
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
