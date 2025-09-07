import { Vector2D } from "./vector2d";

export interface VehicleOptions {
  maxSpeed?: number;
  maxForce?: number;
  size?: number;
  wanderRadius?: number;
  wanderDistance?: number;
  wanderChange?: number;
  separationRadius?: number;
  separationWeight?: number;
  fleeRadius?: number;
  fleeWeight?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export class Vehicle {
  public position: Vector2D;
  public velocity: Vector2D;
  public acceleration: Vector2D;
  public maxSpeed: number;
  public maxForce: number;
  public size: number;
  public wanderTheta: number;
  public wanderRadius: number;
  public wanderDistance: number;
  public wanderChange: number;
  public separationRadius: number;
  public separationWeight: number;
  public fleeRadius: number;
  public fleeWeight: number;
  public color: string;
  public strokeColor: string;
  public strokeWidth: number;

  constructor(x: number, y: number, options: VehicleOptions = {}) {
    this.position = new Vector2D(x, y);
    this.velocity = Vector2D.random();
    this.acceleration = new Vector2D(0, 0);

    // Vehicle parameters
    this.maxSpeed = options.maxSpeed ?? 2;
    this.maxForce = options.maxForce ?? 0.05;
    this.size = options.size ?? 6;

    // Wandering parameters
    this.wanderTheta = 0;
    this.wanderRadius = options.wanderRadius ?? 25;
    this.wanderDistance = options.wanderDistance ?? 80;
    this.wanderChange = options.wanderChange ?? 0.3;

    // Separation parameters
    this.separationRadius = options.separationRadius ?? 25;
    this.separationWeight = options.separationWeight ?? 1.5;

    // Flee parameters
    this.fleeRadius = options.fleeRadius ?? 100;
    this.fleeWeight = options.fleeWeight ?? 2.0;

    // Visual parameters
    this.color = "#7f7f7f";
    this.strokeColor = options.strokeColor ?? "#000000";
    this.strokeWidth = options.strokeWidth ?? 2;
  }

  update(): void {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  applyForce(force: Vector2D): void {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
  }

  wander(): void {
    // Randomly change wander angle
    this.wanderTheta += (Math.random() - 0.5) * 2 * this.wanderChange;

    // Calculate the center of the wander circle
    const circlePos = this.velocity.copy();
    circlePos.normalize();
    circlePos.mult(this.wanderDistance);
    circlePos.add(this.position);

    // Calculate the heading of velocity
    const h = this.velocity.heading();

    // Calculate the offset on the wander circle
    const circleOffset = new Vector2D(
      this.wanderRadius * Math.cos(this.wanderTheta + h),
      this.wanderRadius * Math.sin(this.wanderTheta + h),
    );

    // Calculate target point
    const target = Vector2D.add(circlePos, circleOffset);
    this.seek(target);
  }

  separate(vehicles: Vehicle[]): Vector2D {
    const steer = new Vector2D(0, 0);
    let count = 0;

    // For every vehicle in the system, check if it's too close
    for (const other of vehicles) {
      const distance = Vector2D.dist(this.position, other.position);

      // If the distance is greater than 0 and less than separation radius (0 when you are yourself)
      if (distance > 0 && distance < this.separationRadius) {
        // Calculate vector pointing away from neighbor
        const diff = Vector2D.sub(this.position, other.position);
        diff.normalize();
        diff.div(distance); // Weight by distance (closer = stronger repulsion)
        steer.add(diff);
        count++; // Keep track of how many
      }
    }

    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);

      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce * this.separationWeight); // Apply separation weight
    }

