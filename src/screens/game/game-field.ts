import * as dat from "dat.gui";
import { playSound, Sounds } from "../../core/audio/sound";
import { DisplayObject } from "../../core/display";
import { Event, MouseEvent, MouseEventType } from "../../core/event";
import { Point2D } from "../../core/geom";
import { Vector2D } from "../../core/vector2d";
import { Vehicle, VehicleOptions } from "../../core/vehicle";
import { COLOR_BLACK } from "../../registry";
import { Cat } from "./cat";
import { SoftBlob } from "./soft-blob";
import { Tail } from "./tail";

interface VehicleControls {
  vehicleCount: number;
  maxSpeed: number;
  maxForce: number;
  wanderRadius: number;
  wanderDistance: number;
  wanderChange: number;
  separationRadius: number;
  separationWeight: number;
  fleeRadius: number;
  fleeWeight: number;
  catRadius: number;
  gameFieldWidth: number;
  gameFieldHeight: number;
  bufferZone: number;
  boundaryAvoidance: number;
  showDebug: boolean;
  resetVehicles: () => void;
}
export class GameField extends DisplayObject {
  onGameOverCallback?: (miceEaten: number) => void;

  private vehicles: Vehicle[] = [];
  private controls: VehicleControls;

  private cat: Cat;
  private catBody: SoftBlob;
  private catTail: Tail;

  // Camera system
  private camera = { x: 0, y: 0 };
  private gameFieldSize = { width: 1600, height: 1200 }; // 2x screen size

  private curMousePos = { x: 0, y: 0 };
  private isMouseDown = false;

  // Game state
  private miceEaten = 0;
  private isGameOver = false;

  constructor(width: number, height: number) {
    super(width, height);

    // Initialize controls
    this.controls = {
      vehicleCount: 20,
      maxSpeed: 2,
      maxForce: 0.05,
      wanderRadius: 25,
      wanderDistance: 80,
      wanderChange: 0.3,
      separationRadius: 25,
      separationWeight: 1.5,
      fleeRadius: 150,
      fleeWeight: 4.0,
      catRadius: 30,
      gameFieldWidth: 1600,
      gameFieldHeight: 1200,
      bufferZone: 160,
      boundaryAvoidance: 50,
      showDebug: false,
      resetVehicles: () => this.createVehicles(this.controls),
    };
    // Create cat at center of game field
    this.cat = new Cat(
      this.controls.gameFieldWidth / 2,
      this.controls.gameFieldHeight / 2 - 1,
      this.controls.catRadius,
      () => {
        this.isGameOver = true;
        if (this.onGameOverCallback) {
          this.onGameOverCallback(this.miceEaten);
        }
      },
    );
    this.cat.setScreenBounds(this.controls.gameFieldWidth, this.controls.gameFieldHeight);

    // Update game field size
    this.gameFieldSize.width = this.controls.gameFieldWidth;
    this.gameFieldSize.height = this.controls.gameFieldHeight;

    this.catBody = new SoftBlob(this.cat.position.x, this.cat.position.y, 20, 36, 1.5, 12);
    const anchor = Math.random() < 0.5 ? this.catBody.getRightmostPoint() : this.catBody.getLeftmostPoint();
    this.catTail = new Tail(anchor.point, 8, 15, 12);

    // Create initial vehicles
    this.createVehicles(this.controls);
  }

  private createVehicles({
    vehicleCount,
    maxSpeed,
    maxForce,
    wanderRadius,
    wanderDistance,
    wanderChange,
    separationRadius,
    separationWeight,
    fleeRadius,
    fleeWeight,
  }: VehicleControls): void {
    this.vehicles = [];

    for (let i = 0; i < vehicleCount; i++) {
      const x = Math.random() * this.gameFieldSize.width;
      const y = Math.random() * this.gameFieldSize.height;

      const options: VehicleOptions = {
        maxSpeed,
        maxForce,
        size: 8,
        wanderRadius,
        wanderDistance,
        wanderChange,
        separationRadius,
        separationWeight,
        fleeRadius,
        fleeWeight,
        strokeColor: COLOR_BLACK,
        strokeWidth: 3,
      };

      this.vehicles.push(new Vehicle(x, y, options));
    }
  }

