import { Actor } from "./actor";
import { Camera } from "./camera";
import { Point2D, screenToWorld, worldToScreen } from "./geom";

export class World {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private gridSize: number = 40;
  private gridWidth: number = 30;
  private gridHeight: number = 30;

  private actors: Actor[];
  private headActor: Actor;

  private cameraOffsetX: number;
  private cameraOffsetY: number;
  private camera: Camera;

  private mousePosition: Point2D = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;

    this.cameraOffsetX = canvas.width / 2;
    this.cameraOffsetY = canvas.height / 2;

    // Create chain of 5 actors
    this.actors = [];
    const startX = 5;
    const startY = 5;

    // Create head actor
    this.headActor = new Actor(startX, startY, 1, "head");
    this.actors.push(this.headActor);

    // Create 4 tail actors
    for (let i = 1; i < 5; i++) {
      const tailActor = new Actor(startX - i * 0.8, startY, 1, "tail");
      tailActor.setPreviousActor(this.actors[i - 1]);
      this.actors.push(tailActor);
    }

    this.camera = new Camera(startX, startY);

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

      // Set target for head actor only
      this.headActor.setTarget({ x: clampedX, y: clampedY });
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
    // Update all actors in chain order
    for (const actor of this.actors) {
      actor.update();
    }

    // Camera follows head
    this.camera.update(this.headActor.getPosition());
  }

  draw(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();
    this.drawChainConnections();

    // Draw all actors
    for (const actor of this.actors) {
      actor.draw(this.context, this.camera.getPosition(), this.gridSize, this.cameraOffsetX, this.cameraOffsetY);
    }

    // Draw side points for first and last actors
    if (this.actors.length > 0) {
      this.drawActorSidePoints(this.actors[0]); // First actor
      if (this.actors.length > 1) {
        this.drawActorSidePoints(this.actors[this.actors.length - 1]); // Last actor
        this.drawTailOppositePoint(this.actors[this.actors.length - 1]); // Draw opposite point line for last actor
      }
    }

    const headPos = this.headActor.getPosition();
    const cameraPos = this.camera.getPosition();

    // Debug text
    this.context.fillStyle = "#000";
    this.context.font = "12px monospace";
    this.context.fillText(`Head: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`, 10, 20);
    this.context.fillText(`Camera: (${cameraPos.x.toFixed(1)}, ${cameraPos.y.toFixed(1)})`, 10, 35);
    this.context.fillText(`Chain length: ${this.actors.length}`, 10, 50);
  }

  private drawActorSidePoints(actor: Actor): void {
    const pos = actor.getPosition();
    const cameraPos = this.camera.getPosition();

    // Get perpendicular directions to actor's direction
    const leftDirection = actor.getDirection() + Math.PI / 2;
    const rightDirection = actor.getDirection() - Math.PI / 2;

    // Calculate side points in world space
    const radius = 14; // Same as actor radius
    const leftWorldX = pos.x + (Math.cos(leftDirection) * radius) / this.gridSize;
    const leftWorldY = pos.y + (Math.sin(leftDirection) * radius) / this.gridSize;
    const rightWorldX = pos.x + (Math.cos(rightDirection) * radius) / this.gridSize;
    const rightWorldY = pos.y + (Math.sin(rightDirection) * radius) / this.gridSize;

    // Convert side points to screen coordinates
    const leftRelativeX = leftWorldX - cameraPos.x;
    const leftRelativeY = leftWorldY - cameraPos.y;
    const rightRelativeX = rightWorldX - cameraPos.x;
    const rightRelativeY = rightWorldY - cameraPos.y;

    const leftScreenPos = worldToScreen(leftRelativeX, leftRelativeY, pos.z);
    const rightScreenPos = worldToScreen(rightRelativeX, rightRelativeY, pos.z);

    const leftScreenX = leftScreenPos.x * this.gridSize + this.cameraOffsetX;
    const leftScreenY = leftScreenPos.y * this.gridSize + this.cameraOffsetY;
    const rightScreenX = rightScreenPos.x * this.gridSize + this.cameraOffsetX;
    const rightScreenY = rightScreenPos.y * this.gridSize + this.cameraOffsetY;

    // Draw side points
    // this.context.fillStyle = "#ff0000";
    // this.context.beginPath();
    // this.context.arc(leftScreenX, leftScreenY, 4, 0, Math.PI * 2);
    // this.context.fill();

    // this.context.fillStyle = "#0000ff";
    // this.context.beginPath();
    // this.context.arc(rightScreenX, rightScreenY, 4, 0, Math.PI * 2);
    // this.context.fill();

    // Draw perpendicular line connecting the points
    // this.context.strokeStyle = "#00ff00";
    // this.context.lineWidth = 1;
    // this.context.beginPath();
    // this.context.moveTo(leftScreenX, leftScreenY);
    // this.context.lineTo(rightScreenX, rightScreenY);
    // this.context.stroke();

    // Draw vertical lines down from side points by Z length
    const zLength = pos.z * this.gridSize; // Scale Z by grid size for visual consistency

    // Left side vertical line
    this.context.strokeStyle = "#333";
    this.context.lineWidth = 6;
    this.context.beginPath();
    this.context.moveTo(leftScreenX, leftScreenY);
    this.context.lineTo(leftScreenX, leftScreenY + zLength);
    this.context.stroke();

    // Right side vertical line
    this.context.strokeStyle = "#333";
    this.context.lineWidth = 6;
    this.context.beginPath();
    this.context.moveTo(rightScreenX, rightScreenY);
    this.context.lineTo(rightScreenX, rightScreenY + zLength);
    this.context.stroke();

    // Draw bottom points to show the end of the Z lines
    // this.context.fillStyle = "#aa0000";
    // this.context.beginPath();
    // this.context.arc(leftScreenX, leftScreenY + zLength, 3, 0, Math.PI * 2);
    // this.context.fill();

    // this.context.fillStyle = "#0000aa";
    // this.context.beginPath();
    // this.context.arc(rightScreenX, rightScreenY + zLength, 3, 0, Math.PI * 2);
    // this.context.fill();
  }

  private drawTailOppositePoint(actor: Actor): void {
    const pos = actor.getPosition();
    const cameraPos = this.camera.getPosition();

    // Get opposite direction (180 degrees from heading)
    const oppositeDirection = actor.getDirection() + Math.PI;

    // Calculate point opposite to heading direction in world space
    const radius = 13; // Same radius as used in side points
    const oppositeWorldX = pos.x + (Math.cos(oppositeDirection) * radius) / this.gridSize;
    const oppositeWorldY = pos.y + (Math.sin(oppositeDirection) * radius) / this.gridSize;

    // Convert opposite point to screen coordinates
    const oppositeRelativeX = oppositeWorldX - cameraPos.x;
    const oppositeRelativeY = oppositeWorldY - cameraPos.y;
    const oppositeScreenPos = worldToScreen(oppositeRelativeX, oppositeRelativeY, pos.z);

    const oppositeScreenX = oppositeScreenPos.x * this.gridSize + this.cameraOffsetX;
    const oppositeScreenY = oppositeScreenPos.y * this.gridSize + this.cameraOffsetY;

    // Draw vertical line upward with length of 2
    const upLength = 2 * this.gridSize;

    this.context.strokeStyle = "#333";
    this.context.lineWidth = 8;
    this.context.beginPath();
    this.context.moveTo(oppositeScreenX, oppositeScreenY);
    this.context.lineTo(oppositeScreenX, oppositeScreenY - upLength); // Negative Y for upward
    this.context.stroke();

    // Draw a small circle at the base of the line to mark the opposite point
    // this.context.fillStyle = "#ff6b6b";
    // this.context.beginPath();
    // this.context.arc(oppositeScreenX, oppositeScreenY, 3, 0, Math.PI * 2);
    // this.context.fill();
  }

  private drawChainConnections(): void {
    if (this.actors.length < 2) return;

    const cameraPos = this.camera.getPosition();

    this.context.strokeStyle = "#333";
    this.context.lineWidth = 40;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";

    // Convert all actor positions to screen coordinates
    const screenPoints: Point2D[] = [];
    for (const actor of this.actors) {
      const pos = actor.getPosition();
      const relative = {
        x: pos.x - cameraPos.x,
        y: pos.y - cameraPos.y,
      };
      const screen = worldToScreen(relative.x, relative.y, pos.z);
      screenPoints.push({
        x: screen.x * this.gridSize + this.cameraOffsetX,
        y: screen.y * this.gridSize + this.cameraOffsetY,
      });
    }

    // Draw smooth curve through all points
    this.context.beginPath();
    this.context.moveTo(screenPoints[0].x, screenPoints[0].y);

    if (screenPoints.length === 2) {
      // Simple line for just two points
      this.context.lineTo(screenPoints[1].x, screenPoints[1].y);
    } else {
      // Smooth curve for multiple points using quadratic curves
      for (let i = 1; i < screenPoints.length - 1; i++) {
        const current = screenPoints[i];
        const next = screenPoints[i + 1];

        // Control point is the current point, curve to midpoint between current and next
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        this.context.quadraticCurveTo(current.x, current.y, midX, midY);
      }

      // Final segment to the last point
      const lastPoint = screenPoints[screenPoints.length - 1];
      const secondToLast = screenPoints[screenPoints.length - 2];
      this.context.quadraticCurveTo(secondToLast.x, secondToLast.y, lastPoint.x, lastPoint.y);
    }

    this.context.stroke();
  }
}
