import { playSound, Sound } from "../../core/audio/sound";
import { ICollidable, IRenderable, ITickable } from "../../core/display";
import { Point2D } from "../../core/geom";
import { signal } from "../../core/signal";
import { easeInOut } from "../../core/tween";
import { vecDist, vecMult, vecSub, Vector2D } from "../../core/vector2d";
import { Color, rgba, wrapContext } from "../../registry";
import { abs, cos, max, min, random, sin, TWO_PI } from "../../system";
import { drawHead, EarData, EyeData } from "./cat-head";
import { CatShadow } from "./cat-shadow";
import { SoftBlob } from "./soft-blob";
import { Tail } from "./tail";
export class Cat implements ITickable, IRenderable {
  readonly staminaEmptySignal = signal<boolean>(false);

  position: Vector2D;
  strokeWidth: number = 3;
  speed: number = 3;
  debugDraw: boolean = false;

  earData: EarData = {
    angle: 60, // Angle between ears in degrees
    width: 20, // Width of ear foundation
    height: 30, // Height of ears
    offsetY: 0, // Additional Y offset for ears relative to head
  };

  eyeData: EyeData = {
    radius: 0.18, // Eye size relative to body radius
    offsetX: 0.35, // Horizontal eye distance from center (relative to radius)
    offsetY: 0.2, // Vertical eye offset (relative to radius)
    pupilWidth: 0.3, // Pupil width relative to eye radius
    pupilHeight: 1.2, // Pupil height relative to eye radius
  };

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
  private lastClickTime = 0;
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
  public headOffsetY = 0; // Current head vertical offset during drag
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

  readonly shadow: CatShadow;
  readonly body: SoftBlob;
  private tail: Tail;

  curMousePos: Point2D = {
    x: 0,
    y: 0,
  };

  constructor(
    public radius: number,
    public screenWidth: number,
    public screenHeight: number,
    posX: number = screenWidth / 2,
    posY: number = screenHeight / 2 - 1,
  ) {
    this.position = new Vector2D(posX, posY);
    this.velocity = new Vector2D(0, 0);
    this.dragStartPos = new Vector2D(posX, posY);
    this.groundLevel = posY;

    this.body = new SoftBlob(posX, posY, 20, 36, 1.5, 12);
    this.baseBodyArea = this.body.getBaseArea();

    const anchor = random() < 0.5 ? this.body.getRightmostPoint() : this.body.getLeftmostPoint();
    this.tail = new Tail(anchor.point, 8, 15, 12);

    this.shadow = new CatShadow(this);
  }

  getFloorLevel(): number {
    return this.position.y + this.catHeight + this.z;
  }