  private updateVehicleProperties(): void {
    this.vehicles.forEach((vehicle) => {
      vehicle.maxSpeed = this.controls.maxSpeed;
      vehicle.maxForce = this.controls.maxForce;
      vehicle.wanderRadius = this.controls.wanderRadius;
      vehicle.wanderDistance = this.controls.wanderDistance;
      vehicle.wanderChange = this.controls.wanderChange;
      vehicle.separationRadius = this.controls.separationRadius;
      vehicle.separationWeight = this.controls.separationWeight;
      vehicle.fleeRadius = this.controls.fleeRadius;
      vehicle.fleeWeight = this.controls.fleeWeight;
    });
  }

  private updateCatProperties(): void {
    this.cat.radius = this.controls.catRadius;
  }

  private updateGameField(): void {
    this.gameFieldSize.width = this.controls.gameFieldWidth;
    this.gameFieldSize.height = this.controls.gameFieldHeight;
    this.cat.setScreenBounds(this.controls.gameFieldWidth, this.controls.gameFieldHeight);
  }

  private constrainCatHeadToSoftBody(): void {
    // Quick distance check using squared distance to avoid sqrt
    const bodyCenter = this.catBody.getCenterOfMass();
    const deltaX = this.cat.position.x - bodyCenter.x;
    const deltaY = this.cat.position.y - bodyCenter.y;
    const maxDistance = this.cat.radius * 2;

    // Use squared distance comparison to avoid expensive sqrt
    if (deltaX * deltaX + deltaY * deltaY > maxDistance * maxDistance) {
      const catMovementX = this.cat.velocity.x;
      const catMovementY = this.cat.velocity.y;

      // Move all soft body points by cat movement in single loop
      for (const point of this.catBody.points) {
        point.pos.x += catMovementX;
        point.pos.y += catMovementY;
        point.prevPos.x += catMovementX;
        point.prevPos.y += catMovementY;
      }
    }
  }

  private updateCamera(): void {
    this.camera.x = this.cat.position.x - c.width / 2;
    this.camera.y = this.cat.position.y - c.height / 2;

    // Calculate camera bounds including buffer zone
    const minCameraX = -this.controls.bufferZone;
    const maxCameraX = this.gameFieldSize.width + this.controls.bufferZone - c.width;
    const minCameraY = -this.controls.bufferZone;
    const maxCameraY = this.gameFieldSize.height + this.controls.bufferZone - c.height;

    // Clamp camera to extended bounds (game field + buffer zone)
    this.camera.x = Math.max(minCameraX, Math.min(maxCameraX, this.camera.x));
    this.camera.y = Math.max(minCameraY, Math.min(maxCameraY, this.camera.y));
  }

  private worldPos: Vector2D = new Vector2D(0, 0);

  private screenToWorld(x: number, y: number) {
    return this.worldPos.set(x + this.camera.x, y + this.camera.y);
  }

  // Check if a world position is visible in the current camera viewport
  private isPositionVisible(worldPos: Point2D): boolean {
    return (
      worldPos.x >= this.camera.x &&
      worldPos.x <= this.camera.x + c.width &&
      worldPos.y >= this.camera.y &&
      worldPos.y <= this.camera.y + c.height
    );
  }

  // Check if a circular object is visible in the current camera viewport with margin
  private isCircleVisible(worldPos: Point2D, radius: number, margin: number = 50): boolean {
    const { x, y } = this.camera;
    return (
      worldPos.x + radius >= x - margin &&
      worldPos.x - radius <= x + c.width + margin &&
      worldPos.y + radius >= y - margin &&
      worldPos.y - radius <= y + c.height + margin
    );
  }

