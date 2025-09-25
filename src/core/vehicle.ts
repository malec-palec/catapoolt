import { Color, createRadialGradientWithStops, rgba, ShadowGradients, wrapContext } from "../registry";
import { IGameFieldSizeProvider } from "../screens/game/game-field";
import { VehicleOptions as VehicleControls } from "../screens/game/game-scene";
import { abs, atan2, cos, hypot, isDev, random, sin, TWO_PI } from "../system";
import { IRenderable, ITickable } from "./display";
import { Point2D } from "./geom";
import { vecAdd, vecDist, vecRandom, vecSub, Vector2D } from "./vector2d";

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

// Check if a circular object is visible in the current camera viewport with margin
const isInBounds = (worldPos: Point2D, cameraPos: Point2D, radius: number, margin: number = 50): boolean =>
  worldPos.x + radius >= cameraPos.x - margin &&
  worldPos.x - radius <= cameraPos.x + c.width + margin &&
  worldPos.y + radius >= cameraPos.y - margin &&
  worldPos.y - radius <= cameraPos.y + c.height + margin;

export class Vehicle implements ITickable, IRenderable {
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

  isVisible: boolean = true;
  drawDebug: boolean = false;

  constructor(
    x: number,
    y: number,
    options: VehicleOptions,
    private vehicles: Vehicle[],
    public catPos: Vector2D,
    private gameField: IGameFieldSizeProvider,
    private controls: VehicleControls,
    private cameraPos: Point2D,
  ) {
    this.position = new Vector2D(x, y);
    this.velocity = vecRandom();
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
    this.color = Color.Gray;
    this.strokeColor = options.strokeColor ?? Color.Black;
    this.strokeWidth = options.strokeWidth ?? 1;

    // Initialize tail history
    for (let i = 0; i < this.tailNodes; i++) {
      this.tailHistory[i] = { x: this.position.x, y: this.position.y };
    }
  }

  tick(dt: number): void {
    // Apply wandering behavior
    this.wander();

    // Apply separation behavior
    const separationForce = this.separate(this.vehicles);
    this.applyForce(separationForce);

    // Apply boundary avoidance
    const boundaryForce = this.avoidBoundaries(
      this.gameField.width,
      this.gameField.height,
      this.controls.boundaryAvoidance,
    );
    this.applyForce(boundaryForce);

    // Apply flee behavior
    const fleeForce = this.flee(this.catPos, this.fleeRadius);
    fleeForce.mult(this.fleeWeight);
    this.applyForce(fleeForce);

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
      const nodeAngle = atan2(currentNode.y - prevNode.y, currentNode.x - prevNode.x);

      // Position current node at fixed distance from previous node
      this.tailHistory[i] = {
        x: prevNode.x + this.tailLength * cos(nodeAngle),
        y: prevNode.y + this.tailLength * sin(nodeAngle),
      };
    }

    // Use game field borders for vehicle boundary constraints
    this.borders(this.gameField);