  render(context: CanvasRenderingContext2D): void {
    this.shadow.render(context);
    this.body.render(context);
    this.tail.render(context);

    drawHead(
      context,
      this.strokeWidth,
      this.position.x + this.headOscillationX,
      this.position.y - this.z + this.headOffsetY,
      this.radius,
      this.earData,
      this.eyeData,
      this.debugDraw,
    );

    if (this.isDragging) {
      const predictedPoints = this.calculatePredictiveTrajectory(this.curMousePos);
      if (predictedPoints.length > 2) {
        // Draw predicted trajectory line
        context.strokeStyle = rgba(Color.SkyBlue, 0.6);
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
            context.fillStyle = rgba(Color.SkyBlue, 0.6);
            wrapContext(context, () => {
              context.translate(point.x, point.y);
              context.scale(1, 0.5); // Flatten vertically by 2
              context.beginPath();
              context.arc(0, 0, 6, 0, TWO_PI);
              context.fill();
            });
            break;
          }
        }
      }
    }
  }

  startDrag(x: number, y: number): void {
    if (!this.isFlying) {
      playSound(Sound.Stretching);
      this.isDragging = true;
      this.dragStartPos.set(x, y);
      this.headOffsetY = 0; // Reset head position when starting drag
      this.headOscillationX = 0; // Reset horizontal oscillation
      this.oscillationTime = 0; // Reset oscillation timer
    }
  }

  updateDrag(x: number, y: number): void {
    if (this.isDragging && !this.isFlying) {
      // Calculate drag distance for head lowering
      const dragVector = vecSub(new Vector2D(x, y), this.dragStartPos);
      const dragDistance = dragVector.mag();

      // Calculate maximum head offset (distance from head bottom to shadow top)
      const shadowY = this.position.y + this.catHeight + this.z;
      const headBottomY = this.position.y + this.radius - this.z;
      this.maxHeadOffset = max(0, shadowY - headBottomY);

      // Calculate head offset based on drag distance (normalized to maxDragDistance)
      const dragRatio = min(dragDistance / this.maxDragDistance, 1);
      this.headOffsetY = dragRatio * this.maxHeadOffset;
    }
  }

  launch(x: number, y: number): void {
    if (this.isDragging && !this.isFlying && this.currentStamina > 0) {
      this.isDragging = false;
      this.headOffsetY = 0; // Reset head position
      this.headOscillationX = 0; // Reset horizontal oscillation
      this.oscillationTime = 0; // Reset oscillation timer

      // Calculate launch vector (opposite direction of drag)
      const rawDragVector = vecSub(this.dragStartPos, new Vector2D(x, y));
      const dragMagnitude = rawDragVector.mag();

      // Calculate stamina cost based on jump distance and inflation penalty
      const baseStaminaCost = dragMagnitude * this.staminaCostMultiplier;
      const inflationStaminaMultiplier = this.getInflationStaminaMultiplier();
      const staminaCost = min(baseStaminaCost * inflationStaminaMultiplier, this.currentStamina);
      const newStamina = max(0, this.currentStamina - staminaCost);

      // Start stamina animation
      this.animateStaminaTo(newStamina);
      this.currentStamina = newStamina;

      // Check if game should end after landing
      if (this.currentStamina <= 0) {
        this.shouldTriggerGameOverAfterLanding = true;
      }

      // Apply magnitude limit and power constraints in one step
      const effectiveMagnitude = min(dragMagnitude, this.maxDragDistance);
      const effectivePower = min(this.launchPower, this.maxLaunchPower);
      const powerScale = (effectivePower / this.mass) * (effectiveMagnitude / max(dragMagnitude, 1));

      // Apply inflation penalty to jump distance
      const inflationJumpMultiplier = this.getInflationJumpMultiplier();

      // Set velocity directly without creating intermediate vectors
      this.velocity = vecMult(rawDragVector, powerScale * inflationJumpMultiplier);
      this.velocityZ = effectiveMagnitude * effectivePower * this.jumpHeightMultiplier * inflationJumpMultiplier;

      this.isFlying = true;
      this.bounceCount = 0;
    }
  }

  tick(dt: number): void {
    // Update stamina animation
    if (this.isAnimatingStamina) {
      this.staminaAnimationTime += dt;
      const progress = min(this.staminaAnimationTime / this.staminaAnimationDuration, 1);
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
      const progress = min(this.deflationStartTime / this.deflationDuration, 1);
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
      const oscillationIntensity = this.headOffsetY / max(this.maxHeadOffset, 1);

      // Calculate horizontal oscillation using sine wave
      this.headOscillationX =
        sin(this.oscillationTime * this.oscillationFrequency * 0.001 * TWO_PI) *
        this.oscillationAmplitude *
        oscillationIntensity;
    }

    if (this.isFlying) {
      // Apply physics
      this.position.add(this.velocity);
      this.z += this.velocityZ;

      // Apply gravity to Z velocity
      this.velocityZ -= this.gravity;

      // Apply smooth boundary damping instead of hard bounces
      this.applySmoothBoundaryDamping();

      // Check ground collision
      if (this.z <= 0) {
        this.z = 0;

        if (this.bounceCount < this.maxBounces && abs(this.velocityZ) > 0.5) {
          playSound(Sound.Landing);
          // Bounce
          this.velocityZ = -this.velocityZ * this.bounceDamping;
          this.velocity.mult(this.bounceDamping); // Reduce horizontal velocity on bounce
          this.bounceCount++;
        } else {
          // Stop flying
          this.isFlying = false;
          this.velocity.mult(0);
          this.velocityZ = 0;

          // Check if game should end after landing
          if (this.shouldTriggerGameOverAfterLanding) {
            this.shouldTriggerGameOverAfterLanding = false;
            this.staminaEmptySignal.set(true);
          }
        }
      }
    }

    const groundLevel = min(this.position.y + this.catHeight, this.screenHeight);

    // Update soft body area based on cat's inflation level
    const targetArea = this.getTargetBodyArea();
    if (targetArea > 0) {
      this.body.setTargetArea(targetArea);
    }

    this.body.tick(
      {
        position: { x: this.position.x, y: this.position.y - this.z },
        radius: this.radius,
      },
      this.screenWidth,
      groundLevel,
    );

    // Constrain cat head to stay inside soft body
    // Quick distance check using squared distance to avoid sqrt
    const bodyCenter = this.body.getCenterOfMass();
    const deltaX = this.position.x - bodyCenter.x;
    const deltaY = this.position.y - bodyCenter.y;
    const maxDistance = this.radius * 2;

    // Use squared distance comparison to avoid expensive sqrt
    if (deltaX * deltaX + deltaY * deltaY > maxDistance * maxDistance) {
      const catMovementX = this.velocity.x;
      const catMovementY = this.velocity.y;

      // Move all soft body points by cat movement in single loop
      for (const point of this.body.points) {
        point.pos.x += catMovementX;
        point.pos.y += catMovementY;
        point.prevPos.x += catMovementX;
        point.prevPos.y += catMovementY;
      }
    }

    this.tail.stickTo(this.body);
    this.tail.tick();
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
    if (distance <= 0) return [minBound, max(0, velocity)];
    if (distance <= dampingZone && velocity < 0) {
      return [position, velocity * (dampingStrength + dampingRange * (distance / dampingZone))];
    }

    const distanceFromMax = maxBound - position;
    if (distanceFromMax <= 0) return [maxBound, min(0, velocity)];
    if (distanceFromMax <= dampingZone && velocity > 0) {
      return [position, velocity * (dampingStrength + dampingRange * (distanceFromMax / dampingZone))];
    }

    return [position, velocity];
  }

  isPressed(v: Vector2D): boolean {
    return vecDist(this.position, v) <= this.radius * 2;
  }

  calculatePredictiveTrajectory(
    launchPos: Point2D,
  ): Array<{ x: number; y: number; z: number; type: "normal" | "bounce" | "ground" }> {
    // Calculate initial velocity based on launch parameters
    const rawDragVector = vecSub(this.dragStartPos, new Vector2D(launchPos.x, launchPos.y));
    const dragMagnitude = rawDragVector.mag();
    const effectiveMagnitude = min(dragMagnitude, this.maxDragDistance);
    const effectivePower = min(this.launchPower, this.maxLaunchPower);
    const powerScale = (effectivePower / this.mass) * (effectiveMagnitude / max(dragMagnitude, 1));

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

  restoreStaminaAndInflateFromEatingMouse(): void {
    const newStamina = min(this.maxStamina, this.currentStamina + this.staminaRestoreAmount);
    this.animateStaminaTo(newStamina);
    this.currentStamina = newStamina;

    if (this.inflationLevel < this.maxInflationLevel) {
      this.inflationLevel = min(this.maxInflationLevel, this.inflationLevel + this.inflationPerMouse);
    }
  }

  restoreFullStamina(): void {
    this.currentStamina = this.maxStamina;
    this.animateStaminaTo(this.maxStamina);
  }

  private animateStaminaTo(targetValue: number): void {
    this.staminaStartValue = this.displayStamina;
    this.staminaTargetValue = targetValue;
    this.staminaAnimationTime = 0;
    this.isAnimatingStamina = true;
  }

  setInflationLevel(level: number): void {
    this.inflationLevel = max(0, min(this.maxInflationLevel, level));
  }

  captureDoubleClick(): boolean {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.lastClickTime;
    if (timeSinceLastClick < this.doubleTapDelay) {
      return true;
    }
    this.lastClickTime = currentTime;
    return false;
  }

  get isFullyInflated(): boolean {
    return this.inflationLevel >= this.maxInflationLevel && !this._isDeflating;
  }

  startDeflation(): void {
    this._isDeflating = true;
    this.deflationStartTime = 0;
    this.deflationStartValue = this.inflationLevel;
    this.deflationTargetValue = 0;

    // Activate purge protection window
    this.purgeProtectionTime = this.purgeProtectionDuration;

    // Launch cat in random direction with minimal force (purge effect)
    // Generate random direction
    const randomAngle = random() * TWO_PI;
    const purgeForce = 0.05; // Minimal force, much less than normal launch
    const purgeDistance = 80; // Small distance for the purge effect

    // Set velocity without stamina cost
    this.velocity.x = cos(randomAngle) * purgeForce * purgeDistance;
    this.velocity.y = sin(randomAngle) * purgeForce * purgeDistance;
    this.velocityZ = purgeDistance * purgeForce * this.jumpHeightMultiplier * 0.5; // Lower jump

    this.isFlying = true;
    this.bounceCount = 0;
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

  collidesWith(collidable: ICollidable): boolean {
    const catHeadTopY = this.position.y - this.radius;
    const catShadowCenterY = (this.position.y + this.catHeight + this.z) * 1.02;

    const catCenterX = this.position.x;
    const catCenterY = (catHeadTopY + catShadowCenterY) / 2;
    const catRadius = abs(catShadowCenterY - catHeadTopY) / 2;

    const dx = collidable.position.x - catCenterX;
    const dy = collidable.position.y - catCenterY;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = catRadius + collidable.size;

    return distanceSquared <= radiusSum * radiusSum;
  }

  reduceStamina(): void {
    const newStamina = max(0, this.currentStamina - 15);
    this.animateStaminaTo(newStamina);
    this.currentStamina = newStamina;

    // Check if game should end after stamina loss
    if (this.currentStamina <= 0) {
      this.shouldTriggerGameOverAfterLanding = true;
    }
  }

  getInflationStaminaMultiplier(): number {
    // Calculate stamina cost multiplier based on inflation (1.0 = normal, higher = more expensive)
    return 1 + this.inflationLevel * this.inflationStaminaPenalty;
  }

  getInflationJumpMultiplier(): number {
    // Calculate jump distance multiplier based on inflation (1.0 = normal, lower = shorter jumps)
    return max(0.2, 1 - this.inflationLevel * this.inflationJumpPenalty);
  }

  getTargetBodyArea(): number {
    if (this.baseBodyArea === 0) return 0;
    return this.baseBodyArea * this.getCurrentInflationMultiplier();
  }
}
