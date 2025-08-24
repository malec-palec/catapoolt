import { IGame } from "../game";
import { Cat } from "../game/cat";
import { BaseScreen } from "../screen";
import {
  createCrossFromTopDown,
  CrossDrawConfig,
  CrossMark,
  DEFAULT_CROSS_CONFIG,
  drawCross,
  filterActiveCrosses,
  getCrossOpacity,
} from "../utils/crosses";
import { DebugInfo, drawDebugInfo } from "../utils/debug";
import { Point2D } from "../utils/geom";
import {
  DEFAULT_GRID_CONFIG,
  DEFAULT_WORLD_BOUNDS,
  draw2DGrid,
  draw2DWorldBounds,
  drawIsometricGrid,
  GridConfig,
  WorldBounds,
} from "../utils/grid";
import { DEFAULT_ISOMETRIC_CONFIG, drawIsometricBorders, IsometricConfig } from "../utils/isometric";

export class GameScreen extends BaseScreen {
  private cat: Cat;
  private gridConfig: GridConfig;
  private isometricConfig: IsometricConfig;
  private worldBounds: WorldBounds;
  private topDownCrossConfig: CrossDrawConfig;
  private isometricCrossConfig: CrossDrawConfig;
  private crosses: CrossMark[] = [];
  private debugInfo: DebugInfo = {};

  private topDownOffset: Point2D = { x: 40, y: 40 };

  shouldDrawTopDown: boolean = true;
  shouldDrawIsometric: boolean = true;

  constructor(private game: IGame) {
    super();

    this.cat = new Cat();
    this.gridConfig = { ...DEFAULT_GRID_CONFIG };
    this.worldBounds = { ...DEFAULT_WORLD_BOUNDS };
    this.isometricConfig = { ...DEFAULT_ISOMETRIC_CONFIG };

    // 2D cross: 45° rotation
    this.topDownCrossConfig = {
      ...DEFAULT_CROSS_CONFIG,
      color: "#ff3366",
      size: 24,
      lineWidth: 3,
      rotation: Math.PI / 4, // 45 degrees
      scaleY: 1,
    };

    // Isometric cross: back to original (no rotation, no scaling)
    this.isometricCrossConfig = {
      ...DEFAULT_CROSS_CONFIG,
      color: "#ff3366",
      size: 24,
      lineWidth: 3,
    };

    const guiFolder = game.gui.addFolder("Game");
    guiFolder.add(this, "shouldDrawTopDown").name("Top Down");
    guiFolder.add(this, "shouldDrawIsometric").name("Isometric");
    guiFolder.open();
  }

  override update(dt: number): void {
    this.cat.update(dt);

    // Update crosses - remove expired ones
    const currentTime = Date.now();
    this.crosses = filterActiveCrosses(this.crosses, currentTime);
  }

  handleTopDownClick(x: number, y: number): void {
    // Adjust coordinates for offset
    const worldX = x - this.topDownOffset.x;
    const worldY = y - this.topDownOffset.y;

    // Check if click is within world bounds
    if (worldX >= 0 && worldX <= this.worldBounds.width && worldY >= 0 && worldY <= this.worldBounds.height) {
      // Set cat target to clicked position
      this.cat.setTarget({ x: worldX, y: worldY, z: 0 });

      // Create cross marker for visual feedback
      const cross = createCrossFromTopDown(worldX, worldY, this.isometricConfig);
      this.crosses.push(cross);

      // Update debug info with world coordinates
      this.debugInfo.lastTopDownClick = { x: worldX, y: worldY };
    }
  }

  handleIsometricClick(x: number, y: number): void {
    // Adjust coordinates for isometric offset
    const canvasWidth = isometric.width;
    const isoOffsetX = canvasWidth / 2;
    const isoOffsetY = 100;

    const adjustedX = x - isoOffsetX;
    const adjustedY = y - isoOffsetY;

    // Convert from isometric screen coordinates to world coordinates
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    // Inverse isometric projection (assuming z = 0)
    const worldX = (adjustedX / cos30 + adjustedY / sin30) / 2;
    const worldY = (adjustedY / sin30 - adjustedX / cos30) / 2;

    // Check if click is within world bounds
    if (worldX >= 0 && worldX <= this.worldBounds.width && worldY >= 0 && worldY <= this.worldBounds.height) {
      // Set cat target to clicked position
      this.cat.setTarget({ x: worldX, y: worldY, z: 0 });

      // Create cross mark with correct coordinates for visual feedback
      const cross = {
        id: `cross_${Date.now()}_${Math.random()}`,
        topDownPos: { x: worldX, y: worldY },
        isometricPos: { x: adjustedX, y: adjustedY },
        worldPos: { x: worldX, y: worldY, z: 0 },
        startTime: Date.now(),
        duration: 500,
      };

      this.crosses.push(cross);
    }

    // Update debug info
    this.debugInfo.lastIsometricClick = { x, y };
  }

