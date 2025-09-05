import * as dat from "dat.gui";
import { isVerticalLayout } from "../..";
import { DisplayObject } from "../../core/display";
import { GAME_FIELD_SIZE, HUD_SIZE } from "../game-screen";
import { getLevelData } from "./level-utils";

export class GameField extends DisplayObject {
  private levelData: number[];
  private mapSize: number;

  private tileWidth = 32;
  private tileHeight = 16;
  private tileDepth = 8;

  private sideGap = 0;

  private debugControls = {
    showGrid: false,
  };

  constructor(levelIndex: number) {
    super(GAME_FIELD_SIZE, GAME_FIELD_SIZE);

    this.levelData = getLevelData(levelIndex);
    this.mapSize = Math.sqrt(this.levelData.length);
  }

  initDebugControls(gui: dat.GUI): void {
    if (import.meta.env.DEV) {
      gui.add(this.debugControls, "showGrid").name("Show Debug Grid");
      gui.open();
    }
  }

  override update(dt: number): void {
    this.position.x = isVerticalLayout() ? 0 : HUD_SIZE;
  }

  override draw(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#ADD8E6";
    context.fillRect(0, 0, GAME_FIELD_SIZE, GAME_FIELD_SIZE);

    const availableSize = GAME_FIELD_SIZE - this.sideGap * 2;
    const baseTotalMapWidth = this.mapSize * this.tileWidth;
    const baseTotalMapHeight = this.mapSize * this.tileHeight;
    const scale = Math.min(availableSize / baseTotalMapWidth, availableSize / baseTotalMapHeight);
    const scaledTileWidth = this.tileWidth * scale;
    const scaledTileHeight = this.tileHeight * scale;
    const startX = this.sideGap + availableSize / 2;
    const startY = startX - (this.mapSize * scaledTileHeight) / 4;

    this.drawTiles(context, startX, startY, scaledTileWidth, scaledTileHeight);

    if (import.meta.env.DEV) {
      if (this.debugControls.showGrid) {
        this.drawIsoGrid(context, startX, startY, scaledTileWidth, scaledTileHeight);
      }
    }
  }

  private drawIsoGrid(
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    tileWidth: number,
    tileHeight: number,
  ): void {
    if (import.meta.env.PROD) return;
    context.strokeStyle = "#888888";
    context.lineWidth = 1;
    context.setLineDash([2, 2]);

    for (let row = 0; row <= this.mapSize; row++) {
      for (let col = 0; col <= this.mapSize; col++) {
        const x = startX + (col - row) * (tileWidth / 2);
        const y = startY + (col + row) * (tileHeight / 2);

        if (col < this.mapSize) {
          const nextX = x + tileWidth / 2;
          const nextY = y + tileHeight / 2;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(nextX, nextY);
          context.stroke();
        }

        if (row < this.mapSize) {
          const nextX = x - tileWidth / 2;
          const nextY = y + tileHeight / 2;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(nextX, nextY);
          context.stroke();
        }
      }
    }

    context.setLineDash([]);
  }

  private drawTiles(
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    tileWidth: number,
    tileHeight: number,
  ): void {
    for (let row = 0; row < this.mapSize; row++) {
      for (let col = 0; col < this.mapSize; col++) {
        const tileIndex = row * this.mapSize + col;
        const tileValue = this.levelData[tileIndex];

        if (tileValue === 1) {
          const isoX = startX + (col - row) * (tileWidth / 2);
          const isoY = startY + (col + row) * (tileHeight / 2);

          const scaledDepth = this.tileDepth * (tileWidth / this.tileWidth);
          this.drawIsometricTile(context, isoX, isoY, tileWidth, tileHeight, scaledDepth);
        }
        // tileValue === 0 means empty space, so we don't draw anything
      }
    }
  }

  private drawIsometricTile(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileWidth: number,
    tileHeight: number,
    tileDepth: number,
  ): void {
    context.lineWidth = 1;

    // Calculate 3D points
    const topPoints = {
      top: { x, y },
      right: { x: x + tileWidth / 2, y: y + tileHeight / 2 },
      bottom: { x, y: y + tileHeight },
      left: { x: x - tileWidth / 2, y: y + tileHeight / 2 },
    };

    // Bottom face points (extruded down)
    const bottomPoints = {
      top: { x: topPoints.top.x, y: topPoints.top.y + tileDepth },
      right: { x: topPoints.right.x, y: topPoints.right.y + tileDepth },
      bottom: { x: topPoints.bottom.x, y: topPoints.bottom.y + tileDepth },
      left: { x: topPoints.left.x, y: topPoints.left.y + tileDepth },
    };

    // Draw right face (darker)
    context.fillStyle = "#D2B48C"; // Darker beige for right face
    context.strokeStyle = "#B8860B"; // Even darker outline
    context.beginPath();
    context.moveTo(topPoints.right.x, topPoints.right.y);
    context.lineTo(topPoints.bottom.x, topPoints.bottom.y);
    context.lineTo(bottomPoints.bottom.x, bottomPoints.bottom.y);
    context.lineTo(bottomPoints.right.x, bottomPoints.right.y);
    context.closePath();
    context.fill();
    context.stroke();

    // Draw front face (medium shade)
    context.fillStyle = "#E6D3A3"; // Medium beige for front face
    context.strokeStyle = "#B8860B";
    context.beginPath();
    context.moveTo(topPoints.bottom.x, topPoints.bottom.y);
    context.lineTo(topPoints.left.x, topPoints.left.y);
    context.lineTo(bottomPoints.left.x, bottomPoints.left.y);
    context.lineTo(bottomPoints.bottom.x, bottomPoints.bottom.y);
    context.closePath();
    context.fill();
    context.stroke();

    // Draw top face (lightest)
    context.fillStyle = "#F5F5DC"; // Light beige for top face
    context.strokeStyle = "#D2B48C";
    context.beginPath();
    context.moveTo(topPoints.top.x, topPoints.top.y);
    context.lineTo(topPoints.right.x, topPoints.right.y);
    context.lineTo(topPoints.bottom.x, topPoints.bottom.y);
    context.lineTo(topPoints.left.x, topPoints.left.y);
    context.closePath();
    context.fill();
    context.stroke();
  }
}
