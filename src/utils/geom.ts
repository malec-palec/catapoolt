export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// 2D Vector Math Helpers

export const getDistance2D = (a: Point2D, b: Point2D): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalize2D = (vector: Point2D): Point2D => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
};

export const multiply2D = (vector: Point2D, scalar: number): Point2D => {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
};

export const subtract2D = (a: Point2D, b: Point2D): Point2D => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
};

export const add2D = (a: Point2D, b: Point2D): Point2D => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
};

export const limit2D = (vector: Point2D, max: number): Point2D => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (magnitude > max) {
    return multiply2D(normalize2D(vector), max);
  }
  return vector;
};

// Angle Helpers

export const getAngle2D = (from: Point2D, to: Point2D): number => {
  return Math.atan2(to.y - from.y, to.x - from.x);
};

export const normalizeAngle = (angle: number): number => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

export const getAngleDifference = (angle1: number, angle2: number): number => {
  return normalizeAngle(angle2 - angle1);
};

export const constrainAngle = (targetAngle: number, referenceAngle: number, maxChange: number): number => {
  const angleDiff = getAngleDifference(referenceAngle, targetAngle);
  const clampedDiff = Math.max(-maxChange, Math.min(maxChange, angleDiff));
  return referenceAngle + clampedDiff;
};