    return steer;
  }

  seek(target: Vector2D): void {
    // A vector pointing from the location to the target
    const desired = Vector2D.sub(target, this.position);

    // Scale to maximum speed
    desired.setMag(this.maxSpeed);

    // Steering = Desired minus velocity
    const steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce); // Limit to maximum steering force

    this.applyForce(steer);
  }

  flee(target: Vector2D, fleeRadius: number = 100): Vector2D {
    const distance = Vector2D.dist(this.position, target);

    // Only flee if within flee radius
    if (distance > fleeRadius) {
      return new Vector2D(0, 0);
    }

    // Calculate flee force (opposite of seek)
    const desired = Vector2D.sub(this.position, target); // Point away from target
    desired.setMag(this.maxSpeed);

    const steer = Vector2D.sub(desired, this.velocity);
    steer.limit(this.maxForce);

    // Scale force based on distance (closer = stronger flee)
    const fleeStrength = (fleeRadius - distance) / fleeRadius;
    steer.mult(fleeStrength);

    return steer;
  }

  borders(width: number, height: number): void {
    // Keep vehicles within bounds (no wrapping)
    if (this.position.x < this.size) {
      this.position.x = this.size;
      this.velocity.x = Math.abs(this.velocity.x); // Bounce away from left edge
    }
    if (this.position.x > width - this.size) {
      this.position.x = width - this.size;
      this.velocity.x = -Math.abs(this.velocity.x); // Bounce away from right edge
    }
    if (this.position.y < this.size) {
      this.position.y = this.size;
      this.velocity.y = Math.abs(this.velocity.y); // Bounce away from top edge
    }
    if (this.position.y > height - this.size) {
      this.position.y = height - this.size;
      this.velocity.y = -Math.abs(this.velocity.y); // Bounce away from bottom edge
    }
  }

  // Add boundary avoidance behavior
  avoidBoundaries(width: number, height: number, avoidanceDistance: number = 50): Vector2D {
    const steer = new Vector2D(0, 0);
    const avoidanceForce = this.maxSpeed * 2; // Strength of avoidance

    // Left boundary
    if (this.position.x < avoidanceDistance) {
      const force = (avoidanceDistance - this.position.x) / avoidanceDistance;
      steer.x += avoidanceForce * force;
    }

    // Right boundary
    if (this.position.x > width - avoidanceDistance) {
      const force = (this.position.x - (width - avoidanceDistance)) / avoidanceDistance;
      steer.x -= avoidanceForce * force;
    }

    // Top boundary
    if (this.position.y < avoidanceDistance) {
      const force = (avoidanceDistance - this.position.y) / avoidanceDistance;
      steer.y += avoidanceForce * force;
    }

    // Bottom boundary
    if (this.position.y > height - avoidanceDistance) {
      const force = (this.position.y - (height - avoidanceDistance)) / avoidanceDistance;
      steer.y -= avoidanceForce * force;
    }

    // Normalize and limit the steering force
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }

    return steer;
  }

  draw(context: CanvasRenderingContext2D): void {
    // Draw a triangle pointing left or right based on velocity direction
    const isMovingLeft = this.velocity.x < 0;

    context.fillStyle = this.color;
    context.strokeStyle = this.strokeColor;
    context.lineWidth = this.strokeWidth;

    context.save();
    context.translate(this.position.x, this.position.y);

    context.beginPath();
    if (isMovingLeft) {
      // Triangle pointing left
      context.moveTo(-this.size * 2, 0);
      context.lineTo(this.size * 2, -this.size);
      context.lineTo(this.size * 2, this.size);
    } else {
      // Triangle pointing right
      context.moveTo(this.size * 2, 0);
      context.lineTo(-this.size * 2, -this.size);
      context.lineTo(-this.size * 2, this.size);
    }
    context.closePath();

    context.fill();
    context.stroke();
    context.restore();
  }

  drawWanderDebug(context: CanvasRenderingContext2D): void {
    // Calculate the center of the wander circle
    const circlePos = this.velocity.copy();
    circlePos.normalize();
    circlePos.mult(this.wanderDistance);
    circlePos.add(this.position);

    // Calculate the heading of velocity
    const h = this.velocity.heading();

    // Calculate the offset on the wander circle
    const circleOffset = new Vector2D(
      this.wanderRadius * Math.cos(this.wanderTheta + h),
      this.wanderRadius * Math.sin(this.wanderTheta + h),
    );

    // Calculate target point
    const target = Vector2D.add(circlePos, circleOffset);

    // Draw debug visualization
    context.strokeStyle = "#ff0000";
    context.lineWidth = 1;
    context.fillStyle = "rgba(255, 0, 0, 0.1)";

    // Draw wander circle
    context.beginPath();
    context.arc(circlePos.x, circlePos.y, this.wanderRadius, 0, Math.PI * 2);
    context.stroke();

    // Draw target point
    context.beginPath();
    context.arc(target.x, target.y, 2, 0, Math.PI * 2);
    context.fill();

    // Draw line from vehicle to circle center
    context.beginPath();
    context.moveTo(this.position.x, this.position.y);
    context.lineTo(circlePos.x, circlePos.y);
    context.stroke();

    // Draw line from circle center to target
    context.beginPath();
    context.moveTo(circlePos.x, circlePos.y);
    context.lineTo(target.x, target.y);
    context.stroke();
  }

  drawFleeDebug(context: CanvasRenderingContext2D, mousePosition?: Vector2D): void {
    if (!mousePosition) return;

    const distance = Vector2D.dist(this.position, mousePosition);

    // Draw flee radius circle
    context.strokeStyle = "#0066ff";
    context.lineWidth = 1;
    context.setLineDash([5, 5]); // Dashed line

    context.beginPath();
    context.arc(this.position.x, this.position.y, this.fleeRadius, 0, Math.PI * 2);
    context.stroke();

    // If mouse is within flee radius, draw connection line
    if (distance < this.fleeRadius) {
      context.strokeStyle = "#ff6600";
      context.lineWidth = 2;
      context.setLineDash([]); // Solid line

      context.beginPath();
      context.moveTo(this.position.x, this.position.y);
      context.lineTo(mousePosition.x, mousePosition.y);
      context.stroke();
    }

    // Reset line dash
    context.setLineDash([]);
  }

  applyBehaviors(
    vehicles: Vehicle[],
    mousePosition?: Vector2D,
    fieldWidth?: number,
    fieldHeight?: number,
    boundaryAvoidanceDistance?: number,
  ): void {
    // Apply wandering behavior
    this.wander();

    // Apply separation behavior
    const separationForce = this.separate(vehicles);
    this.applyForce(separationForce);

    // Apply boundary avoidance if field dimensions are provided
    if (fieldWidth && fieldHeight && boundaryAvoidanceDistance !== undefined) {
      const boundaryForce = this.avoidBoundaries(fieldWidth, fieldHeight, boundaryAvoidanceDistance);
      this.applyForce(boundaryForce);
    }

    // Apply flee behavior if mouse position is provided
    if (mousePosition) {
      const fleeForce = this.flee(mousePosition, this.fleeRadius);
      fleeForce.mult(this.fleeWeight);
      this.applyForce(fleeForce);
    }
  }

  run(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    vehicles: Vehicle[],
    showDebug: boolean = false,
  ): void {
    this.applyBehaviors(vehicles);
    this.update();
    this.borders(width, height);
    this.draw(context);

    if (showDebug) {
      this.drawWanderDebug(context);
    }
  }
}
