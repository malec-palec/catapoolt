import { ICircleCollider, Vector2D } from "./soft-blob";

export const enum MovementDirection {
  None,
  Left,
  Right,
}

export class CatFace implements ICircleCollider {
  public position: Vector2D;
  public radius: number;
  public isDragging = false;
  private dragOffset: Vector2D = { x: 0, y: 0 };

  // Movement properties
  private targetPosition: Vector2D | null = null;
  private movementSpeed = 3; // Constant speed in pixels per frame
  private isMoving = false;
  private previousPosition: Vector2D;
  private movementDirection: MovementDirection = MovementDirection.None;
  private previousMovementDirection: MovementDirection = MovementDirection.None;

  debugDraw = false;

  // Cat face properties (public for dat.GUI)
  public earAngle = 45; // Angle between ears in degrees
  public earWidth = 15; // Width of ear foundation
  public earHeight = 20; // Height of ears
  public earOffsetY = 0; // Additional Y offset for ears relative to head

  // Eye properties (public for dat.GUI)
  public eyeRadius = 0.17; // Eye size relative to body radius
  public eyeOffsetX = 0.3; // Horizontal eye distance from center (relative to radius)
  public eyeOffsetY = 0.2; // Vertical eye offset (relative to radius)
  public pupilWidth = 0.3; // Pupil width relative to eye radius
  public pupilHeight = 1.2; // Pupil height relative to eye radius

  constructor(
    x: number,
    y: number,
    radius: number,
    public outlineSize: number,
  ) {
    this.position = { x, y };
    this.previousPosition = { x, y };
    this.radius = radius;
  }

