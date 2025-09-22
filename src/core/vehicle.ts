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

  // Tail properties
  public tailLength: number = 2; // Distance between tail nodes
  public tailNodes: number = 15; // Number of tail segments
  public tailHistory: Array<{ x: number; y: number }> = [];

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
    this.strokeWidth = options.strokeWidth ?? 1;

    // Initialize tail history
    for (let i = 0; i < this.tailNodes; i++) {
      this.tailHistory[i] = { x: this.position.x, y: this.position.y };
    }
  }

  tick(): void {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);

    // Update tail following the rope algorithm
    // Determine movement direction
    const isMovingLeft = this.velocity.x < 0;

    // Calculate tail attachment point (opposite side from nose)
    // Triangle dimensions (same as in render method)
    const baseWidth = this.size * 4;
    const leftBase = -baseWidth / 2;
    const rightBase = baseWidth / 2;

    // Attach tail to opposite side from nose
    // If nose is on left side (moving left), tail attaches to right side
    // If nose is on right side (moving right), tail attaches to left side
    const tailAttachX = this.position.x + (isMovingLeft ? rightBase - 2 : leftBase + 2);
    const tailAttachY = this.position.y + this.size * 0.6; // Slightly below center

    // Set head position (tail attachment point)
    this.tailHistory[0] = { x: tailAttachX, y: tailAttachY };

    // Update each tail segment to follow the previous one
    for (let i = 1; i < this.tailNodes; i++) {
      const prevNode = this.tailHistory[i - 1];
      const currentNode = this.tailHistory[i];

      // Calculate angle from current node to previous node
      const nodeAngle = Math.atan2(currentNode.y - prevNode.y, currentNode.x - prevNode.x);

      // Position current node at fixed distance from previous node
      this.tailHistory[i] = {
        x: prevNode.x + this.tailLength * Math.cos(nodeAngle),
        y: prevNode.y + this.tailLength * Math.sin(nodeAngle),
      };
    }
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

  render(context: CanvasRenderingContext2D): void {
    const { tailHistory, position, velocity, size, strokeWidth, strokeColor, color } = this;

    // Calculate shadow position (slightly below the mouse)
    const shadowX = position.x;
    const shadowY = position.y + size * 0.8; // Shadow offset below mouse

    // Calculate shadow radius based on mouse size
    const shadowRadius = size * 2;

    // Draw ellipse (flattened vertically by 2)
    context.save();
    context.translate(shadowX, shadowY);
    context.scale(1, 0.4); // Flatten vertically more than cat shadow

    // Create radial gradient
    const gradient = context.createRadialGradient(
      0,
      0,
      0, // Inner circle (center at origin after transform)
      0,
      0,
      shadowRadius, // Outer circle (edge)
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.15)"); // Much lighter center for mice
    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.1)"); // Very light transparency
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent edge

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, shadowRadius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const isMovingLeft = velocity.x < 0;

    // Draw a triangle with horizontal base and rounded corner slightly right of center
    context.fillStyle = color;
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;

    context.save();
    context.translate(position.x, position.y);

    // Triangle dimensions
    const baseWidth = size * 4;
    const height = size * 1.5;
    const roundedCornerRadius = size;

    // Calculate triangle points
    const leftBase = -baseWidth / 2;
    const rightBase = baseWidth / 2;
    const topPoint = baseWidth * 0.15 * (isMovingLeft ? 1 : -1); // Slightly right of center (15% to the right)
    const baseY = height / 2;
    const topY = -height / 2;

    context.beginPath();

    // Start from left base corner
    context.moveTo(leftBase, baseY);

    // Draw horizontal base line to right
    context.lineTo(rightBase, baseY);

    // Draw line from right base to top point, but stop before the rounded corner
    const rightToTopDx = topPoint - rightBase;
    const rightToTopDy = topY - baseY;
    const rightToTopLength = Math.sqrt(rightToTopDx * rightToTopDx + rightToTopDy * rightToTopDy);
    const rightToTopUnitX = rightToTopDx / rightToTopLength;
    const rightToTopUnitY = rightToTopDy / rightToTopLength;

    // Stop at rounded corner distance from top point
    const rightCornerStartX = topPoint - rightToTopUnitX * roundedCornerRadius;
    const rightCornerStartY = topY - rightToTopUnitY * roundedCornerRadius;

    context.lineTo(rightCornerStartX, rightCornerStartY);

    // Draw rounded corner at top point
    const leftToTopDx = topPoint - leftBase;
    const leftToTopDy = topY - baseY;
    const leftToTopLength = Math.sqrt(leftToTopDx * leftToTopDx + leftToTopDy * leftToTopDy);
    const leftToTopUnitX = leftToTopDx / leftToTopLength;
    const leftToTopUnitY = leftToTopDy / leftToTopLength;

    const leftCornerStartX = topPoint - leftToTopUnitX * roundedCornerRadius;
    const leftCornerStartY = topY - leftToTopUnitY * roundedCornerRadius;

    // Calculate control points for quadratic curve
    context.quadraticCurveTo(topPoint, topY, leftCornerStartX, leftCornerStartY);

    // Draw line from rounded corner back to left base
    context.lineTo(leftBase, baseY);

    context.closePath();
    context.fill();
    // context.stroke();

    // Draw nose (gray dot at the top point)
    context.fillStyle = "#999999";
    context.beginPath();
    context.arc(isMovingLeft ? leftBase + 2 : rightBase - 2, baseY - 2, this.size * 0.2, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // draw tail
    if (tailHistory.length < 2) return;

    context.strokeStyle = "#666666";
    context.lineWidth = 1.5;
    context.lineCap = context.lineJoin = "round";

    context.beginPath();
    context.moveTo(tailHistory[0].x, tailHistory[0].y);
    for (let i = 1; i < tailHistory.length; i++) {
      context.lineTo(tailHistory[i].x, tailHistory[i].y);
    }
    context.stroke();
  }

  drawWanderDebug(context: CanvasRenderingContext2D): void {
    if (import.meta.env.PROD) return;
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
    if (import.meta.env.PROD) return;
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
    this.tick();
    this.borders(width, height);
    this.render(context);

    if (showDebug) {
      this.drawWanderDebug(context);
    }
  }
}
