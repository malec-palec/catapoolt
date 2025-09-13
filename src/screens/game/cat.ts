import { playSound, Sounds } from "../../core/audio/sound";
import { easeInOut } from "../../core/tween";
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
  public strokeWidth: number;
  public speed: number;
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

  // Debug trajectory visualization
  public debugTrajectory = false; // import.meta.env.DEV;
  public trajectoryPoints: Array<{ x: number; y: number; z: number; type: "normal" | "bounce" | "ground" }> = [];
  public maxTrajectoryPoints = 100;

  // Predictive trajectory
  public predictiveSteps = 150; // Number of simulation steps
  public predictiveStepSize = 0.5; // Time step for simulation

  // Slingshot properties
  public isDragging = false;
  public dragStartPos: Vector2D;
  public launchPower = 0.05; // Launch power multiplier (reduced from 0.1)
  public maxLaunchPower = 0.15; // Maximum allowed launch power
  public maxDragDistance = 200; // Maximum drag distance in pixels
  public jumpHeightMultiplier = 1.2; // Multiplier for vertical velocity (higher = higher jumps)

  // Double tap for purge
  private lastTapTime = 0;
  private doubleTapDelay = 300; // ms

  // Inflation deflation animation
  private _isDeflating = false;
  private deflationStartTime = 0;
  private deflationDuration = 800; // ms
  private deflationStartValue = 0;
  private deflationTargetValue = 0;

  // Vulnerability window after purge
  private purgeProtectionTime = 0;
  private purgeProtectionDuration = 500; // 0.5 seconds in milliseconds

  // Head lowering during drag
  public headOffset = 0; // Current head vertical offset during drag
  public maxHeadOffset = 0; // Maximum head offset (calculated based on shadow position)
  public headOscillationX = 0; // Horizontal oscillation offset when head is lowered
  private oscillationTime = 0; // Time counter for oscillation
  public oscillationFrequency = 3; // Oscillation frequency (cycles per second)
  public oscillationAmplitude = 2; // Maximum horizontal oscillation distance

  // Stamina system
  public maxStamina = 100;
  public currentStamina = 100;
  public displayStamina = 100; // Visual stamina for smooth animation
  public staminaCostMultiplier = 0.025; // How much stamina is consumed per jump distance (max jump ~5%)
  public staminaRestoreAmount = 10; // How much stamina is restored when eating a mouse
  private shouldTriggerGameOverAfterLanding = false;

  // Inflation system
  public inflationLevel = 0; // Current inflation level (0 = normal size)
  public maxInflationLevel = 10; // Maximum inflation level
  public inflationPerMouse = 2; // How much inflation per mouse eaten
  public baseBodyArea: number = 0; // Original body area for reference
  public inflationMultiplier = 1.5; // How much the body area increases per inflation level
  public inflationStaminaPenalty = 0.1; // Additional stamina cost per inflation level (10% per level)
  public inflationJumpPenalty = 0.05; // Jump distance reduction per inflation level (5% per level)

  // Stamina animation
  private staminaAnimationTime = 0;
  private staminaAnimationDuration = 800; // ms
  private staminaStartValue = 100;
  private staminaTargetValue = 100;
  private isAnimatingStamina = false;

  constructor(
    x: number,
    y: number,
    radius: number = 30,
    private onStaminaEmpty?: () => void,
  ) {
    this.position = new Vector2D(x, y);
    this.targetPosition = new Vector2D(x, y);
    this.radius = radius;
    this.strokeWidth = 3;
    this.speed = 3;

    // Initialize physics
    this.velocity = new Vector2D(0, 0);
    this.dragStartPos = new Vector2D(x, y);
    this.groundLevel = y;
  }

  getFloorLevel(): number {
    return this.position.y + this.catHeight + this.z;
  }

  getCollider(): ICircleCollider {
    return {
      position: { x: this.position.x, y: this.position.y - this.z },
      radius: this.radius,
    };
  }

  render(context: CanvasRenderingContext2D): void {
    const headX = this.position.x + this.headOscillationX;
    const headY = this.position.y - this.z + this.headOffset;

    context.fillStyle = context.strokeStyle = "#000";
    context.lineWidth = this.strokeWidth;

    // Draw main body circle
    context.beginPath();
    context.arc(headX, headY, this.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // Calculate ear positions once
    const halfAngle = (this.earAngle * Math.PI) / 360; // Direct calculation
    const sinHalf = Math.sin(halfAngle);
    const cosHalf = Math.cos(halfAngle);
    const earOffset = this.radius * 0.8;
    const earHalfWidth = this.earWidth / 2;

    // Draw ears using shared calculations
    const drawEar = (xSign: number) => {
      const baseX = headX + xSign * sinHalf * earOffset;
      const baseY = headY - cosHalf * earOffset + this.earOffsetY;

      context.beginPath();
      context.moveTo(baseX - earHalfWidth, baseY);
      context.lineTo(baseX + earHalfWidth, baseY);
      context.lineTo(baseX, baseY - this.earHeight);
      context.closePath();
      context.fill();
    };

    drawEar(-1); // Left ear
    drawEar(1); // Right ear

    // Redraw body to cover ear bases
    context.beginPath();
    context.arc(headX, headY, this.radius, 0, Math.PI * 2);
    context.fill();

    // Calculate eye properties once
    const eyeRadius = this.radius * this.eyeRadius;
    const eyeOffsetX = this.radius * this.eyeOffsetX;
    const eyeOffsetY = this.radius * this.eyeOffsetY;
    const pupilHalfWidth = (eyeRadius * this.pupilWidth) / 2;
    const pupilHalfHeight = (eyeRadius * this.pupilHeight) / 2;

    // Draw eyes using shared calculations
    const drawEye = (xSign: number) => {
      const eyeX = headX + xSign * eyeOffsetX;
      const eyeY = headY - eyeOffsetY;

      // Eye
      context.fillStyle = "#228B22";
      context.beginPath();
      context.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      context.fill();

      // Pupil
      context.fillStyle = "#000000";
      context.fillRect(eyeX - pupilHalfWidth, eyeY - pupilHalfHeight, pupilHalfWidth * 2, pupilHalfHeight * 2);
    };

    drawEye(-1); // Left eye
    drawEye(1); // Right eye

    if (this.debugDraw) {
      context.strokeStyle = "#4444ff";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(headX, headY, this.radius, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = "#4444ff";
      context.beginPath();
      context.arc(headX, headY, 8, 0, Math.PI * 2);
      context.fill();
    }
  }

  startDrag(x: number, y: number): void {
    if (!this.isFlying) {
      playSound(Sounds.Stretching);
      this.isDragging = true;
      this.dragStartPos.set(x, y);
      this.headOffset = 0; // Reset head position when starting drag
      this.headOscillationX = 0; // Reset horizontal oscillation
      this.oscillationTime = 0; // Reset oscillation timer
    }
  }

  updateDrag(x: number, y: number): void {
    if (this.isDragging && !this.isFlying) {
      // Calculate drag distance for head lowering
      const dragVector = Vector2D.sub(new Vector2D(x, y), this.dragStartPos);
      const dragDistance = dragVector.mag();

      // Calculate maximum head offset (distance from head bottom to shadow top)
      const shadowY = this.position.y + this.catHeight + this.z;
      const headBottomY = this.position.y + this.radius - this.z;
      this.maxHeadOffset = Math.max(0, shadowY - headBottomY);

      // Calculate head offset based on drag distance (normalized to maxDragDistance)
      const dragRatio = Math.min(dragDistance / this.maxDragDistance, 1);
      this.headOffset = dragRatio * this.maxHeadOffset;
    }
  }

  launch(x: number, y: number): void {
    if (this.isDragging && !this.isFlying && this.currentStamina > 0) {
      this.isDragging = false;
      this.headOffset = 0; // Reset head position
      this.headOscillationX = 0; // Reset horizontal oscillation
      this.oscillationTime = 0; // Reset oscillation timer

      // Calculate launch vector (opposite direction of drag)
      const rawDragVector = Vector2D.sub(this.dragStartPos, new Vector2D(x, y));
      const dragMagnitude = rawDragVector.mag();

      // Calculate stamina cost based on jump distance and inflation penalty
      const baseStaminaCost = dragMagnitude * this.staminaCostMultiplier;
      const inflationStaminaMultiplier = this.getInflationStaminaMultiplier();
      const staminaCost = Math.min(baseStaminaCost * inflationStaminaMultiplier, this.currentStamina);
      const newStamina = Math.max(0, this.currentStamina - staminaCost);

      // Start stamina animation
      this.animateStaminaTo(newStamina);
      this.currentStamina = newStamina;

      // Check if game should end after landing
      if (this.currentStamina <= 0) {
        this.shouldTriggerGameOverAfterLanding = true;
      }

      // Apply magnitude limit and power constraints in one step
      const effectiveMagnitude = Math.min(dragMagnitude, this.maxDragDistance);
      const effectivePower = Math.min(this.launchPower, this.maxLaunchPower);
      const powerScale = (effectivePower / this.mass) * (effectiveMagnitude / Math.max(dragMagnitude, 1));

      // Apply inflation penalty to jump distance
      const inflationJumpMultiplier = this.getInflationJumpMultiplier();

      // Set velocity directly without creating intermediate vectors
      this.velocity = Vector2D.mult(rawDragVector, powerScale * inflationJumpMultiplier);
      this.velocityZ = effectiveMagnitude * effectivePower * this.jumpHeightMultiplier * inflationJumpMultiplier;

      this.isFlying = true;
      this.bounceCount = 0;

      // Clear previous trajectory when launching
      if (this.debugTrajectory) {
        this.trajectoryPoints = [];
      }
    }
  }

  tick(dt: number): void {
    // Update stamina animation
    if (this.isAnimatingStamina) {
      this.staminaAnimationTime += dt;
      const progress = Math.min(this.staminaAnimationTime / this.staminaAnimationDuration, 1);
      const easedProgress = easeInOut(progress);

      this.displayStamina = this.staminaStartValue + (this.staminaTargetValue - this.staminaStartValue) * easedProgress;

      if (progress >= 1) {
        this.isAnimatingStamina = false;
        this.displayStamina = this.staminaTargetValue;
      }
    }

    // Update deflation animation
    if (this._isDeflating) {
      this.deflationStartTime += dt;
      const progress = Math.min(this.deflationStartTime / this.deflationDuration, 1);
      const easedProgress = easeInOut(progress);

      this.inflationLevel =
        this.deflationStartValue + (this.deflationTargetValue - this.deflationStartValue) * easedProgress;

      if (progress >= 1) {
        this._isDeflating = false;
        this.inflationLevel = this.deflationTargetValue;
      }
    }

    // Update purge protection timer
    if (this.purgeProtectionTime > 0) {
      this.purgeProtectionTime -= dt;
      if (this.purgeProtectionTime < 0) {
        this.purgeProtectionTime = 0;
      }
    }

    // Update head oscillation during drag
    if (this.isDragging && !this.isFlying) {
      // Update oscillation time
      this.oscillationTime += dt;

      // Calculate oscillation intensity based on how lowered the head is
      const oscillationIntensity = this.headOffset / Math.max(this.maxHeadOffset, 1);

      // Calculate horizontal oscillation using sine wave
      this.headOscillationX =
        Math.sin(this.oscillationTime * this.oscillationFrequency * 0.001 * Math.PI * 2) *
        this.oscillationAmplitude *
        oscillationIntensity;
    }

    if (this.isFlying) {
      // Apply physics
      this.position.add(this.velocity);
      this.z += this.velocityZ;

      // Record trajectory point for debug visualization
      if (this.debugTrajectory) {
        this.addTrajectoryPoint("normal");
      }

      // Apply gravity to Z velocity
      this.velocityZ -= this.gravity;

      // Apply smooth boundary damping instead of hard bounces
      this.applySmoothBoundaryDamping();

      // Check ground collision
      if (this.z <= 0) {
        this.z = 0;

        if (this.bounceCount < this.maxBounces && Math.abs(this.velocityZ) > 0.5) {
          playSound(Sounds.Landing);
          // Bounce
          this.velocityZ = -this.velocityZ * this.bounceDamping;
          this.velocity.mult(this.bounceDamping); // Reduce horizontal velocity on bounce
          this.bounceCount++;

          // Record bounce point for debug visualization
          if (this.debugTrajectory) {
            this.addTrajectoryPoint("bounce");
          }
        } else {
          // Stop flying
          this.isFlying = false;
          this.velocity.mult(0);
          this.velocityZ = 0;

          // Record final ground point for debug visualization
          if (this.debugTrajectory) {
            this.addTrajectoryPoint("ground");
          }

          // Check if game should end after landing
          if (this.shouldTriggerGameOverAfterLanding) {
            this.shouldTriggerGameOverAfterLanding = false;
            if (this.onStaminaEmpty) {
              this.onStaminaEmpty();
            }
          }
        }
      }
    }
  }

  // Method to update screen dimensions
  setScreenBounds(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // Calculate collision detection parameters
  public getCollisionData(): { centerX: number; centerY: number; radius: number } {
    const headTopY = this.position.y - this.radius;
    const shadowCenterY = (this.position.y + this.catHeight + this.z) * 1.02;

    return {
      centerX: this.position.x,
      centerY: (headTopY + shadowCenterY) / 2,
      radius: Math.abs(shadowCenterY - headTopY) / 2,
    };
  }

  // Check collision with a point (like mouse position)
  public checkCollisionWithPoint(x: number, y: number, objectRadius: number = 0): boolean {
    if (this.z > 5) return false; // Only check collisions when on ground

    const collisionData = this.getCollisionData();
    const dx = x - collisionData.centerX;
    const dy = y - collisionData.centerY;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = collisionData.radius + objectRadius;

    return distanceSquared <= radiusSum * radiusSum;
  }

  // Render collision debug visualization
  public renderCollisionDebug(context: CanvasRenderingContext2D): void {
    if (!this.debugDraw || this.z > 5) return;

    const collisionData = this.getCollisionData();

    context.strokeStyle = "#ff0000";
    context.lineWidth = 2;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.arc(collisionData.centerX, collisionData.centerY, collisionData.radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }

  private applySmoothBoundaryDamping(): void {
    const dampingZone = 100;
    const dampingStrength = 0.95;
    const dampingRange = 0.05; // 1 - dampingStrength

    // Apply horizontal and vertical damping
    [this.position.x, this.velocity.x] = this.applyEdgeDamping(
      this.position.x,
      this.velocity.x,
      this.radius,
      this.screenWidth - this.radius,
      dampingZone,
      dampingStrength,
      dampingRange,
    );
    [this.position.y, this.velocity.y] = this.applyEdgeDamping(
      this.position.y,
      this.velocity.y,
      this.radius + this.z,
      this.screenHeight - this.radius,
      dampingZone,
      dampingStrength,
      dampingRange,
    );
  }

  private applyEdgeDamping(
    position: number,
    velocity: number,
    minBound: number,
    maxBound: number,
    dampingZone: number,
    dampingStrength: number,
    dampingRange: number,
  ): [number, number] {
    const distance = position - minBound;
    if (distance <= 0) return [minBound, Math.max(0, velocity)];
    if (distance <= dampingZone && velocity < 0) {
      return [position, velocity * (dampingStrength + dampingRange * (distance / dampingZone))];
    }

    const distanceFromMax = maxBound - position;
    if (distanceFromMax <= 0) return [maxBound, Math.min(0, velocity)];
    if (distanceFromMax <= dampingZone && velocity > 0) {
      return [position, velocity * (dampingStrength + dampingRange * (distanceFromMax / dampingZone))];
    }

    return [position, velocity];
  }

  isPressed(v: Vector2D): boolean {
    return Vector2D.dist(this.position, v) <= this.radius * 2;
  }

  private addTrajectoryPoint(type: "normal" | "bounce" | "ground"): void {
    this.trajectoryPoints.push({
      x: this.position.x,
      y: this.position.y - this.z + this.catHeight, // Visual position accounting for height
      z: this.z,
      type,
    });

    // Limit trajectory points to prevent memory issues
    if (this.trajectoryPoints.length > this.maxTrajectoryPoints) {
      this.trajectoryPoints.shift();
    }
  }

  calculatePredictiveTrajectory(
    launchX: number,
    launchY: number,
  ): Array<{ x: number; y: number; z: number; type: "normal" | "bounce" | "ground" }> {
    // Calculate initial velocity based on launch parameters
    const rawDragVector = Vector2D.sub(this.dragStartPos, new Vector2D(launchX, launchY));
    const dragMagnitude = rawDragVector.mag();
    const effectiveMagnitude = Math.min(dragMagnitude, this.maxDragDistance);
    const effectivePower = Math.min(this.launchPower, this.maxLaunchPower);
    const powerScale = (effectivePower / this.mass) * (effectiveMagnitude / Math.max(dragMagnitude, 1));

    // Apply inflation penalty to predicted trajectory
    const inflationJumpMultiplier = this.getInflationJumpMultiplier();

    // Initial conditions
    let simX = this.position.x;
    let simY = this.position.y;
    let simZ = this.z;
    let simVelX = rawDragVector.x * powerScale * inflationJumpMultiplier;
    let simVelY = rawDragVector.y * powerScale * inflationJumpMultiplier;
    let simVelZ = effectiveMagnitude * effectivePower * this.jumpHeightMultiplier * inflationJumpMultiplier;

    const points: Array<{ x: number; y: number; z: number; type: "normal" | "bounce" | "ground" }> = [];
    const dampingZone = 100;
    const dampingStrength = 0.95;
    const dampingRange = 0.05; // 1 - dampingStrength

    for (let step = 0; step < this.predictiveSteps; step++) {
      // Apply physics simulation
      simX += simVelX * this.predictiveStepSize;
      simY += simVelY * this.predictiveStepSize;
      simZ += simVelZ * this.predictiveStepSize;
      simVelZ -= this.gravity * this.predictiveStepSize;

      // Simulate boundary damping using existing method
      [simX, simVelX] = this.applyEdgeDamping(
        simX,
        simVelX,
        this.radius,
        this.screenWidth - this.radius,
        dampingZone,
        dampingStrength,
        dampingRange,
      );
      [simY, simVelY] = this.applyEdgeDamping(
        simY,
        simVelY,
        this.radius + simZ,
        this.screenHeight - this.radius,
        dampingZone,
        dampingStrength,
        dampingRange,
      );

      // Ground collision simulation - stop at first ground contact
      if (simZ <= 0) {
        simZ = 0;
        points.push({ x: simX, y: simY - simZ + this.catHeight, z: simZ, type: "ground" });
        break;
      } else if (step % 3 === 0) {
        points.push({ x: simX, y: simY - simZ + this.catHeight, z: simZ, type: "normal" });
      }
    }

    return points;
  }

  drawPredictiveTrajectory(context: CanvasRenderingContext2D, launchX: number, launchY: number): void {
    if (!this.isDragging) return;

    const predictedPoints = this.calculatePredictiveTrajectory(launchX, launchY);
    if (predictedPoints.length < 2) return;

    // Draw predicted trajectory line
    context.strokeStyle = "rgba(0, 150, 255, 0.6)";
    context.lineWidth = 3;
    context.setLineDash([8, 8]);
    context.beginPath();

    for (let i = 0; i < predictedPoints.length; i++) {
      const point = predictedPoints[i];
      if (point.type !== "bounce" && point.type !== "ground") {
        if (i === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }
    }
    context.stroke();
    context.setLineDash([]);

    for (const point of predictedPoints) {
      if (point.type === "ground") {
        context.fillStyle = "rgba(0, 150, 255, 0.6)";
        context.save();
        context.translate(point.x, point.y);
        context.scale(1, 0.5); // Flatten vertically by 2
        context.beginPath();
        context.arc(0, 0, 6, 0, Math.PI * 2);
        context.fill();
        context.restore();
        break;
      }
    }
  }

  drawShadow(context: CanvasRenderingContext2D, shadowProvider: IShadowProvider): void {
    let shadowX = this.position.x;

    // Get the leftmost and rightmost points of the shadow provider (e.g., soft body)
    const leftPoint = shadowProvider.getLeftmostPoint();
    const rightPoint = shadowProvider.getRightmostPoint();

    // Calculate shadow diameter (distance between edge points)
    const shadowDiameter = Math.abs(rightPoint.point.pos.x - leftPoint.point.pos.x);
    const shadowRadius = shadowDiameter / 2;

    // Position shadow between the edge points
    shadowX = (leftPoint.point.pos.x + rightPoint.point.pos.x) / 2;

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

  restoreStamina(): void {
    const newStamina = Math.min(this.maxStamina, this.currentStamina + this.staminaRestoreAmount);
    this.animateStaminaTo(newStamina);
    this.currentStamina = newStamina;
  }

  fullRestoreStamina(): void {
    this.currentStamina = this.maxStamina;
    this.animateStaminaTo(this.maxStamina);
  }

  private animateStaminaTo(targetValue: number): void {
    this.staminaStartValue = this.displayStamina;
    this.staminaTargetValue = targetValue;
    this.staminaAnimationTime = 0;
    this.isAnimatingStamina = true;
  }

  // Inflation methods
  inflateFromEatingMouse(): void {
    if (this.inflationLevel < this.maxInflationLevel) {
      this.inflationLevel = Math.min(this.maxInflationLevel, this.inflationLevel + this.inflationPerMouse);
    }
  }

  setInflationLevel(level: number): void {
    this.inflationLevel = Math.max(0, Math.min(this.maxInflationLevel, level));
  }

  // Handle tap for potential purge (double-tap)
  handleTap(): boolean {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.lastTapTime;

    if (timeSinceLastTap < this.doubleTapDelay) {
      // Double tap detected - purge if at max inflation
      if (this.inflationLevel >= this.maxInflationLevel && !this._isDeflating) {
        this.startDeflation();
        return true; // Purge started
      }
    }

    this.lastTapTime = currentTime;
    return false; // No purge
  }

  private startDeflation(): void {
    this._isDeflating = true;
    this.deflationStartTime = 0;
    this.deflationStartValue = this.inflationLevel;
    this.deflationTargetValue = 0;

    // Activate purge protection window
    this.purgeProtectionTime = this.purgeProtectionDuration;

    // Launch cat in random direction with minimal force (purge effect)
    // Generate random direction
    const randomAngle = Math.random() * Math.PI * 2;
    const purgeForce = 0.05; // Minimal force, much less than normal launch
    const purgeDistance = 80; // Small distance for the purge effect

    // Set velocity without stamina cost
    this.velocity.x = Math.cos(randomAngle) * purgeForce * purgeDistance;
    this.velocity.y = Math.sin(randomAngle) * purgeForce * purgeDistance;
    this.velocityZ = purgeDistance * purgeForce * this.jumpHeightMultiplier * 0.5; // Lower jump

    this.isFlying = true;
    this.bounceCount = 0;

    // Clear trajectory when launching from purge
    if (this.debugTrajectory) {
      this.trajectoryPoints = [];
    }
  }

  getCurrentInflationMultiplier(): number {
    // Calculate current inflation multiplier based on inflation level
    return 1 + (this.inflationLevel / this.maxInflationLevel) * (this.inflationMultiplier - 1);
  }

  get isDeflating(): boolean {
    return this._isDeflating;
  }

  get isProtectedFromPoop(): boolean {
    return this.purgeProtectionTime > 0;
  }

  checkPoopCollision(poopX: number, poopY: number, poopSize: number): boolean {
    // Skip collision if protected
    if (this.isProtectedFromPoop) {
      return false;
    }

    // Calculate collision distance
    const dx = this.position.x - poopX;
    const dy = this.getFloorLevel() - poopY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if collision occurred (cat radius + poop radius)
    const catRadius = 15; // Approximate cat collision radius
    const poopRadius = poopSize * 0.6; // Same as poop visual radius

    if (distance < catRadius + poopRadius) {
      // Collision detected - reduce stamina
      const staminaLoss = 15;
      const newStamina = Math.max(0, this.currentStamina - staminaLoss);
      this.animateStaminaTo(newStamina);
      this.currentStamina = newStamina;

      // Check if game should end after stamina loss
      if (this.currentStamina <= 0) {
        this.shouldTriggerGameOverAfterLanding = true;
      }

      return true;
    }

    return false;
  }

  getInflationStaminaMultiplier(): number {
    // Calculate stamina cost multiplier based on inflation (1.0 = normal, higher = more expensive)
    return 1 + this.inflationLevel * this.inflationStaminaPenalty;
  }

  getInflationJumpMultiplier(): number {
    // Calculate jump distance multiplier based on inflation (1.0 = normal, lower = shorter jumps)
    return Math.max(0.2, 1 - this.inflationLevel * this.inflationJumpPenalty);
  }

  setBaseBodyArea(area: number): void {
    this.baseBodyArea = area;
  }

  getTargetBodyArea(): number {
    if (this.baseBodyArea === 0) return 0;
    return this.baseBodyArea * this.getCurrentInflationMultiplier();
  }
}