  // Calculate screen edge position for off-screen indicator
  private getScreenEdgePosition(worldX: number, worldY: number): { x: number; y: number } {
    const screenCenterX = c.width / 2;
    const screenCenterY = c.height / 2;

    // Convert world position to relative screen position
    const relativeX = worldX - (this.camera.x + screenCenterX);
    const relativeY = worldY - (this.camera.y + screenCenterY);

    // Calculate angle from screen center to target
    const angle = Math.atan2(relativeY, relativeX);

    // Calculate intersection with screen edges
    const margin = 20; // Distance from screen edge
    let edgeX: number, edgeY: number;

    // Determine which edge to use based on angle
    const absAngle = Math.abs(angle);
    const halfWidth = c.width / 2 - margin;
    const halfHeight = c.height / 2 - margin;

    if (absAngle <= Math.atan2(halfHeight, halfWidth)) {
      // Right or left edge
      if (relativeX > 0) {
        // Right edge
        edgeX = c.width - margin;
        edgeY = screenCenterY + halfWidth * Math.tan(angle);
      } else {
        // Left edge
        edgeX = margin;
        edgeY = screenCenterY - halfWidth * Math.tan(angle);
      }
    } else {
      // Top or bottom edge
      if (relativeY > 0) {
        // Bottom edge
        edgeX = screenCenterX + halfHeight / Math.tan(angle);
        edgeY = c.height - margin;
      } else {
        // Top edge
        edgeX = screenCenterX - halfHeight / Math.tan(angle);
        edgeY = margin;
      }
    }

    return { x: edgeX, y: edgeY };
  }

