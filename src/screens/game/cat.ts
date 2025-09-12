import { Vector2D } from "../../core/vector2d";
import { ICircleCollider } from "./soft-blob";

// Interface for objects that can provide shadow width
interface IShadowProvider {
  getLeftmostPoint(): { point: { pos: { x: number; y: number } }; index: number };
  getRightmostPoint(): { point: { pos: { x: number; y: number } }; index: number };
}

export class Cat {
  public position: Vector2D;
  public targetPosition: Vector2D;
  public radius: number;
  public color: string;
  public strokeColor: string;
  public strokeWidth: number;
  public speed: number;
  public easing: number;
  public debugDraw: boolean = false;

  // Cat face properties
  public earAngle = 60; // Angle between ears in degrees
  public earWidth = 20; // Width of ear foundation
  public earHeight = 30; // Height of ears
  public earOffsetY = 0; // Additional Y offset for ears relative to head

  // Eye properties
  public eyeRadius = 0.17; // Eye size relative to body radius
  public eyeOffsetX = 0.3; // Horizontal eye distance from center (relative to radius)
  public eyeOffsetY = 0.2; // Vertical eye offset (relative to radius)
  public pupilWidth = 0.3; // Pupil width relative to eye radius
  public pupilHeight = 1.2; // Pupil height relative to eye radius

  // Shadow properties
  public catHeight = 50; // Height of cat above ground for shadow calculation
  public z = 0; // Height above ground (3D position)
  public shadowScale = 1.0; // Scale factor for shadow

  // Physics properties
  public velocity: Vector2D;
  public velocityZ = 0; // Vertical velocity
  public mass = 1.0; // Mass affects trajectory
  public gravity = 0.5; // Gravity strength
  public bounceDamping = 0.7; // Energy loss on bounce (0-1)
  public maxBounces = 3; // Maximum number of bounces
  public bounceCount = 0; // Current bounce count
  public isFlying = false; // Whether cat is in flight
  public groundLevel = 0; // Ground level for physics
  public screenWidth = 800; // Screen width for edge bouncing
  public screenHeight = 600; // Screen height for edge bouncing

  // Slingshot properties
  public isDragging = false;
  public dragStartPos: Vector2D;
  public launchPower = 0.05; // Launch power multiplier (reduced from 0.1)
  public maxLaunchPower = 0.15; // Maximum allowed launch power

  constructor(x: number, y: number, radius: number = 30) {
    this.position = new Vector2D(x, y);
    this.targetPosition = new Vector2D(x, y);
    this.radius = radius;
    this.color = "#000000";
    this.strokeColor = "#000000";
    this.strokeWidth = 3;
    this.speed = 3;
    this.easing = 0.05; // Lower = smoother, higher = faster

    // Initialize physics
    this.velocity = new Vector2D(0, 0);
    this.dragStartPos = new Vector2D(x, y);
    this.groundLevel = y;
  }

  getCollider(): ICircleCollider {
    return {
      position: { x: this.position.x, y: this.position.y - this.z },
      radius: this.radius,
    };
  }

  render(context: CanvasRenderingContext2D): void {
    const headX = this.position.x;
    const headY = this.position.y - this.z; // Adjust visual position based on height
    const headRadius = this.radius;

    context.fillStyle = this.color;
    context.strokeStyle = this.strokeColor;
    context.lineWidth = this.strokeWidth;

    // Draw main body circle
    context.beginPath();
    context.arc(headX, headY, this.radius, 0, Math.PI * 2);
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
    context.arc(headX, headY, this.radius, 0, 2 * Math.PI);
    context.fill();

    // Draw cat eyes
    const actualEyeRadius = this.radius * this.eyeRadius; // Eye size relative to controller radius
    const actualEyeOffsetX = this.radius * this.eyeOffsetX; // Horizontal distance from center
    const actualEyeOffsetY = this.radius * this.eyeOffsetY; // Vertical offset (slightly above center)

    // Left eye position
    const leftEyeX = headX - actualEyeOffsetX;
    const leftEyeY = headY - actualEyeOffsetY;

    // Right eye position
    const rightEyeX = headX + actualEyeOffsetX;
    const rightEyeY = headY - actualEyeOffsetY;

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

    context.strokeStyle = "#4444ff";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(headX, headY, this.radius, 0, 2 * Math.PI);
    context.stroke();

    context.fillStyle = "#4444ff";
    context.beginPath();
    context.arc(headX, headY, 8, 0, 2 * Math.PI);
    context.fill();
  }

  startDrag(x: number, y: number): void {
    if (!this.isFlying) {
      this.isDragging = true;
      this.dragStartPos.set(x, y);
    }
  }

