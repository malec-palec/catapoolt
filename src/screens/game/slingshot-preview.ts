import { Point2D } from "../../core/geom";
import { ColorStop, createLinearGradientWithStops, rgbaValues } from "../../registry";
import { atan2, cos, hypot, min, PI, sin } from "../../system";
import { Cat } from "./cat";

export const drawSlingshotPreview = (context: CanvasRenderingContext2D, cat: Cat, curPointerPos: Point2D): void => {
  // Get cat collision center
  const centerX = cat.position.x;
  const centerY = cat.getFloorLevel();

  const dragX = curPointerPos.x;
  const dragY = curPointerPos.y;

  // Calculate drag vector and distance
  const dragVectorX = dragX - centerX;
  const dragVectorY = dragY - centerY;
  const dragDistance = hypot(dragVectorX, dragVectorY);
  const maxDragDistance = cat.maxDragDistance;

  // Calculate visual drag position (limited to max distance)
  let visualDragX = dragX;
  let visualDragY = dragY;

  if (dragDistance > maxDragDistance) {
    const scale = maxDragDistance / dragDistance;
    visualDragX = centerX + dragVectorX * scale;
    visualDragY = centerY + dragVectorY * scale;
  }

  // Calculate power ratio for color intensity
  const powerRatio = min(dragDistance / maxDragDistance, 1.0);

  // Calculate cone parameters
  const coneLength = min(dragDistance, maxDragDistance);
  const coneAngle = atan2(visualDragY - centerY, visualDragX - centerX);
  const minConeWidth = 8; // Minimum width when no power
  const maxConeWidth = 40; // Maximum width at full power
  const coneWidth = minConeWidth + (maxConeWidth - minConeWidth) * powerRatio;

  // Draw cone with gradient
  if (coneLength > 10) {
    // Only draw if drag distance is meaningful
    // Use same color as predictive trajectory: blue (0, 150, 255)
    const red = 0;
    const green = 150;
    const blue = 255;

    // Start transparent, end with color based on power
    const alpha = powerRatio * 0.6; // Max alpha of 0.6

    // Create gradient with all color stops in a single operation
    const colorStops: ColorStop[] = [
      [0, red, green, blue, 0], // Transparent at cat
      [0.3, red, green, blue, alpha * 0.3], // Mid color
      [1, red, green, blue, alpha], // Full color at cursor
    ];
    const gradient = createLinearGradientWithStops(context, centerX, centerY, visualDragX, visualDragY, colorStops);

    // Calculate cone vertices
    const perpX = cos(coneAngle + PI / 2);
    const perpY = sin(coneAngle + PI / 2);

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

    context.fillStyle = rgbaValues(red, green, blue, alpha);

    // Calculate the angle perpendicular to cone direction (pointing away from cat)
    const outwardAngle = coneAngle;
    const startAngle = outwardAngle - PI / 2;
    const endAngle = outwardAngle + PI / 2;

    context.beginPath();
    context.arc(visualDragX, visualDragY, coneWidth / 2, startAngle, endAngle, false);
    context.fill();
  }
};