    this.isVisible = isInBounds(this.position, this.cameraPos, this.size * 2);
    this.drawDebug = this.controls.showDebug;
  }

  applyForce(force: Vector2D): void {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
  }

  wander(): void {
    // Randomly change wander angle
    this.wanderTheta += (random() - 0.5) * 2 * this.wanderChange;

    // Calculate the center of the wander circle
    const circlePos = this.velocity.copy();
    circlePos.normalize();
    circlePos.mult(this.wanderDistance);
    circlePos.add(this.position);

    // Calculate the heading of velocity
    const h = this.velocity.heading();

    // Calculate the offset on the wander circle
    const circleOffset = new Vector2D(
      this.wanderRadius * cos(this.wanderTheta + h),
      this.wanderRadius * sin(this.wanderTheta + h),
    );

    // Calculate target point
    const target = vecAdd(circlePos, circleOffset);
    this.seek(target);
  }

  separate(vehicles: Vehicle[]): Vector2D {
    const steer = new Vector2D(0, 0);
    let count = 0;

    // For every vehicle in the system, check if it's too close
    for (const other of vehicles) {
      const distance = vecDist(this.position, other.position);

      // If the distance is greater than 0 and less than separation radius (0 when you are yourself)
      if (distance > 0 && distance < this.separationRadius) {
        // Calculate vector pointing away from neighbor
        const diff = vecSub(this.position, other.position);
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
    const desired = vecSub(target, this.position);

    // Scale to maximum speed
    desired.setMag(this.maxSpeed);

    // Steering = Desired minus velocity
    const steer = vecSub(desired, this.velocity);
    steer.limit(this.maxForce); // Limit to maximum steering force

    this.applyForce(steer);
  }

  flee(target: Vector2D, fleeRadius: number = 100): Vector2D {
    const distance = vecDist(this.position, target);

    // Only flee if within flee radius
    if (distance > fleeRadius) {
      return new Vector2D(0, 0);
    }

    // Calculate flee force (opposite of seek)
    const desired = vecSub(this.position, target); // Point away from target
    desired.setMag(this.maxSpeed);

    const steer = vecSub(desired, this.velocity);
    steer.limit(this.maxForce);

    // Scale force based on distance (closer = stronger flee)
    const fleeStrength = (fleeRadius - distance) / fleeRadius;
    steer.mult(fleeStrength);

    return steer;
  }

  borders(gameField: IGameFieldSizeProvider): void {
    const { width, height } = gameField;
    // Keep vehicles within bounds (no wrapping)
    if (this.position.x < this.size) {
      this.position.x = this.size;
      this.velocity.x = abs(this.velocity.x); // Bounce away from left edge
    }
    if (this.position.x > width - this.size) {
      this.position.x = width - this.size;
      this.velocity.x = -abs(this.velocity.x); // Bounce away from right edge
    }
    if (this.position.y < this.size) {
      this.position.y = this.size;
      this.velocity.y = abs(this.velocity.y); // Bounce away from top edge
    }
    if (this.position.y > height - this.size) {
      this.position.y = height - this.size;
      this.velocity.y = -abs(this.velocity.y); // Bounce away from bottom edge
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
    if (!this.isVisible) return;

    const { tailHistory, position, velocity, size, strokeWidth, strokeColor, color } = this;

    // Calculate shadow position (slightly below the mouse)
    const shadowX = position.x;
    const shadowY = position.y + size * 0.8; // Shadow offset below mouse

    // Calculate shadow radius based on mouse size
    const shadowRadius = size * 2;

    // Draw ellipse (flattened vertically by 2)
    wrapContext(context, () => {
      context.translate(shadowX, shadowY);
      context.scale(1, 0.4); // Flatten vertically more than cat shadow

      // Create radial gradient using predefined vehicle shadow configuration
      const gradient = createRadialGradientWithStops(context, 0, 0, 0, 0, 0, shadowRadius, ShadowGradients.vehicle());

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, shadowRadius, 0, TWO_PI);
      context.fill();
    });

    const isMovingLeft = velocity.x < 0;

    // Draw a triangle with horizontal base and rounded corner slightly right of center
    context.fillStyle = color;
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;

    wrapContext(context, () => {
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
      const rightToTopLength = hypot(rightToTopDx, rightToTopDy);
      const rightToTopUnitX = rightToTopDx / rightToTopLength;
      const rightToTopUnitY = rightToTopDy / rightToTopLength;

      // Stop at rounded corner distance from top point
      const rightCornerStartX = topPoint - rightToTopUnitX * roundedCornerRadius;
      const rightCornerStartY = topY - rightToTopUnitY * roundedCornerRadius;

      context.lineTo(rightCornerStartX, rightCornerStartY);

      // Draw rounded corner at top point
      const leftToTopDx = topPoint - leftBase;
      const leftToTopDy = topY - baseY;
      const leftToTopLength = hypot(leftToTopDx, leftToTopDy);
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
      context.fillStyle = Color.MediumGray;
      context.beginPath();
      context.arc(isMovingLeft ? leftBase + 2 : rightBase - 2, baseY - 2, this.size * 0.2, 0, TWO_PI);
      context.fill();
    });

    // draw tail
    if (tailHistory.length < 2) return;

    context.strokeStyle = Color.DarkerGray;
    context.lineWidth = 1.5;
    context.lineCap = context.lineJoin = "round";

    context.beginPath();
    context.moveTo(tailHistory[0].x, tailHistory[0].y);
    for (let i = 1; i < tailHistory.length; i++) {
      context.lineTo(tailHistory[i].x, tailHistory[i].y);
    }
    context.stroke();

    if (isDev && this.drawDebug) {
      drawWanderDebug(context, this);
      drawFleeDebug(context, this);
    }
  }
}

function drawWanderDebug(context: CanvasRenderingContext2D, vehicle: Vehicle): void {
  // Calculate the center of the wander circle
  const circlePos = vehicle.velocity.copy();
  circlePos.normalize();
  circlePos.mult(vehicle.wanderDistance);
  circlePos.add(vehicle.position);

  // Calculate the heading of velocity
  const h = vehicle.velocity.heading();

  // Calculate the offset on the wander circle
  const circleOffset = new Vector2D(
    vehicle.wanderRadius * cos(vehicle.wanderTheta + h),
    vehicle.wanderRadius * sin(vehicle.wanderTheta + h),
  );

  // Calculate target point
  const target = vecAdd(circlePos, circleOffset);

  // Draw debug visualization
  context.strokeStyle = Color.Red;
  context.lineWidth = 1;
  context.fillStyle = rgba(Color.RedRGB, 0.1);

  // Draw wander circle
  context.beginPath();
  context.arc(circlePos.x, circlePos.y, vehicle.wanderRadius, 0, TWO_PI);
  context.stroke();

  // Draw target point
  context.beginPath();
  context.arc(target.x, target.y, 2, 0, TWO_PI);
  context.fill();

  // Draw line from vehicle to circle center
  context.beginPath();
  context.moveTo(vehicle.position.x, vehicle.position.y);
  context.lineTo(circlePos.x, circlePos.y);
  context.stroke();

  // Draw line from circle center to target
  context.beginPath();
  context.moveTo(circlePos.x, circlePos.y);
  context.lineTo(target.x, target.y);
  context.stroke();
}

function drawFleeDebug(
  context: CanvasRenderingContext2D,
  vehicle: Vehicle,
  mousePosition: Vector2D = vehicle.catPos,
): void {
  const distance = vecDist(vehicle.position, mousePosition);

  // Draw flee radius circle
  context.strokeStyle = Color.LightBlue;
  context.lineWidth = 1;
  context.setLineDash([5, 5]); // Dashed line

  context.beginPath();
  context.arc(vehicle.position.x, vehicle.position.y, vehicle.fleeRadius, 0, TWO_PI);
  context.stroke();

  // If mouse is within flee radius, draw connection line
  if (distance < vehicle.fleeRadius) {
    context.strokeStyle = Color.Orange;
    context.lineWidth = 2;
    context.setLineDash([]); // Solid line

    context.beginPath();
    context.moveTo(vehicle.position.x, vehicle.position.y);
    context.lineTo(mousePosition.x, mousePosition.y);
    context.stroke();
  }

  // Reset line dash
  context.setLineDash([]);
}