  drawTopDown(context: CanvasRenderingContext2D): void {
    draw2DGrid(context, this.worldBounds.width, this.worldBounds.height, this.gridConfig, this.topDownOffset);
    draw2DWorldBounds(context, this.worldBounds, this.topDownOffset);

    const { spine } = this.cat;

    // Draw cat spine on top-down canvas (2D view) with offset using smooth curves
    context.save();
    context.translate(this.topDownOffset.x, this.topDownOffset.y);

    if (spine.length > 1) {
      context.strokeStyle = "#333";
      context.lineWidth = 40;
      context.lineCap = "round";
      // context.lineJoin = "round";
      context.beginPath();

      // Start at the first node
      context.moveTo(spine[0].worldPosition.x, spine[0].worldPosition.y);

      if (spine.length === 2) {
        // Simple line for just two nodes
        context.lineTo(spine[1].worldPosition.x, spine[1].worldPosition.y);
      } else {
        // Use quadratic curves for smooth connections
        for (let i = 1; i < spine.length - 1; i++) {
          const current = spine[i];
          const next = spine[i + 1];

          // Control point is the current node, curve to midpoint between current and next
          const midX = (current.worldPosition.x + next.worldPosition.x) / 2;
          const midY = (current.worldPosition.y + next.worldPosition.y) / 2;

          context.quadraticCurveTo(current.worldPosition.x, current.worldPosition.y, midX, midY);
        }

        // Final curve to the last node
        const lastNode = spine[spine.length - 1];
        const secondLastNode = spine[spine.length - 2];
        context.quadraticCurveTo(
          secondLastNode.worldPosition.x,
          secondLastNode.worldPosition.y,
          lastNode.worldPosition.x,
          lastNode.worldPosition.y,
        );
      }

      context.stroke();
    }

    spine.forEach((node) => {
      context.strokeStyle = "red";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(node.worldPosition.x, node.worldPosition.y, node.radius, 0, 2 * Math.PI);
      context.stroke();
    });

    // Draw direction indicators for each node
    spine.forEach((node) => {
      const directionLength = node.radius * 0.8; // Shorter arrows
      const startX = node.worldPosition.x;
      const startY = node.worldPosition.y;
      // Reverse the direction by adding PI (180 degrees)
      const reversedDirection = node.direction + Math.PI;
      const endX = startX + Math.cos(reversedDirection) * directionLength;
      const endY = startY + Math.sin(reversedDirection) * directionLength;

      // Draw direction line
      context.strokeStyle = "red"; // Changed to red
      context.lineWidth = 2;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();

      // Draw arrowhead
      const arrowSize = 4; // Smaller arrowhead
      const arrowAngle = Math.PI / 6; // 30 degrees

      context.beginPath();
      context.moveTo(endX, endY);
      context.lineTo(
        endX - Math.cos(reversedDirection - arrowAngle) * arrowSize,
        endY - Math.sin(reversedDirection - arrowAngle) * arrowSize,
      );
      context.moveTo(endX, endY);
      context.lineTo(
        endX - Math.cos(reversedDirection + arrowAngle) * arrowSize,
        endY - Math.sin(reversedDirection + arrowAngle) * arrowSize,
      );
      context.stroke();
    });

    context.restore();

    // Draw crosses with fading animation and different configurations
    const currentTime = Date.now();
    this.crosses.forEach((cross) => {
      const opacity = getCrossOpacity(cross, currentTime);
      if (opacity > 0) {
        // Draw rotated cross (45°) on top-down canvas with offset
        const offsetTopDownPos = {
          x: cross.topDownPos.x + this.topDownOffset.x,
          y: cross.topDownPos.y + this.topDownOffset.y,
        };
        drawCross(context, offsetTopDownPos, opacity, this.topDownCrossConfig);
      }
    });
  }

  drawIsometric(context: CanvasRenderingContext2D): void {
    drawIsometricGrid(context, this.worldBounds.width, this.worldBounds.height, this.gridConfig);
    drawIsometricBorders(
      context,
      this.worldBounds.width,
      this.worldBounds.height,
      this.isometricConfig,
      this.worldBounds.color,
      this.worldBounds.lineWidth,
      false, // Solid line, not dashed
    );

    const { spine } = this.cat;

    // Draw cat spine on isometric canvas (3D isometric view) using smooth curves
    if (spine.length > 1) {
      context.strokeStyle = "#333";
      context.lineWidth = 40;
      context.lineCap = "round";

      // Apply same offset as isometric grid
      const canvasWidth = context.canvas.width;
      const offsetX = canvasWidth / 2;
      const offsetY = 100;

      context.save();
      context.translate(offsetX, offsetY);

      // Convert all spine positions to isometric coordinates
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);

      const isoPoints = spine.map((node) => ({
        x: (node.worldPosition.x - node.worldPosition.y) * cos30,
        y: (node.worldPosition.x + node.worldPosition.y) * sin30 + node.worldPosition.z,
      }));

      context.beginPath();
      context.moveTo(isoPoints[0].x, isoPoints[0].y);

      // Use quadratic curves for smooth connections
      for (let i = 1; i < isoPoints.length - 1; i++) {
        const current = isoPoints[i];
        const next = isoPoints[i + 1];

        // Control point is the current node, curve to midpoint between current and next
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        context.quadraticCurveTo(current.x, current.y, midX, midY);
      }

      // Final curve to the last node
      const lastPoint = isoPoints[isoPoints.length - 1];
      const secondLastPoint = isoPoints[isoPoints.length - 2];
      context.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);

