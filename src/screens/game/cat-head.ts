import { Color, wrapContext } from "../../registry";
import { cos, isDev, PI, sin, TWO_PI } from "../../system";

export type EarData = {
  angle: number;
  width: number;
  height: number;
  offsetY: number;
};

export type EyeData = {
  radius: number;
  offsetX: number;
  offsetY: number;
  pupilWidth: number;
  pupilHeight: number;
};

export const earData: EarData = {
  angle: 60, // Angle between ears in degrees
  width: 20, // Width of ear foundation
  height: 30, // Height of ears
  offsetY: 0, // Additional Y offset for ears relative to head
};

export const eyeData: EyeData = {
  radius: 0.18, // Eye size relative to body radius
  offsetX: 0.35, // Horizontal eye distance from center (relative to radius)
  offsetY: 0.2, // Vertical eye offset (relative to radius)
  pupilWidth: 0.3, // Pupil width relative to eye radius
  pupilHeight: 1.2, // Pupil height relative to eye radius
};

export const drawHead = (
  context: CanvasRenderingContext2D,
  posX: number,
  posY: number,
  radius: number,
  debugDraw = false,
): void => {
  context.fillStyle = context.strokeStyle = Color.Black;
  context.lineWidth = 3;

  context.beginPath();
  context.arc(posX, posY, radius, 0, TWO_PI);
  context.fill();
  context.stroke();

  // Draw one complete side (ear + eye), then mirror it
  const drawOneSide = () => {
    // Calculate ear positions once
    const halfAngle = (earData.angle * PI) / 360; // Direct calculation
    const earOffset = radius * 0.8;
    const earHalfWidth = earData.width / 2;

    // Calculate eye properties once
    const eyeRadius = radius * eyeData.radius;
    const pupilHalfWidth = (eyeRadius * eyeData.pupilWidth) / 2;
    const pupilHalfHeight = (eyeRadius * eyeData.pupilHeight) / 2;

    // Draw eye
    const eyeX = posX - radius * eyeData.offsetX;
    const eyeY = posY - radius * eyeData.offsetY;

    context.fillStyle = Color.ForestGreen;
    context.beginPath();
    context.arc(eyeX, eyeY, eyeRadius, 0, TWO_PI);
    context.fill();

    // Draw pupil
    context.fillStyle = Color.Black;
    context.fillRect(eyeX - pupilHalfWidth, eyeY - pupilHalfHeight, pupilHalfWidth * 2, pupilHalfHeight * 2);

    // Draw ear
    const baseX = posX - sin(halfAngle) * earOffset;
    const baseY = posY - cos(halfAngle) * earOffset + earData.offsetY;

    context.beginPath();
    context.moveTo(baseX - earHalfWidth, baseY);
    context.lineTo(baseX + earHalfWidth, baseY);
    context.lineTo(baseX, baseY - earData.height);
    context.fill();
  };

  // Draw left side normally
  drawOneSide();

  // Draw right side by mirroring
  wrapContext(context, () => {
    context.translate(posX * 2, 0);
    context.scale(-1, 1);
    drawOneSide();
  });

  if (isDev && debugDraw) {
    context.strokeStyle = context.fillStyle = Color.Blue;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(posX, posY, radius, 0, TWO_PI);
    context.stroke();

    context.beginPath();
    context.arc(posX, posY, 8, 0, TWO_PI);
    context.fill();
  }
};
