// Point class for rope segments using Verlet integration
class Point {
  public x: number;
  public y: number;
  private oldX: number;
  private oldY: number;
  private pinned: boolean;
  private dragging: boolean;

  constructor(x: number, y: number, pinned: boolean = false) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned;
    this.dragging = false;
  }

  // Verlet integration update
  public update(): void {
    // Skip physics if pinned or being dragged
    if (this.pinned || this.dragging) return;

    const velocityX = this.x - this.oldX;
    const velocityY = this.y - this.oldY;

    // Store current position
    this.oldX = this.x;
    this.oldY = this.y;

    const damping = 0.95;

    // Apply gravity and velocity (upward gravity - negative Y direction)
    this.x += velocityX * damping; // damping
    this.y += velocityY * damping - 0.5; // upward gravity (toward top)

    // Boundary constraints (keep points inside canvas)
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (this.x < 0) {
      this.x = 0;
      this.oldX = this.x + velocityX * 0.8;
    }
    if (this.x > canvas.width) {
      this.x = canvas.width;
      this.oldX = this.x + velocityX * 0.8;
    }
    if (this.y < 0) {
      this.y = 0;
      this.oldY = this.y + velocityY * 0.8;
    }
    if (this.y > canvas.height) {
      this.y = canvas.height;
      this.oldY = this.y + velocityY * 0.8;
    }
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    // Only reset velocity if not dragging (to preserve momentum when released)
    if (!this.dragging) {
      this.oldX = x;
      this.oldY = y;
    }
  }

  public startDragging(): void {
    this.dragging = true;
    this.pinned = false; // Unpin when dragging starts
  }

  public stopDragging(restorePin: boolean = false): void {
    this.dragging = false;
    if (restorePin) {
      this.pinned = true;
    }
    // Update old position to current position to prevent velocity jump
    this.oldX = this.x;
    this.oldY = this.y;
  }

  public setDragPosition(x: number, y: number): void {
    // Always respond to drag positioning for immediate cursor following
    this.x = x;
    this.y = y;
  }

  public pin(): void {
    this.pinned = true;
  }

  public unpin(): void {
    this.pinned = false;
  }

  public isPinned(): boolean {
    return this.pinned;
  }

  public isDragging(): boolean {
    return this.dragging;
  }
}

// Constraint class to maintain distance between rope segments
class Constraint {
  private pointA: Point;
  private pointB: Point;
  private restLength: number;