  setupGUI(folder: dat.GUI): void {
    if (import.meta.env.PROD) return;

    const miceFolder = folder.addFolder("Mice");

    const vehicleFolder = miceFolder.addFolder("Vehicles");
    vehicleFolder.add(this.controls, "vehicleCount", 1, 100, 1).onChange(() => this.createVehicles(this.controls));
    vehicleFolder.add(this.controls, "maxSpeed", 0.1, 10, 0.1).onChange(() => this.updateVehicleProperties());
    vehicleFolder.add(this.controls, "maxForce", 0.01, 1, 0.01).onChange(() => this.updateVehicleProperties());

    const wanderFolder = miceFolder.addFolder("Wandering");
    wanderFolder.add(this.controls, "wanderRadius", 5, 100, 1).onChange(() => this.updateVehicleProperties());
    wanderFolder.add(this.controls, "wanderDistance", 10, 200, 1).onChange(() => this.updateVehicleProperties());
    wanderFolder.add(this.controls, "wanderChange", 0.01, 1, 0.01).onChange(() => this.updateVehicleProperties());

    const separationFolder = miceFolder.addFolder("Separation");
    separationFolder.add(this.controls, "separationRadius", 10, 100, 1).onChange(() => this.updateVehicleProperties());
    separationFolder.add(this.controls, "separationWeight", 0, 5, 0.1).onChange(() => this.updateVehicleProperties());

    const fleeFolder = miceFolder.addFolder("Flee from Cat");
    fleeFolder.add(this.controls, "fleeRadius", 50, 300, 10).onChange(() => this.updateVehicleProperties());
    fleeFolder.add(this.controls, "fleeWeight", 0, 10, 0.1).onChange(() => this.updateVehicleProperties());

    const boundaryFolder = miceFolder.addFolder("Boundary Avoidance");
    boundaryFolder.add(this.controls, "boundaryAvoidance", 0, 150, 5);

    const catFolder = folder.addFolder("Cat");
    catFolder.add(this.controls, "catRadius", 10, 100, 1).onChange(() => this.updateCatProperties());
    catFolder.add(this.cat, "catHeight", 10, 200, 1);
    catFolder.add(this.cat, "debugDraw");

    const physicsFolder = catFolder.addFolder("Physics");
    physicsFolder.add(this.cat, "mass", 0.1, 5.0, 0.1);
    physicsFolder.add(this.cat, "gravity", 0.1, 2.0, 0.1);
    physicsFolder.add(this.cat, "launchPower", 0.01, 0.2, 0.005);
    physicsFolder.add(this.cat, "maxLaunchPower", 0.05, 0.5, 0.005);
    physicsFolder.add(this.cat, "maxDragDistance", 50, 400, 10);
    physicsFolder.add(this.cat, "jumpHeightMultiplier", 0.1, 3.0, 0.1).name("Jump Height");
    physicsFolder.add(this.cat, "bounceDamping", 0.1, 1.0, 0.1);
    physicsFolder.add(this.cat, "maxBounces", 0, 10, 1);

    const staminaFolder = catFolder.addFolder("Stamina");
    staminaFolder.add(this.cat, "maxStamina", 50, 200, 10);
    staminaFolder.add(this.cat, "currentStamina", 0, 200, 1);
    staminaFolder.add(this.cat, "staminaCostMultiplier", 0.1, 1.0, 0.05).name("Cost Multiplier");
    staminaFolder.add(this.cat, "staminaRestoreAmount", 5, 50, 5).name("Restore Amount");

    const gameFieldFolder = folder.addFolder("Game Field");
    gameFieldFolder.add(this.controls, "gameFieldWidth", 800, 3200, 100).onChange(() => this.updateGameField());
    gameFieldFolder.add(this.controls, "gameFieldHeight", 600, 2400, 100).onChange(() => this.updateGameField());

    const debugFolder = folder.addFolder("Debug");
    debugFolder.add(this.controls, "showDebug");
    debugFolder.add(this.cat, "debugTrajectory").name("Show Cat Trajectory");
    debugFolder.add(this.cat, "predictiveSteps", 50, 300, 10).name("Prediction Steps");
    debugFolder.add(this.cat, "predictiveStepSize", 0.1, 2.0, 0.1).name("Prediction Accuracy");
    debugFolder.add(this.controls, "resetVehicles");

    // vehicleFolder.open();
    // wanderFolder.open();
    // separationFolder.open();
    // fleeFolder.open();
    // boundaryFolder.open();
    // catFolder.open();
    // physicsFolder.open();
    // gameFieldFolder.open();
    // debugFolder.open();
  }

  tick(dt: number): void {
    // Skip game logic if game is over
    if (this.isGameOver) {
      return;
    }

    // Update cat physics
    this.cat.tick(dt);

    // Update camera to follow cat
    this.updateCamera();

    const groundLevel = Math.min(this.cat.position.y + this.cat.catHeight, this.gameFieldSize.height);
    this.catBody.tick(this.cat.getCollider(), this.gameFieldSize.width, groundLevel);

    // Constrain cat head to stay inside soft body
    this.constrainCatHeadToSoftBody();

    this.catTail.stickTo(this.catBody);
    this.catTail.tick();

    // Update vehicles with separation and flee behaviors (fleeing from cat)
    this.vehicles.forEach((vehicle) => {
      vehicle.applyBehaviors(
        this.vehicles,
        this.cat.position,
        this.gameFieldSize.width,
        this.gameFieldSize.height,
        this.controls.boundaryAvoidance,
      );
      vehicle.tick();
      // Use game field borders for vehicle boundary constraints
      vehicle.borders(this.gameFieldSize.width, this.gameFieldSize.height);
    });

    // Check for collisions between cat and mice - only when cat is on ground
    if (this.cat.z <= 5) {
      // Iterate backwards through mice array
      for (let i = this.vehicles.length - 1; i >= 0; i--) {
        const mouse = this.vehicles[i];
        if (this.cat.checkCollisionWithPoint(mouse.position.x, mouse.position.y, mouse.size)) {
          playSound(Sounds.Smacking);
          this.vehicles.splice(i, 1);
          this.miceEaten++;
          this.cat.restoreStamina();
        }
      }
    }
  }

