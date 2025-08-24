import {
  Point2D,
  Point3D,
  add2D,
  constrainAngle,
  getAngle2D,
  getAngleDifference,
  getDistance2D,
  limit2D,
  multiply2D,
  normalize2D,
  subtract2D,
} from "../utils/geom";

class Node {
  worldPosition: Point3D;
  velocity: Point3D;
  readonly radius: number;
  direction: number = 0;

  constructor(x: number, y: number, z: number = 0, radius: number) {
    this.worldPosition = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.radius = radius;
  }

  setPosition(newPos: Point2D): void {
    this.worldPosition.x = newPos.x;
    this.worldPosition.y = newPos.y;
  }

  setVelocity(newVel: Point2D): void {
    this.velocity.x = newVel.x;
    this.velocity.y = newVel.y;
  }
}

export class Cat {
  readonly spine: Array<Node> = [];
  readonly nodeRadius: number = 20;
  private target: Point3D | null = null;
  private readonly segmentLength: number = 20;
  private readonly maxSpeed: number = 10; // pixels per frame (assuming ~60fps)
  private readonly maxForce: number = 0.3; // steering force per frame
  private readonly arrivalRadius: number = 50; // slow down when approaching target
  private readonly targetReachedThreshold: number = 10; // distance to consider target reached
  private readonly maxAngleChange: number = Math.PI / 3; // 60 degrees max angle change
  private isTargetReached: boolean = false;

  constructor() {
    this.initializeSpine();
  }

  private initializeSpine(): void {
    const sx = 200;
    const sy = 200;

    for (let i = 0; i < 5; i++) {
      const node = new Node(sx + i * this.segmentLength, sy, 0, this.nodeRadius);
      this.spine.push(node);
    }
  }

  setTarget(target: Point3D): void {
    this.target = target;
    this.isTargetReached = false; // Reset target reached flag when new target is set
  }

  // Boids behavior: seek target with arrival (using 2D calculations)
  private seek2D(position: Point2D, velocity: Point2D, target: Point2D): Point2D {
    const desired = subtract2D(target, position);
    const distance = getDistance2D(position, target);

    let desiredSpeed = this.maxSpeed;

    // Slow down when approaching target (arrival behavior)
    if (distance < this.arrivalRadius) {
      desiredSpeed = this.maxSpeed * (distance / this.arrivalRadius);
    }

    const desiredVelocity = multiply2D(normalize2D(desired), desiredSpeed);
    const steer = subtract2D(desiredVelocity, velocity);

    return limit2D(steer, this.maxForce);
  }

  // Apply angle constraints to spine joints
  private applyAngleConstraints(): void {
    // Start from the second joint (index 1) since we need a previous segment
    for (let i = 1; i < this.spine.length - 1; i++) {
      const prevNode = this.spine[i - 1];
      const currentNode = this.spine[i];
      const nextNode = this.spine[i + 1];

      // Get the angle of the previous segment (from prev to current)
      const prevSegmentAngle = getAngle2D(prevNode.worldPosition, currentNode.worldPosition);

      // Get the current angle of the next segment (from current to next)
      const currentSegmentAngle = getAngle2D(currentNode.worldPosition, nextNode.worldPosition);

      // Constrain the next segment angle
      const constrainedAngle = constrainAngle(currentSegmentAngle, prevSegmentAngle, this.maxAngleChange);

      // If angle needs to be adjusted, reposition the next node
      if (Math.abs(getAngleDifference(currentSegmentAngle, constrainedAngle)) > 0.001) {
        nextNode.setPosition({
          x: currentNode.worldPosition.x + Math.cos(constrainedAngle) * this.segmentLength,
          y: currentNode.worldPosition.y + Math.sin(constrainedAngle) * this.segmentLength,
        });
      }
    }
  }

