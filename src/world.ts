import { Actor } from "./actor";
import { Camera } from "./camera";
import { Point2D, screenToWorld, worldToScreen } from "./geom";

export class World {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private gridSize: number = 40;
  private gridWidth: number = 30;
  private gridHeight: number = 30;

  private actor: Actor;

  private cameraOffsetX: number;
  private cameraOffsetY: number;
  private camera: Camera;

  private mousePosition: Point2D = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;

    this.cameraOffsetX = canvas.width / 2;
    this.cameraOffsetY = canvas.height / 2;

    const actorPosX = 1;
    const actorPosY = 1;
    this.actor = new Actor(actorPosX, actorPosY);

    this.camera = new Camera(actorPosX, actorPosY);

    this.canvas.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();

      // Get mouse position relative to canvas center
      const screenX = (event.clientX - rect.left - this.cameraOffsetX) / this.gridSize;
      const screenY = (event.clientY - rect.top - this.cameraOffsetY) / this.gridSize;

      // Convert isometric screen coordinates to 2D top-down world coordinates
      const worldPos = screenToWorld(screenX, screenY);

      // Account for camera offset to get actual world position
      const cameraPos = this.camera.getPosition();
      const actualWorldX = worldPos.x + cameraPos.x;
      const actualWorldY = worldPos.y + cameraPos.y;

      this.mousePosition = { x: actualWorldX, y: actualWorldY };
    });

    // Mouse click event for actor movement
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();

      // Get click position relative to canvas center
      const screenX = (event.clientX - rect.left - this.cameraOffsetX) / this.gridSize;
      const screenY = (event.clientY - rect.top - this.cameraOffsetY) / this.gridSize;

      // Convert isometric screen coordinates to 2D top-down world coordinates
      const worldPos = screenToWorld(screenX, screenY);

      // Account for camera offset to get actual world position
      const cameraPos = this.camera.getPosition();
      const actualWorldX = worldPos.x + cameraPos.x;
      const actualWorldY = worldPos.y + cameraPos.y;

      // Clamp to grid bounds in 2D top-down space
      const clampedX = Math.max(0, Math.min(this.gridWidth, actualWorldX));
      const clampedY = Math.max(0, Math.min(this.gridHeight, actualWorldY));

      // Set target in 2D top-down space
      this.actor.setTarget({ x: clampedX, y: clampedY });
    });
  }

  private drawGrid(): void {
    this.context.strokeStyle = "#999";
    this.context.lineWidth = 1;

    const cameraPos = this.camera.getPosition();

    // Calculate visible grid range based on camera position and screen size
    const visibleRange = 15; // How many grid cells to render around camera
    const minX = Math.max(0, Math.floor(cameraPos.x - visibleRange));
    const maxX = Math.min(this.gridWidth, Math.ceil(cameraPos.x + visibleRange));
    const minY = Math.max(0, Math.floor(cameraPos.y - visibleRange));
    const maxY = Math.min(this.gridHeight, Math.ceil(cameraPos.y + visibleRange));

    for (let y = minY; y <= maxY; y++) {
      const startWorld = worldToScreen(minX - cameraPos.x, y - cameraPos.y);
      const endWorld = worldToScreen(maxX - cameraPos.x, y - cameraPos.y);

      this.context.beginPath();
      this.context.moveTo(
        startWorld.x * this.gridSize + this.cameraOffsetX,
        startWorld.y * this.gridSize + this.cameraOffsetY,
      );
      this.context.lineTo(
        endWorld.x * this.gridSize + this.cameraOffsetX,
        endWorld.y * this.gridSize + this.cameraOffsetY,
      );
      this.context.stroke();
    }

    for (let x = minX; x <= maxX; x++) {
      const startWorld = worldToScreen(x - cameraPos.x, minY - cameraPos.y);
      const endWorld = worldToScreen(x - cameraPos.x, maxY - cameraPos.y);

      this.context.beginPath();
      this.context.moveTo(
        startWorld.x * this.gridSize + this.cameraOffsetX,
        startWorld.y * this.gridSize + this.cameraOffsetY,
      );
      this.context.lineTo(
        endWorld.x * this.gridSize + this.cameraOffsetX,
        endWorld.y * this.gridSize + this.cameraOffsetY,
      );
      this.context.stroke();
    }
  }

  update(): void {
    this.actor.lookAt(this.mousePosition);
    this.actor.update();

    this.camera.update(this.actor.getPosition());
  }

  draw(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    this.actor.draw(this.context, this.camera.getPosition(), this.gridSize, this.cameraOffsetX, this.cameraOffsetY);

    const actorPos = this.actor.getPosition();
    const cameraPos = this.camera.getPosition();

    // Debug debug text
    this.context.fillStyle = "#000";
    this.context.font = "12px monospace";
    this.context.fillText(`Actor: (${actorPos.x.toFixed(1)}, ${actorPos.y.toFixed(1)})`, 10, 20);
    this.context.fillText(`Camera: (${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)})`, 10, 35);
  }
}