  render(context: CanvasRenderingContext2D): void {
    // Apply camera transform
    context.save();
    context.translate(-this.camera.x, -this.camera.y);

    // Draw buffer zone background (darker to show it's outside the play area)
    const bufferSize = this.controls.bufferZone;
    context.fillStyle = "#e0e0e0";
    context.fillRect(
      -bufferSize,
      -bufferSize,
      this.gameFieldSize.width + bufferSize * 2,
      this.gameFieldSize.height + bufferSize * 2,
    );

    // Draw game field background
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, this.gameFieldSize.width, this.gameFieldSize.height);

    // Draw game field borders (main play area)
    context.strokeStyle = "#333333";
    context.lineWidth = 4;
    context.strokeRect(0, 0, this.gameFieldSize.width, this.gameFieldSize.height);

    // Draw all vehicle shadows first (behind everything)
    this.vehicles.forEach((vehicle) => {
      if (this.isCircleVisible(vehicle.position, vehicle.size * 2)) {
        vehicle.drawShadow(context);
      }
    });

    if (this.cat.isDragging) {
      // Draw predictive trajectory first (behind slingshot line)
      this.drawSlingshotPreview(context);
    }

    this.cat.drawShadow(context, this.catBody);

    // Draw all vehicles (only render visible ones)
    this.vehicles.forEach((vehicle) => {
      if (this.isCircleVisible(vehicle.position, vehicle.size * 2)) {
        vehicle.render(context);
        if (this.controls.showDebug) {
          vehicle.drawWanderDebug(context);
          vehicle.drawFleeDebug(context, this.cat.position);
        }
      }
    });

    this.catBody.render(context);
    this.catTail.render(context);

    // Draw the cat
    this.cat.render(context);

    // Draw cat collision debug
    this.cat.renderCollisionDebug(context);

    // Draw trajectory before cat for better visibility
    this.cat.renderTrajectory(context);

    // Draw slingshot trajectory preview if dragging
    if (this.cat.isDragging) {
      // Draw predictive trajectory first (behind slingshot line)
      this.cat.drawPredictiveTrajectory(context, this.curMousePos.x, this.curMousePos.y);
    }

    // Restore camera transform
    context.restore();

    // Draw off-screen vehicle indicators
    this.drawOffScreenIndicators(context);

    // Draw mice counter (always visible)
    context.fillStyle = "#333333";
    context.font = "bold 24px Arial";
    context.textAlign = "center";
    const miceText = `Mice: ${this.vehicles.length}`;
    context.fillText(miceText, c.width / 2, 35);
    context.textAlign = "left"; // Reset text alignment

    // Draw stamina bar
    this.drawStaminaBar(context);

    if (import.meta.env.PROD) return;

    // Draw UI elements (not affected by camera)
    context.fillStyle = "#666666";
    context.font = "14px Arial";

