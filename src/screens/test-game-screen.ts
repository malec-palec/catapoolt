import * as dat from "dat.gui";
import { BaseScreen } from "../base-screen";
import { Vector2D } from "../core/vector2d";
import { Vehicle, VehicleOptions } from "../core/vehicle";
import { IGame } from "../game";
import { COLOR_BLACK, COLOR_WHITE } from "../registry";
import { Cat } from "./game/cat";
import { SoftBlob } from "./game/soft-blob";
import { Tail } from "./game/tail";

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

export class TestGameScreen extends BaseScreen {
  private vehicles: Vehicle[] = [];
  private controls: VehicleControls;
  private gui: dat.GUI;
  private cat: Cat;

  private catBody: SoftBlob;
  catTail: Tail;

  // Camera system
  private camera = { x: 0, y: 0 };
  private gameField = { width: 1600, height: 1200 }; // 2x screen size

  constructor(game: IGame) {
    super(game);

    this.bgColor = COLOR_WHITE;

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
      resetVehicles: () => this.createVehicles(),
    };

    // Create cat at center of game field
    this.cat = new Cat(
      this.controls.gameFieldWidth / 2,
      this.controls.gameFieldHeight / 2 - 1,
      this.controls.catRadius,
    );
    this.cat.setScreenBounds(this.controls.gameFieldWidth, this.controls.gameFieldHeight);

    // Update game field size
    this.gameField.width = this.controls.gameFieldWidth;
    this.gameField.height = this.controls.gameFieldHeight;

    this.catBody = new SoftBlob(this.cat.position.x, this.cat.position.y, 20, 36, 1.5, 12);
    const anchor = Math.random() < 0.5 ? this.catBody.getRightmostPoint() : this.catBody.getLeftmostPoint();
    this.catTail = new Tail(anchor.point, 8, 15, 12);

    // Create GUI
    this.gui = new dat.GUI();
    this.setupGUI();