  // Apply distance constraints between connected nodes (using 2D calculations)
  private applyDistanceConstraints(): void {
    // Apply constraints multiple times for stability
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < this.spine.length - 1; i++) {
        const nodeA = this.spine[i];
        const nodeB = this.spine[i + 1];

        const distance = getDistance2D(nodeA.worldPosition, nodeB.worldPosition);
        const difference = distance - this.segmentLength;

        if (Math.abs(difference) > 0.1) {
          const direction = normalize2D(subtract2D(nodeB.worldPosition, nodeA.worldPosition));
          const correction = multiply2D(direction, difference * 0.5);

          // Move both nodes to maintain constraint
          const newPosA = add2D(nodeA.worldPosition, correction);
          const newPosB = subtract2D(nodeB.worldPosition, correction);

          nodeA.setPosition(newPosA);
          nodeB.setPosition(newPosB);
        }
      }
    }
  }

  update(dt: number): void {
    const head = this.spine[0];

    if (this.target && !this.isTargetReached) {
      const distanceToTarget = getDistance2D(head.worldPosition, this.target);

      if (distanceToTarget <= this.targetReachedThreshold) {
        // TODO: set head velocity to 0
        this.isTargetReached = true;
        return;
      }
    }
    if (this.isTargetReached) return;

    // Apply boids behavior to head node (using 2D calculations)
    if (this.target) {
      let seekForce2D = this.seek2D(head.worldPosition, head.velocity, this.target);

      const secondNode = this.spine[1];

      // Current direction from second node to head
      const currentHeadDirection = getAngle2D(secondNode.worldPosition, head.worldPosition);

      // Desired direction based on seek force
      let newVel2D = add2D(head.velocity, seekForce2D);
      const desiredDirection = Math.atan2(newVel2D.y, newVel2D.x);

      // Constrain the desired direction
      const constrainedDirection = constrainAngle(desiredDirection, currentHeadDirection, this.maxAngleChange);

      // Adjust seek force to respect angle constraint
      const constrainedVelocity = multiply2D(
        { x: Math.cos(constrainedDirection), y: Math.sin(constrainedDirection) },
        Math.sqrt(newVel2D.x * newVel2D.x + newVel2D.y * newVel2D.y),
      );

      seekForce2D = subtract2D(constrainedVelocity, head.velocity);
      seekForce2D = limit2D(seekForce2D, this.maxForce);

      newVel2D = add2D(head.velocity, seekForce2D);
      const limitedVel2D = limit2D(newVel2D, this.maxSpeed);

      head.setVelocity(limitedVel2D);
    }

    // Apply slight damping to head velocity to reduce sliding
    const dampedHeadVelocity = multiply2D(head.velocity, 0.95);
    head.setVelocity(dampedHeadVelocity);

    // Update head position (using 2D calculations)
    const newHeadPos2D = add2D(head.worldPosition, head.velocity);

    head.setPosition(newHeadPos2D);

    // Make other nodes follow with simple physics (using 2D calculations)
    for (let i = 1; i < this.spine.length; i++) {
      const curNode = this.spine[i];
      const prevNode = this.spine[i - 1];

      // Apply velocity damping to reduce sliding
      const dampedVelocity = multiply2D(curNode.velocity, 0.8);
      curNode.setVelocity(dampedVelocity);

      // Simple following behavior - move toward previous node
      const direction2D = subtract2D(prevNode.worldPosition, curNode.worldPosition);
      const distance = getDistance2D(curNode.worldPosition, prevNode.worldPosition);

      if (distance > this.segmentLength) {
        // Use moderate force multiplier for responsive following
        const followForce2D = multiply2D(normalize2D(direction2D), this.maxForce * 1.2);
        const newVel2D = add2D(curNode.velocity, followForce2D);
        // Limit speed to be slightly slower than head for following nodes
        const maxFollowSpeed = this.maxSpeed * 0.85;
        const limitedVel2D = limit2D(newVel2D, maxFollowSpeed);
        curNode.setVelocity(limitedVel2D);

        const newPos2D = add2D(curNode.worldPosition, limitedVel2D);
        curNode.setPosition(newPos2D);
      }
    }

    this.applyDistanceConstraints();
    this.applyAngleConstraints();

    if (this.target)
      head.direction = Math.atan2(head.worldPosition.y - this.target.y, head.worldPosition.x - this.target.x);

    for (let i = 1; i < this.spine.length; i++) {
      const current = this.spine[i - 1];
      const next = this.spine[i];

      next.direction = Math.atan2(
        next.worldPosition.y - current.worldPosition.y,
        next.worldPosition.x - current.worldPosition.x,
      );
    }
  }
}