    let lineY = 5;
    context.fillText(`Window size: ${window.innerWidth} x ${window.innerHeight}`, 10, (lineY += 20));
    context.fillText(`Screen size: ${c.width} x ${c.height}`, 10, (lineY += 20));
    context.fillText(
      `Cat Pos: (${this.cat.position.x.toFixed(0)}, ${this.cat.position.y.toFixed(0)}, ${this.cat.z.toFixed(0)})`,
      10,
      (lineY += 20),
    );
  }

  private isAnyVehicleVisible(): boolean {
    for (const vehicle of this.vehicles) {
      if (this.isPositionVisible(vehicle.position)) {
        return true;
      }
    }
    return false;
  }

  private drawOffScreenIndicators(context: CanvasRenderingContext2D): void {
    if (this.isAnyVehicleVisible()) return;

    // Get all off-screen vehicles with their distances to cat
    const offScreenVehicles = this.vehicles
      .filter((vehicle) => !this.isPositionVisible(vehicle.position))
      .map((vehicle) => ({
        vehicle,
        distance: Vector2D.dist(vehicle.position, this.cat.position),
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
      .slice(0, 5); // Show only the 5 nearest off-screen mice

    // Draw indicators for nearest off-screen vehicles
    offScreenVehicles.forEach(({ vehicle }) => {
      const edgePos = this.getScreenEdgePosition(vehicle.position.x, vehicle.position.y);

      // Calculate direction angle for triangle orientation
      const screenCenterX = c.width / 2;
      const screenCenterY = c.height / 2;
      const relativeX = vehicle.position.x - (this.camera.x + screenCenterX);
      const relativeY = vehicle.position.y - (this.camera.y + screenCenterY);
      const angle = Math.atan2(relativeY, relativeX);

      // Draw simple red filled triangle
      const triangleSize = 8;

      context.fillStyle = "#ff0000";
      context.save();
      context.translate(edgePos.x, edgePos.y);
      context.rotate(angle);

      context.beginPath();
      context.moveTo(triangleSize, 0);
      context.lineTo(-triangleSize, -triangleSize);
      context.lineTo(-triangleSize, triangleSize);
      context.closePath();
      context.fill();

      context.restore();
    });
  }

  private drawStaminaBar(context: CanvasRenderingContext2D): void {
    const barWidth = c.width - 40; // 20px margin on each side
    const barHeight = 30;
    const barX = 20;
    const barY = c.height - barHeight - 20; // 20px from bottom

    // Calculate stamina percentage using display stamina for smooth animation
    const staminaPercentage = this.cat.displayStamina / this.cat.maxStamina;

    // Draw background (empty bar)
    context.fillStyle = "#333333";
    context.fillRect(barX, barY, barWidth, barHeight);

    // Draw filled portion with smooth color interpolation
    if (staminaPercentage > 0) {
      const fillWidth = barWidth * staminaPercentage;

      // Interpolate color from green to red based on stamina percentage
      const red = Math.round(255 * (1 - staminaPercentage));
      const green = Math.round(255 * staminaPercentage);
      const blue = 0;

      const fillColor = `rgb(${red}, ${green}, ${blue})`;

      context.fillStyle = fillColor;
      context.fillRect(barX, barY, fillWidth, barHeight);
    }

    // Draw label (aligned to left edge of bar)
    context.fillStyle = "#000000";
    context.font = "bold 16px Arial";
    context.textAlign = "left";
    context.fillText("Stamina", barX, barY - 5);
  }

  private drawSlingshotPreview(context: CanvasRenderingContext2D): void {
    // Get cat collision center
    const centerX = this.cat.position.x;
    const centerY = this.cat.position.y + this.cat.catHeight + this.cat.z;

    const dragX = this.curMousePos.x;
    const dragY = this.curMousePos.y;

    // Calculate drag vector and distance
    const dragVectorX = dragX - centerX;
    const dragVectorY = dragY - centerY;
    const dragDistance = Math.sqrt(dragVectorX * dragVectorX + dragVectorY * dragVectorY);
    const maxDragDistance = this.cat.maxDragDistance;

    // Calculate visual drag position (limited to max distance)
    let visualDragX = dragX;
    let visualDragY = dragY;

    if (dragDistance > maxDragDistance) {
      const scale = maxDragDistance / dragDistance;
      visualDragX = centerX + dragVectorX * scale;
      visualDragY = centerY + dragVectorY * scale;
    }

    // Calculate power ratio for color intensity
    const powerRatio = Math.min(dragDistance / maxDragDistance, 1.0);

    // Calculate cone parameters
    const coneLength = Math.min(dragDistance, maxDragDistance);
    const coneAngle = Math.atan2(visualDragY - centerY, visualDragX - centerX);
    const minConeWidth = 8; // Minimum width when no power
    const maxConeWidth = 40; // Maximum width at full power
    const coneWidth = minConeWidth + (maxConeWidth - minConeWidth) * powerRatio;

    // Draw cone with gradient
    if (coneLength > 10) {
      // Only draw if drag distance is meaningful
      // Create gradient from transparent at center to blue at edge (same color as trajectory)
      const gradient = context.createLinearGradient(centerX, centerY, visualDragX, visualDragY);

      // Use same color as predictive trajectory: blue (0, 150, 255)
      const red = 0;
      const green = 150;
      const blue = 255;

      // Start transparent, end with color based on power
      const alpha = powerRatio * 0.6; // Max alpha of 0.6
      gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0)`); // Transparent at cat
      gradient.addColorStop(0.3, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.3})`); // Mid color
      gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${alpha})`); // Full color at cursor

      // Calculate cone vertices
      const perpX = Math.cos(coneAngle + Math.PI / 2);
      const perpY = Math.sin(coneAngle + Math.PI / 2);

      const halfWidth = coneWidth / 2;

      // Cone vertices
      const vertex1X = centerX;
      const vertex1Y = centerY;
      const vertex2X = visualDragX + perpX * halfWidth;
      const vertex2Y = visualDragY + perpY * halfWidth;
      const vertex3X = visualDragX - perpX * halfWidth;
      const vertex3Y = visualDragY - perpY * halfWidth;

      // Draw cone
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(vertex1X, vertex1Y);
      context.lineTo(vertex2X, vertex2Y);
      context.lineTo(vertex3X, vertex3Y);
      context.closePath();
      context.fill();
    }

    // Draw rounded end of cone
    if (coneLength > 10) {
      // Use same color as predictive trajectory: blue (0, 150, 255)
      const red = 0;
      const green = 150;
      const blue = 255;
      const alpha = powerRatio * 0.6; // Same alpha as cone edge

      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

      // Calculate the angle perpendicular to cone direction (pointing away from cat)
      const outwardAngle = coneAngle;
      const startAngle = outwardAngle - Math.PI / 2;
      const endAngle = outwardAngle + Math.PI / 2;

      context.beginPath();
      context.arc(visualDragX, visualDragY, coneWidth / 2, startAngle, endAngle, false);
      context.fill();
    }
  }

  protected handleEvent(event: Event): void {
    // Skip handling events if game is over
    if (this.isGameOver) {
      return;
    }

    if (event instanceof MouseEvent) {
      switch (event.type) {
        case MouseEventType.MOUSE_MOVE:
          this.onMouseMove(event.mouseX, event.mouseY);
          break;

        case MouseEventType.MOUSE_DOWN:
          this.onMouseDown(event.mouseX, event.mouseY);
          break;

        case MouseEventType.MOUSE_UP:
        case MouseEventType.MOUSE_LEAVE:
          this.onMouseUp(event.mouseX, event.mouseY);
          break;
      }
    }
  }

  private onMouseDown(x: number, y: number): void {
    const worldPos = this.screenToWorld(x, y);
    if (this.cat.isPressed(worldPos)) {
      this.isMouseDown = true;
      // TODO: pass worldPos
      this.cat.startDrag(worldPos.x, worldPos.y);
    }
  }

  private onMouseUp(x: number, y: number): void {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.cat.isDragging) {
        playSound(Sounds.ReleaseWobble);
        const worldPos = this.screenToWorld(x, y);
        this.cat.launch(worldPos.x, worldPos.y);
      }
    }
  }

  private onMouseMove(x: number, y: number): void {
    const worldPos = this.screenToWorld(x, y);

    // Update current mouse position for slingshot preview (in world coordinates)
    this.curMousePos.x = worldPos.x;
    this.curMousePos.y = worldPos.y;

    // Update drag if dragging
    if (this.isMouseDown && this.cat.isDragging) {
      this.cat.updateDrag(worldPos.x, worldPos.y);
    }
  }
}