    // Create initial vehicles
    this.createVehicles();
  }

  private setupGUI(): void {
    const miceFolder = this.gui.addFolder("Mice");

    const vehicleFolder = miceFolder.addFolder("Vehicles");
    vehicleFolder.add(this.controls, "vehicleCount", 1, 100, 1).onChange(() => this.createVehicles());
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

    const catFolder = this.gui.addFolder("Cat");
    catFolder.add(this.controls, "catRadius", 10, 100, 1).onChange(() => this.updateCatProperties());
    catFolder.add(this.cat, "catHeight", 10, 200, 1);
    catFolder.add(this.cat, "debugDraw");
    catFolder.add(this.cat, "shadowScale", 0.1, 3.0, 0.1);

    const physicsFolder = catFolder.addFolder("Physics");
    physicsFolder.add(this.cat, "mass", 0.1, 5.0, 0.1);
    physicsFolder.add(this.cat, "gravity", 0.1, 2.0, 0.1);
    physicsFolder.add(this.cat, "launchPower", 0.01, 0.2, 0.005);
    physicsFolder.add(this.cat, "maxLaunchPower", 0.05, 0.5, 0.005);
    physicsFolder.add(this.cat, "bounceDamping", 0.1, 1.0, 0.1);
    physicsFolder.add(this.cat, "maxBounces", 0, 10, 1);

    const gameFieldFolder = this.gui.addFolder("Game Field");
    gameFieldFolder.add(this.controls, "gameFieldWidth", 800, 3200, 100).onChange(() => this.updateGameField());
    gameFieldFolder.add(this.controls, "gameFieldHeight", 600, 2400, 100).onChange(() => this.updateGameField());
    gameFieldFolder.add(this.controls, "bufferZone", 0, 500, 25);

    const debugFolder = this.gui.addFolder("Debug");
    debugFolder.add(this.controls, "showDebug");
    debugFolder.add(this.controls, "resetVehicles");

    vehicleFolder.open();
    wanderFolder.open();
    separationFolder.open();
    fleeFolder.open();
    boundaryFolder.open();
    catFolder.open();
    physicsFolder.open();
    gameFieldFolder.open();
    debugFolder.open();
  }

  private createVehicles(): void {
    this.vehicles = [];

    for (let i = 0; i < this.controls.vehicleCount; i++) {
      const x = Math.random() * this.gameField.width;
      const y = Math.random() * this.gameField.height;

      const options: VehicleOptions = {
        maxSpeed: this.controls.maxSpeed,
        maxForce: this.controls.maxForce,
        size: 8,
        wanderRadius: this.controls.wanderRadius,
        wanderDistance: this.controls.wanderDistance,
        wanderChange: this.controls.wanderChange,
        separationRadius: this.controls.separationRadius,
        separationWeight: this.controls.separationWeight,
        fleeRadius: this.controls.fleeRadius,
        fleeWeight: this.controls.fleeWeight,
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
    this.gameField.width = this.controls.gameFieldWidth;
    this.gameField.height = this.controls.gameFieldHeight;
    this.cat.setScreenBounds(this.controls.gameFieldWidth, this.controls.gameFieldHeight);
  }

  private getShadowCenter(): { x: number; y: number } {
    // Get shadow position based on soft body if available
    if (this.catBody) {
      const leftPoint = this.catBody.getLeftmostPoint();
      const rightPoint = this.catBody.getRightmostPoint();
      const shadowX = (leftPoint.point.pos.x + rightPoint.point.pos.x) / 2;
      const shadowY = this.cat.position.y + this.cat.catHeight + this.cat.z;
      return { x: shadowX, y: shadowY };
    } else {
      // Fallback to cat position if no soft body
      return {
        x: this.cat.position.x,
        y: this.cat.position.y + this.cat.catHeight + this.cat.z,
      };
    }
  }

  private updateCamera(): void {
    this.camera.x = this.cat.position.x - c.width / 2;
    this.camera.y = this.cat.position.y - c.height / 2;

    // Calculate camera bounds including buffer zone
    const minCameraX = -this.controls.bufferZone;
    const maxCameraX = this.gameField.width + this.controls.bufferZone - c.width;
    const minCameraY = -this.controls.bufferZone;
    const maxCameraY = this.gameField.height + this.controls.bufferZone - c.height;

    // Clamp camera to extended bounds (game field + buffer zone)
    this.camera.x = Math.max(minCameraX, Math.min(maxCameraX, this.camera.x));
    this.camera.y = Math.max(minCameraY, Math.min(maxCameraY, this.camera.y));
  }

  // Convert screen coordinates to world coordinates
  private screenToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: x + this.camera.x,
      y: y + this.camera.y,
    };
  }

  // Check if a world position is visible in the current camera viewport
  private isPositionVisible(worldX: number, worldY: number): boolean {
    return (
      worldX >= this.camera.x &&
      worldX <= this.camera.x + c.width &&
      worldY >= this.camera.y &&
      worldY <= this.camera.y + c.height
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

  private isMouseDown = false;

  override onClick(x: number, y: number): void {
    super.onClick(x, y);
    const worldPos = this.screenToWorld(x, y);
    // Handle slingshot launch on mouse up
    if (this.cat.isDragging) {
      this.cat.launch(worldPos.x, worldPos.y);
    }
  }

  onMouseDown(x: number, y: number): void {
    const worldPos = this.screenToWorld(x, y);
    // Start drag if clicking on cat
    if (this.cat.containsPoint(worldPos.x, worldPos.y)) {
      this.isMouseDown = true;
      this.cat.startDrag(worldPos.x, worldPos.y);
    }
  }

  onMouseUp(x: number, y: number): void {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.cat.isDragging) {
        const worldPos = this.screenToWorld(x, y);
        this.cat.launch(worldPos.x, worldPos.y);
      }
    }
  }

  override onMouseMove(x: number, y: number): void {
    super.onMouseMove(x, y);

    const worldPos = this.screenToWorld(x, y);

    // Update current mouse position for slingshot preview (in world coordinates)
    this.currentMousePos.x = worldPos.x;
    this.currentMousePos.y = worldPos.y;

    // Update drag if dragging
    if (this.isMouseDown && this.cat.isDragging) {
      this.cat.updateDrag(worldPos.x, worldPos.y);
    }
  }

  override update(dt: number): void {
    super.update(dt);

    // Update cat physics
    this.cat.update();

    // Update camera to follow cat
    this.updateCamera();

    const groundLevel = Math.min(this.cat.position.y + this.cat.catHeight, this.gameField.height);
    this.catBody.update(this.cat.getCollider(), this.gameField.width, groundLevel);

    this.catTail.stickTo(this.catBody);
    this.catTail.update();

    // Update vehicles with separation and flee behaviors (fleeing from cat)
    this.vehicles.forEach((vehicle) => {
      vehicle.applyBehaviors(
        this.vehicles,
        this.cat.position,
        this.gameField.width,
        this.gameField.height,
        this.controls.boundaryAvoidance,
      );
      vehicle.update();
      // Use game field borders for vehicle boundary constraints
      vehicle.borders(this.gameField.width, this.gameField.height);
    });

    // Check for collisions between cat and vehicles - only when cat is on ground (z <= 5)
    if (this.cat.z <= 5) {
      this.vehicles = this.vehicles.filter((vehicle) => {
        const distance = Vector2D.dist(vehicle.position, this.cat.position);
        const collisionDistance = vehicle.size + this.cat.radius;
        return distance > collisionDistance; // Keep vehicles that are NOT colliding
      });
    }
  }

  protected doDraw(context: CanvasRenderingContext2D): void {
    // Apply camera transform
    context.save();
    context.translate(-this.camera.x, -this.camera.y);

    // Draw buffer zone background (darker to show it's outside the play area)
    const bufferSize = this.controls.bufferZone;
    context.fillStyle = "#e0e0e0";
    context.fillRect(
      -bufferSize,
      -bufferSize,
      this.gameField.width + bufferSize * 2,
      this.gameField.height + bufferSize * 2,
    );

    // Draw game field background
    context.fillStyle = "#f0f0f0";
    context.fillRect(0, 0, this.gameField.width, this.gameField.height);

    // Draw buffer zone border (outer boundary)
    if (bufferSize > 0) {
      context.strokeStyle = "#999999";
      context.lineWidth = 2;
      context.setLineDash([10, 5]);
      context.strokeRect(
        -bufferSize,
        -bufferSize,
        this.gameField.width + bufferSize * 2,
        this.gameField.height + bufferSize * 2,
      );
      context.setLineDash([]);
    }

    // Draw game field borders (main play area)
    context.strokeStyle = "#333333";
    context.lineWidth = 4;
    context.strokeRect(0, 0, this.gameField.width, this.gameField.height);

    // Draw all vehicles
    this.vehicles.forEach((vehicle) => {
      vehicle.draw(context);
      if (this.controls.showDebug) {
        vehicle.drawWanderDebug(context);
        vehicle.drawFleeDebug(context, this.cat.position);
      }
    });

    // Draw cat shadow first (behind everything)
    this.cat.drawShadow(context, this.catBody);

    this.catBody.draw(context);
    this.catTail.draw(context);
    // Draw the cat
    this.cat.draw(context);

    // Draw slingshot trajectory preview if dragging
    if (this.cat.isDragging) {
      this.drawSlingshotPreview(context);
    }

    // Restore camera transform
    context.restore();

    // Draw off-screen vehicle indicators
    this.drawOffScreenIndicators(context);

    // Count visible and off-screen vehicles
    const visibleCount = this.vehicles.filter((vehicle) =>
      this.isPositionVisible(vehicle.position.x, vehicle.position.y),
    ).length;
    const offScreenCount = this.vehicles.length - visibleCount;

    // Get shadow center for display
    const shadowCenter = this.getShadowCenter();

    // Draw UI elements (not affected by camera)
    context.fillStyle = "#666666";
    context.font = "14px Arial";
    context.fillText(
      `Vehicles: ${this.vehicles.length} (${visibleCount} visible, ${offScreenCount} off-screen)`,
      10,
      25,
    );
    context.fillText(`Cat Z: ${this.cat.z.toFixed(1)}`, 10, 45);
    context.fillText(`Flying: ${this.cat.isFlying}`, 10, 65);
    context.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, 10, 85);
    context.fillText(`Cat Pos: (${this.cat.position.x.toFixed(0)}, ${this.cat.position.y.toFixed(0)})`, 10, 105);
    context.fillText(`Shadow Center: (${shadowCenter.x.toFixed(0)}, ${shadowCenter.y.toFixed(0)})`, 10, 125);
    context.fillText(`Buffer Zone: ${this.controls.bufferZone}px`, 10, 145);

    // Show camera bounds info
    const minCameraX = -this.controls.bufferZone;
    const maxCameraX = this.gameField.width + this.controls.bufferZone - c.width;
    const minCameraY = -this.controls.bufferZone;
    const maxCameraY = this.gameField.height + this.controls.bufferZone - c.height;
    context.fillText(
      `Camera Bounds: X(${minCameraX.toFixed(0)} to ${maxCameraX.toFixed(0)}) Y(${minCameraY.toFixed(0)} to ${maxCameraY.toFixed(0)})`,
      10,
      165,
    );
  }

  private drawOffScreenIndicators(context: CanvasRenderingContext2D): void {
    // Check if there are any visible vehicles on screen
    const visibleVehicles = this.vehicles.filter((vehicle) =>
      this.isPositionVisible(vehicle.position.x, vehicle.position.y),
    );

    // Only show off-screen indicators if no vehicles are visible on screen
    if (visibleVehicles.length > 0) {
      return; // Don't show markers if any mice are visible
    }

    // Get all off-screen vehicles with their distances to cat
    const offScreenVehicles = this.vehicles
      .filter((vehicle) => !this.isPositionVisible(vehicle.position.x, vehicle.position.y))
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

  private currentMousePos = { x: 0, y: 0 };

  private drawSlingshotPreview(context: CanvasRenderingContext2D): void {
    const catX = this.cat.position.x;
    const catY = this.cat.position.y;
    const dragX = this.currentMousePos.x;
    const dragY = this.currentMousePos.y;

    // Draw main slingshot line (thicker and more visible)
    context.strokeStyle = "#ff0000";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(catX, catY);
    context.lineTo(dragX, dragY);
    context.stroke();

    // Draw trajectory preview (opposite direction)
    const dragVector = { x: catX - dragX, y: catY - dragY };
    const trajectoryLength = Math.min(Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y) * 2, 200);

    if (trajectoryLength > 0) {
      const normalizedX = dragVector.x / Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);
      const normalizedY = dragVector.y / Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);

      const trajectoryEndX = catX + normalizedX * trajectoryLength;
      const trajectoryEndY = catY + normalizedY * trajectoryLength;

      // Draw trajectory arrow
      context.strokeStyle = "rgba(255, 255, 0, 0.8)";
      context.lineWidth = 3;
      context.setLineDash([8, 4]);
      context.beginPath();
      context.moveTo(catX, catY);
      context.lineTo(trajectoryEndX, trajectoryEndY);
      context.stroke();

      // Draw arrowhead
      const arrowSize = 15;
      const arrowAngle = Math.atan2(normalizedY, normalizedX);

      context.fillStyle = "rgba(255, 255, 0, 0.8)";
      context.setLineDash([]);
      context.beginPath();
      context.moveTo(trajectoryEndX, trajectoryEndY);
      context.lineTo(
        trajectoryEndX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        trajectoryEndY - arrowSize * Math.sin(arrowAngle - Math.PI / 6),
      );
      context.lineTo(
        trajectoryEndX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        trajectoryEndY - arrowSize * Math.sin(arrowAngle + Math.PI / 6),
      );
      context.closePath();
      context.fill();
    }

    // Draw drag point indicator
    context.fillStyle = "#ff0000";
    context.beginPath();
    context.arc(dragX, dragY, 6, 0, Math.PI * 2);
    context.fill();

    // Draw power indicator circle around cat
    const power = Math.min(Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y) / 100, 1);
    context.strokeStyle = `rgba(255, 0, 0, ${0.3 + power * 0.5})`;
    context.lineWidth = 3;
    context.setLineDash([]);
    context.beginPath();
    context.arc(catX, catY, this.cat.radius + 10 + power * 20, 0, Math.PI * 2);
    context.stroke();
  }

  override destroy(): void {
    super.destroy();
    if (this.gui) {
      this.gui.destroy();
    }
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("🔥 GameScreen module accept callback triggered");
  });
}