  constructor(pointA: Point, pointB: Point, restLength?: number) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.restLength = restLength ?? this.getDistance();
  }

  private getDistance(): number {
    const dx = this.pointB.x - this.pointA.x;
    const dy = this.pointB.y - this.pointA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public satisfy(): void {
    const dx = this.pointB.x - this.pointA.x;
    const dy = this.pointB.y - this.pointA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const difference = this.restLength - distance;
    const percent = difference / distance / 2;
    const offsetX = dx * percent;
    const offsetY = dy * percent;

    // Don't move points that are pinned or being dragged
    if (!this.pointA.isPinned() && !this.pointA.isDragging()) {
      this.pointA.x -= offsetX;
      this.pointA.y -= offsetY;
    }
    if (!this.pointB.isPinned() && !this.pointB.isDragging()) {
      this.pointB.x += offsetX;
      this.pointB.y += offsetY;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.pointA.x, this.pointA.y);
    ctx.lineTo(this.pointB.x, this.pointB.y);
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Rope class to manage the simulation
class Rope {
  private points: Point[] = [];
  private constraints: Constraint[] = [];
  private mouseControlledPoint: Point | null = null;
  private anchorPoint: Point | null = null;

  constructor(startX: number, startY: number, segments: number, segmentLength: number) {
    this.createRope(startX, startY, segments, segmentLength);
  }

  private createRope(startX: number, startY: number, segments: number, segmentLength: number): void {
    // Create points from bottom to top (reversed orientation)
    for (let i = 0; i <= segments; i++) {
      const point = new Point(startX, startY - i * segmentLength, i === 0);
      this.points.push(point);
    }

    // Create constraints between adjacent points
    for (let i = 0; i < this.points.length - 1; i++) {
      const constraint = new Constraint(this.points[i], this.points[i + 1], segmentLength);
      this.constraints.push(constraint);
    }

    // Set reference points (now reversed)
    this.anchorPoint = this.points[0]; // Red anchor point (bottom)
    this.mouseControlledPoint = this.points[this.points.length - 1]; // Blue end point (top)
  }

  public findClosestDraggablePoint(mouseX: number, mouseY: number): Point | null {
    const dragRadius = 30; // Maximum distance to start dragging
    let closestPoint: Point | null = null;
    let closestDistance = dragRadius;

    // Check anchor point (red dot)
    const anchorDistance = Math.sqrt(
      Math.pow(this.anchorPoint!.x - mouseX, 2) + Math.pow(this.anchorPoint!.y - mouseY, 2),
    );
    if (anchorDistance < closestDistance) {
      closestDistance = anchorDistance;
      closestPoint = this.anchorPoint;
    }

    // Check end point (blue dot)
    const endDistance = Math.sqrt(
      Math.pow(this.mouseControlledPoint!.x - mouseX, 2) + Math.pow(this.mouseControlledPoint!.y - mouseY, 2),
    );
    if (endDistance < closestDistance) {
      closestDistance = endDistance;
      closestPoint = this.mouseControlledPoint;
    }

    return closestPoint;
  }

  public update(): void {
    // Update all points
    this.points.forEach((point) => point.update());

    // Satisfy constraints multiple times for stability and reduced stretchiness
    for (let i = 0; i < 6; i++) {
      this.constraints.forEach((constraint) => constraint.satisfy());
    }
  }

  public render(ctx: CanvasRenderingContext2D, draggedPoint: Point | null = null): void {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Render constraints (rope segments)
    this.constraints.forEach((constraint) => constraint.render(ctx));

    // Render points
    this.points.forEach((point, index) => {
      const isBeingDragged = point === draggedPoint;
      const radius = index === 0 ? 8 : 4;
      const glowRadius = isBeingDragged ? radius + 4 : radius;

      // Add glow effect for dragged point
      if (isBeingDragged) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

      if (index === 0) {
        ctx.fillStyle = isBeingDragged ? "#FF8A65" : "#FF5722"; // Bottom anchor point - lighter when dragged
      } else if (point === this.mouseControlledPoint) {
        ctx.fillStyle = isBeingDragged ? "#64B5F6" : "#2196F3"; // Top end point - lighter when dragged
      } else {
        ctx.fillStyle = "#FFC107"; // Regular points
      }

      ctx.fill();
    });
  }

  public startDraggingPoint(point: Point): void {
    if (point) {
      point.startDragging();
    }
  }

  public setDragPosition(point: Point, x: number, y: number): void {
    if (point) {
      // Force immediate positioning regardless of dragging state
      point.setDragPosition(x, y);
    }
  }

  public stopDraggingPoint(point: Point): void {
    if (point) {
      // Restore pin for anchor point, keep end point unpinned
      const shouldRestorePin = point === this.anchorPoint;
      point.stopDragging(shouldRestorePin);
    }
  }
}

// Main application
class RopeSimulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rope: Rope;
  private isDragging: boolean = false;
  private draggedPoint: Point | null = null;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    // Create rope starting from bottom center (red anchor at bottom)
    this.rope = new Rope(this.canvas.width / 2, this.canvas.height - 50, 15, 25);

    this.setupEventListeners();
    this.startAnimation();
  }

  private getMousePosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener("mousedown", (e) => {
      const mousePos = this.getMousePosition(e);
      const closestPoint = this.rope.findClosestDraggablePoint(mousePos.x, mousePos.y);

      if (closestPoint) {
        this.isDragging = true;
        this.draggedPoint = closestPoint;
        this.canvas.style.cursor = "grabbing";

        // Start dragging and immediately snap point to cursor position
        this.rope.startDraggingPoint(closestPoint);
        this.rope.setDragPosition(closestPoint, mousePos.x, mousePos.y);
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      const mousePos = this.getMousePosition(e);

      if (this.isDragging && this.draggedPoint) {
        this.rope.setDragPosition(this.draggedPoint, mousePos.x, mousePos.y);
      } else {
        // Update cursor based on proximity to draggable points
        const closestPoint = this.rope.findClosestDraggablePoint(mousePos.x, mousePos.y);
        this.canvas.style.cursor = closestPoint ? "grab" : "crosshair";
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      if (this.isDragging && this.draggedPoint) {
        this.rope.stopDraggingPoint(this.draggedPoint);
        this.isDragging = false;
        this.draggedPoint = null;
        this.canvas.style.cursor = "crosshair";
      }
    });

    this.canvas.addEventListener("mouseleave", () => {
      if (this.isDragging && this.draggedPoint) {
        this.rope.stopDraggingPoint(this.draggedPoint);
        this.isDragging = false;
        this.draggedPoint = null;
      }
      this.canvas.style.cursor = "crosshair";
    });
  }

  private animate = (): void => {
    this.rope.update();
    this.rope.render(this.ctx, this.draggedPoint);
    requestAnimationFrame(this.animate);
  };

  private startAnimation(): void {
    this.animate();
  }
}

// Initialize the simulation when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new RopeSimulation();
});