  updateDrag(x: number, y: number): void {
    if (this.isDragging && !this.isFlying) {
      // Visual feedback during drag (optional - could move cat slightly)
      // For now, we'll just store the current drag position for launch calculation
    }
  }

  launch(x: number, y: number): void {
    if (this.isDragging && !this.isFlying) {
      this.isDragging = false;

      // Calculate launch vector (opposite direction of drag)
      const dragVector = Vector2D.sub(this.dragStartPos, new Vector2D(x, y));

      // Limit the launch power to maximum allowed
      const effectivePower = Math.min(this.launchPower, this.maxLaunchPower);

      // Apply launch power and mass
      this.velocity = Vector2D.mult(dragVector, effectivePower / this.mass);
      this.velocityZ = Math.abs(dragVector.mag()) * effectivePower * 0.5; // Initial upward velocity

      this.isFlying = true;
      this.bounceCount = 0;
    }
  }

  tick(): void {
    if (this.isFlying) {
      // Apply physics
      this.position.add(this.velocity);
      this.z += this.velocityZ;

      // Apply gravity to Z velocity
      this.velocityZ -= this.gravity;

      // Check screen edge collisions (only when cat is at ground level or close to it)
      if (this.z <= this.radius) {
        let bounced = false;

        // Left edge
        if (this.position.x - this.radius <= 0) {
          this.position.x = this.radius;
          this.velocity.x = -this.velocity.x * this.bounceDamping;
          bounced = true;
        }

        // Right edge
        if (this.position.x + this.radius >= this.screenWidth) {
          this.position.x = this.screenWidth - this.radius;
          this.velocity.x = -this.velocity.x * this.bounceDamping;
          bounced = true;
        }

        // Top edge (only if cat is high enough)
        if (this.position.y - this.radius - this.z <= 0) {
          this.position.y = this.radius + this.z;
          this.velocity.y = -this.velocity.y * this.bounceDamping;
          bounced = true;
        }

        // Bottom edge
        if (this.position.y + this.radius >= this.screenHeight) {
          this.position.y = this.screenHeight - this.radius;
          this.velocity.y = -this.velocity.y * this.bounceDamping;
          bounced = true;
        }

        if (bounced && this.bounceCount < this.maxBounces) {
          this.bounceCount++;
        }
      }

      // Check ground collision
      if (this.z <= 0) {
        this.z = 0;

        if (this.bounceCount < this.maxBounces && Math.abs(this.velocityZ) > 0.5) {
          // Bounce
          this.velocityZ = -this.velocityZ * this.bounceDamping;
          this.velocity.mult(this.bounceDamping); // Reduce horizontal velocity on bounce
          this.bounceCount++;
        } else {
          // Stop flying
          this.isFlying = false;
          this.velocity.mult(0);
          this.velocityZ = 0;
        }
      }
    }
  }

  // Method to update screen dimensions
  setScreenBounds(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // Check if point is inside cat (for click detection)
  containsPoint(x: number, y: number): boolean {
    const distance = Vector2D.dist(this.position, new Vector2D(x, y));
    return distance <= this.radius;
  }

  drawShadow(context: CanvasRenderingContext2D, shadowProvider?: IShadowProvider): void {
    let shadowRadius: number;
    let shadowX = this.position.x;

    if (shadowProvider) {
      // Get the leftmost and rightmost points of the shadow provider (e.g., soft body)
      const leftPoint = shadowProvider.getLeftmostPoint();
      const rightPoint = shadowProvider.getRightmostPoint();

      // Calculate shadow diameter (distance between edge points)
      const shadowDiameter = Math.abs(rightPoint.point.pos.x - leftPoint.point.pos.x);
      shadowRadius = (shadowDiameter / 2) * this.shadowScale;

      // Position shadow between the edge points
      shadowX = (leftPoint.point.pos.x + rightPoint.point.pos.x) / 2;
    } else {
      // Use cat radius as fallback
      shadowRadius = this.radius * this.shadowScale;
    }

    // Calculate shadow position (catHeight + z distance below cat)
    const shadowY = this.position.y + this.catHeight + this.z;

    // Scale shadow based on height (higher = smaller shadow)
    const heightScale = Math.max(0.1, 1 - this.z / 200); // Shadow gets smaller as cat goes higher
    const finalShadowRadius = shadowRadius * heightScale;

    // Draw ellipse (flattened vertically by 2)
    context.save();
    context.translate(shadowX, shadowY);
    context.scale(1, 0.5); // Flatten vertically by 2

    // Create radial gradient in the transformed coordinate system
    const gradient = context.createRadialGradient(
      0,
      0,
      0, // Inner circle (center at origin after transform)
      0,
      0,
      finalShadowRadius, // Outer circle (edge)
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)"); // Solid black center
    gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.9)"); // Solid black center
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent edge

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, finalShadowRadius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
