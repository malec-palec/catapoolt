import { isDev } from "../../system";

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

export const drawHead = (
  context: CanvasRenderingContext2D,
  strokeWidth: number,
  posX: number,
  posY: number,
  radius: number,
  earData: EarData,
  eyeData: EyeData,
  debugDraw = false,
): void => {
  context.fillStyle = context.strokeStyle = "#000";
  context.lineWidth = strokeWidth;

  context.beginPath();
  context.arc(posX, posY, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Draw one complete side (ear + eye), then mirror it
  const drawOneSide = () => {
    // Calculate ear positions once
    const halfAngle = (earData.angle * Math.PI) / 360; // Direct calculation
    const earOffset = radius * 0.8;
    const earHalfWidth = earData.width / 2;

    // Calculate eye properties once
    const eyeRadius = radius * eyeData.radius;
    const pupilHalfWidth = (eyeRadius * eyeData.pupilWidth) / 2;
    const pupilHalfHeight = (eyeRadius * eyeData.pupilHeight) / 2;

    // Draw eye
    const eyeX = posX - radius * eyeData.offsetX;
    const eyeY = posY - radius * eyeData.offsetY;

    context.fillStyle = "#228B22";
    context.beginPath();
    context.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    context.fill();

    // Draw pupil
    context.fillStyle = "#000";
    context.fillRect(eyeX - pupilHalfWidth, eyeY - pupilHalfHeight, pupilHalfWidth * 2, pupilHalfHeight * 2);

    // Draw ear
    const baseX = posX - Math.sin(halfAngle) * earOffset;
    const baseY = posY - Math.cos(halfAngle) * earOffset + earData.offsetY;

    context.beginPath();
    context.moveTo(baseX - earHalfWidth, baseY);
    context.lineTo(baseX + earHalfWidth, baseY);
    context.lineTo(baseX, baseY - earData.height);
    context.fill();
  };

  // Draw left side normally
  drawOneSide();

  // Draw right side by mirroring
  context.save();
  context.translate(posX * 2, 0);
  context.scale(-1, 1);
  drawOneSide();
  context.restore();

  if (isDev && debugDraw) {
    context.strokeStyle = context.fillStyle = "#4444ff";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(posX, posY, radius, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.arc(posX, posY, 8, 0, Math.PI * 2);
    context.fill();
  }
};
