import { IRenderable, ITickable } from "../../core/display";
import { Point2D } from "../../core/geom";
import { vecDist } from "../../core/vector2d";
import { Vehicle } from "../../core/vehicle";
import { abs, atan2, PI, round, sin, tan } from "../../system";
import { Cat } from "./cat";
import { IGameController } from "./game-scene";

export class HUD implements ITickable, IRenderable {
  constructor(
    private cat: Cat,
    private enemies: Vehicle[],
    private gameController: IGameController,
    private cameraPos: Point2D,
    private blinkTime: number = 0,
  ) {}

  tick(dt: number): void {
    this.blinkTime += dt;
  }

  render(context: CanvasRenderingContext2D): void {
    // Draw mice counter and next wave number
    context.fillStyle = "#333333";
    context.font = "bold 24px Arial";
    context.textAlign = "center";
    const miceText = `Mice ${this.enemies.length}`;
    context.fillText(miceText, c.width / 2 - 80, 35);

    const waveText = `Wave ${this.gameController.currentWave}`;
    context.fillText(waveText, c.width / 2 + 80, 35);

    // Draw blinking warning message if cat is at max inflation
    if (this.cat.inflationLevel >= this.cat.maxInflationLevel) {
      // Calculate blinking opacity (blink every 600ms)
      const blinkCycle = sin(this.blinkTime * 0.005 * PI); // 5 cycles per second
      const opacity = (blinkCycle + 1) / 2; // Convert from [-1,1] to [0,1]

      context.fillStyle = `rgba(204, 0, 0, ${opacity})`;
      context.font = "16px Arial";
      context.fillText("Can't eat more. Need to purge: double-tap on the cat.", c.width / 2, 65);
    }

    context.textAlign = "left"; // Reset text alignment

    // Draw stamina bar
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
      const red = round(255 * (1 - staminaPercentage));
      const green = round(255 * staminaPercentage);
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

    // Draw off-screen vehicle indicators
    this.drawOffScreenIndicators(context);
  }

  // Check if a world position is visible in the current camera viewport
  private isPositionVisible(worldPos: Point2D): boolean {
    return (
      worldPos.x >= this.cameraPos.x &&
      worldPos.x <= this.cameraPos.x + c.width &&
      worldPos.y >= this.cameraPos.y &&
      worldPos.y <= this.cameraPos.y + c.height
    );
  }

  // TODO: check how reliable is isVisible field is
  private isAnyVehicleVisible(): boolean {
    for (const vehicle of this.enemies) {
      if (this.isPositionVisible(vehicle.position)) {
        return true;
      }
    }
    return false;
  }

  private drawOffScreenIndicators(context: CanvasRenderingContext2D): void {
    if (this.isAnyVehicleVisible()) return;

    // Get all off-screen vehicles with their distances to cat
    const offScreenVehicles = this.enemies
      .filter((vehicle) => !this.isPositionVisible(vehicle.position))
      .map((vehicle) => ({
        vehicle,
        distance: vecDist(vehicle.position, this.cat.position),
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
      .slice(0, 5); // Show only the 5 nearest off-screen mice

    // Draw indicators for nearest off-screen vehicles
    offScreenVehicles.forEach(({ vehicle }) => {
      const edgePos = this.getScreenEdgePosition(vehicle.position.x, vehicle.position.y);

      // Calculate direction angle for triangle orientation
      const screenCenterX = c.width / 2;
      const screenCenterY = c.height / 2;
      const relativeX = vehicle.position.x - (this.cameraPos.x + screenCenterX);
      const relativeY = vehicle.position.y - (this.cameraPos.y + screenCenterY);
      const angle = atan2(relativeY, relativeX);

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

  // Calculate screen edge position for off-screen indicator
  private getScreenEdgePosition(worldX: number, worldY: number): { x: number; y: number } {
    const screenCenterX = c.width / 2;
    const screenCenterY = c.height / 2;

    // Convert world position to relative screen position
    const relativeX = worldX - (this.cameraPos.x + screenCenterX);
    const relativeY = worldY - (this.cameraPos.y + screenCenterY);

    // Calculate angle from screen center to target
    const angle = atan2(relativeY, relativeX);

    // Calculate intersection with screen edges
    const margin = 20; // Distance from screen edge
    let edgeX: number, edgeY: number;

    // Determine which edge to use based on angle
    const absAngle = abs(angle);
    const halfWidth = c.width / 2 - margin;
    const halfHeight = c.height / 2 - margin;

    if (absAngle <= atan2(halfHeight, halfWidth)) {
      // Right or left edge
      if (relativeX > 0) {
        // Right edge
        edgeX = c.width - margin;
        edgeY = screenCenterY + halfWidth * tan(angle);
      } else {
        // Left edge
        edgeX = margin;
        edgeY = screenCenterY - halfWidth * tan(angle);
      }
    } else {
      // Top or bottom edge
      if (relativeY > 0) {
        // Bottom edge
        edgeX = screenCenterX + halfHeight / tan(angle);
        edgeY = c.height - margin;
      } else {
        // Top edge
        edgeX = screenCenterX - halfHeight / tan(angle);
        edgeY = margin;
      }
    }

    return { x: edgeX, y: edgeY };
  }
}