      context.stroke();
      context.restore();
    }

    // Draw direction indicators for each node in isometric view
    if (spine.length > 0) {
      const canvasWidth = context.canvas.width;
      const offsetX = canvasWidth / 2;
      const offsetY = 100;

      context.save();
      context.translate(offsetX, offsetY);

      // Convert spine positions to isometric coordinates
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);

      spine.forEach((node) => {
        // Convert node position to isometric coordinates
        const isoNodePos = {
          x: (node.worldPosition.x - node.worldPosition.y) * cos30,
          y: (node.worldPosition.x + node.worldPosition.y) * sin30 + node.worldPosition.z,
        };

        // Calculate direction endpoint in world coordinates
        const directionLength = node.radius * 0.8; // Shorter arrows
        // Reverse the direction by adding PI (180 degrees)
        const reversedDirection = node.direction + Math.PI;
        const worldEndX = node.worldPosition.x + Math.cos(reversedDirection) * directionLength;
        const worldEndY = node.worldPosition.y + Math.sin(reversedDirection) * directionLength;
        const worldEndZ = node.worldPosition.z;

        // Convert direction endpoint to isometric coordinates
        const isoEndPos = {
          x: (worldEndX - worldEndY) * cos30,
          y: (worldEndX + worldEndY) * sin30 + worldEndZ,
        };

        // Draw direction line
        context.strokeStyle = "red"; // Changed to red
        context.lineWidth = 2;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(isoNodePos.x, isoNodePos.y);
        context.lineTo(isoEndPos.x, isoEndPos.y);
        context.stroke();

        // Draw arrowhead
        const arrowSize = 4; // Smaller arrowhead
        const arrowAngle = Math.PI / 6; // 30 degrees

        // Calculate arrowhead points in world coordinates then convert to isometric
        const arrow1WorldX = worldEndX - Math.cos(reversedDirection - arrowAngle) * arrowSize;
        const arrow1WorldY = worldEndY - Math.sin(reversedDirection - arrowAngle) * arrowSize;
        const arrow2WorldX = worldEndX - Math.cos(reversedDirection + arrowAngle) * arrowSize;
        const arrow2WorldY = worldEndY - Math.sin(reversedDirection + arrowAngle) * arrowSize;

        const isoArrow1 = {
          x: (arrow1WorldX - arrow1WorldY) * cos30,
          y: (arrow1WorldX + arrow1WorldY) * sin30 + worldEndZ,
        };
        const isoArrow2 = {
          x: (arrow2WorldX - arrow2WorldY) * cos30,
          y: (arrow2WorldX + arrow2WorldY) * sin30 + worldEndZ,
        };

        context.beginPath();
        context.moveTo(isoEndPos.x, isoEndPos.y);
        context.lineTo(isoArrow1.x, isoArrow1.y);
        context.moveTo(isoEndPos.x, isoEndPos.y);
        context.lineTo(isoArrow2.x, isoArrow2.y);
        context.stroke();
      });

      context.restore();
    }

    /* spine.forEach((node) => {
      context.strokeStyle = "red";
      context.lineWidth = 2;
      // context.fillStyle = "rgba(255, 0, 0, 0.3)";

      // Draw flattened circle (ellipse) for isometric perspective
      drawIsometricCircle(context, node.worldPosition, node.radius, this.isometricConfig);
      context.stroke();
      // context.fill();
    }); */

    // Draw crosses with fading animation and different configurations
    const currentTime = Date.now();
    this.crosses.forEach((cross) => {
      const opacity = getCrossOpacity(cross, currentTime);
      if (opacity > 0) {
        // Draw regular cross on isometric canvas with proper offset
        context.save();
        const canvasWidth = context.canvas.width;
        const isoOffsetX = canvasWidth / 2;
        const isoOffsetY = 100;
        context.translate(isoOffsetX, isoOffsetY);

        // Convert world coordinates to isometric screen coordinates
        const cos30 = Math.cos(Math.PI / 6);
        const sin30 = Math.sin(Math.PI / 6);
        const isoCrossPos = {
          x: (cross.worldPos.x - cross.worldPos.y) * cos30,
          y: (cross.worldPos.x + cross.worldPos.y) * sin30 + cross.worldPos.z,
        };

        drawCross(context, isoCrossPos, opacity, this.isometricCrossConfig);
        context.restore();
      }
    });
  }

  override draw(topDownContext: CanvasRenderingContext2D, isometricContext: CanvasRenderingContext2D): void {
    if (this.shouldDrawTopDown) this.drawTopDown(topDownContext);
    if (this.shouldDrawIsometric) this.drawIsometric(isometricContext);

    // Update debug info with current FPS
    this.debugInfo.fps = this.game.getFps();
    drawDebugInfo(topDownContext, this.debugInfo, topDown.width);
  }
}