  // Check if a point is inside the controller
  containsPoint(x: number, y: number): boolean {
    const dx = x - this.position.x;
    const dy = y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  // Start dragging from a specific point
  startDrag(mouseX: number, mouseY: number): void {
    if (this.containsPoint(mouseX, mouseY)) {
      this.isDragging = true;
      this.dragOffset.x = mouseX - this.position.x;
      this.dragOffset.y = mouseY - this.position.y;
      this.stopMovement(); // Stop movement and oscillation when dragging starts
    }
  }

  // Update position while dragging
  updateDrag(mouseX: number, mouseY: number): void {
    if (this.isDragging) {
      this.position.x = mouseX - this.dragOffset.x;
      this.position.y = mouseY - this.dragOffset.y;
    }
  }

  // Stop dragging
  stopDrag(): void {
    this.isDragging = false;
  }

  // Start moving to a target position at constant speed
  moveTo(targetX: number, targetY: number): void {
    this.targetPosition = { x: targetX, y: targetY };
    this.isMoving = true;
    this.isDragging = false; // Stop any current dragging
  }

  // Update constant speed movement (call this every frame)
  updateMovement(): void {
    // Store previous position for direction tracking
    this.previousPosition.x = this.position.x;
    this.previousPosition.y = this.position.y;

    // Store previous movement direction
    this.previousMovementDirection = this.movementDirection;

    if (this.isMoving && this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x;
      const dy = this.targetPosition.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If we're close enough to the target, start oscillating
      if (distance <= this.movementSpeed) {
        this.isMoving = false;
        this.targetPosition = null;
        this.movementDirection = MovementDirection.None;
        return;
      }

      // Move towards target at constant speed
      const directionX = dx / distance; // Normalized direction vector
      const directionY = dy / distance;

      const newX = this.position.x + directionX * this.movementSpeed;
      const newY = this.position.y + directionY * this.movementSpeed;

      // Update movement direction based on X movement
      if (newX > this.position.x) {
        this.movementDirection = MovementDirection.Right;
      } else if (newX < this.position.x) {
        this.movementDirection = MovementDirection.Left;
      }

      this.position.x = newX;
      this.position.y = newY;
    }
  }

  // Stop movement and oscillation
  stopMovement(): void {
    this.isMoving = false;
    this.targetPosition = null;
    this.movementDirection = MovementDirection.None;
  }

  // Get current movement direction
  getMovementDirection(): MovementDirection {
    return this.movementDirection;
  }

  // Check if movement direction has changed
  hasDirectionChanged(): boolean {
    return this.movementDirection !== this.previousMovementDirection;
  }

  draw(context: CanvasRenderingContext2D): void {
    // Draw cat face (head with ears)
    const headX = this.position.x;
    const headY = this.position.y;

    const headRadius = this.radius;

    context.strokeStyle = "#000000";
    context.lineWidth = this.outlineSize;
    // Draw head circle (black)
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(headX, headY, headRadius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    // Calculate ear positions
    const angleRad = (this.earAngle * Math.PI) / 180; // Convert to radians
    const halfAngle = angleRad / 2;

    // Left ear position (top-left of head)
    const leftEarBaseX = headX - Math.sin(halfAngle) * headRadius * 0.8;
    const leftEarBaseY = headY - Math.cos(halfAngle) * headRadius * 0.8 + this.earOffsetY;

    // Right ear position (top-right of head)
    const rightEarBaseX = headX + Math.sin(halfAngle) * headRadius * 0.8;
    const rightEarBaseY = headY - Math.cos(halfAngle) * headRadius * 0.8 + this.earOffsetY;

    // Draw left ear (triangle)
    context.beginPath();
    context.moveTo(leftEarBaseX - this.earWidth / 2, leftEarBaseY);
    context.lineTo(leftEarBaseX + this.earWidth / 2, leftEarBaseY);
    context.lineTo(leftEarBaseX, leftEarBaseY - this.earHeight);
    context.closePath();
    context.fill();

    // Draw right ear (triangle)
    context.beginPath();
    context.moveTo(rightEarBaseX - this.earWidth / 2, rightEarBaseY);
    context.lineTo(rightEarBaseX + this.earWidth / 2, rightEarBaseY);
    context.lineTo(rightEarBaseX, rightEarBaseY - this.earHeight);
    context.closePath();
    context.fill();

    // Draw main black circle (cat body)
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    context.fill();

    // Draw cat eyes
    const actualEyeRadius = this.radius * this.eyeRadius; // Eye size relative to controller radius
    const actualEyeOffsetX = this.radius * this.eyeOffsetX; // Horizontal distance from center
    const actualEyeOffsetY = this.radius * this.eyeOffsetY; // Vertical offset (slightly above center)

    // Left eye position
    const leftEyeX = this.position.x - actualEyeOffsetX;
    const leftEyeY = this.position.y - actualEyeOffsetY;

    // Right eye position
    const rightEyeX = this.position.x + actualEyeOffsetX;
    const rightEyeY = this.position.y - actualEyeOffsetY;

    // Draw left eye (rich green)
    context.fillStyle = "#228B22"; // Rich green color
    context.beginPath();
    context.arc(leftEyeX, leftEyeY, actualEyeRadius, 0, 2 * Math.PI);
    context.fill();

    // Draw right eye (rich green)
    context.beginPath();
    context.arc(rightEyeX, rightEyeY, actualEyeRadius, 0, 2 * Math.PI);
    context.fill();

    // Draw pupils (narrow black rectangles)
    const actualPupilWidth = actualEyeRadius * this.pupilWidth; // Narrow width
    const actualPupilHeight = actualEyeRadius * this.pupilHeight; // Taller than wide for cat-like appearance

    context.fillStyle = "#000000";

    // Left pupil
    context.fillRect(
      leftEyeX - actualPupilWidth / 2,
      leftEyeY - actualPupilHeight / 2,
      actualPupilWidth,
      actualPupilHeight,
    );

    // Right pupil
    context.fillRect(
      rightEyeX - actualPupilWidth / 2,
      rightEyeY - actualPupilHeight / 2,
      actualPupilWidth,
      actualPupilHeight,
    );

    if (!this.debugDraw) return;

    context.strokeStyle = this.isDragging ? "#ff4444" : "#4444ff";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    context.stroke();

    context.fillStyle = this.isDragging ? "#ff4444" : "#4444ff";
    context.beginPath();
    context.arc(this.position.x, this.position.y, 8, 0, 2 * Math.PI);
    context.fill();
  }
}
