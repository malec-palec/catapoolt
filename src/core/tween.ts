import { pow } from "../system";

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
}
