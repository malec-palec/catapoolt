import { IRenderable } from "../../core/display";
import { abs, max, TWO_PI } from "../../system";
import { Cat } from "./cat";
import { drawSlingshotPreview } from "./slingshot-preview";

export class CatShadow implements IRenderable {
  constructor(private cat: Cat) {}

  render(context: CanvasRenderingContext2D): void {
    const { cat } = this;
    const shadowProvider = cat.body;

    let shadowX = cat.position.x;

    // Get the leftmost and rightmost points of the shadow provider (e.g., soft body)
    const leftPoint = shadowProvider.getLeftmostPoint();
    const rightPoint = shadowProvider.getRightmostPoint();

    // Calculate shadow diameter (distance between edge points)
    const shadowDiameter = abs(rightPoint.point.pos.x - leftPoint.point.pos.x);
    const shadowRadius = shadowDiameter / 2;

    // Position shadow between the edge points
    shadowX = (leftPoint.point.pos.x + rightPoint.point.pos.x) / 2;

    // Calculate shadow position (catHeight + z distance below cat)
    const shadowY = cat.position.y + cat.catHeight + cat.z;

    // Scale shadow based on height (higher = smaller shadow)
    const heightScale = max(0.1, 1 - cat.z / 200); // Shadow gets smaller as cat goes higher

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
    context.arc(0, 0, finalShadowRadius, 0, TWO_PI);
    context.fill();
    context.restore();

    if (cat.isDragging) drawSlingshotPreview(context, cat, cat.curMousePos);
  }
}
