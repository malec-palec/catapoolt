import { Rectangle } from "./geom";

export type Button = Rectangle & {
  isHovered: boolean;
  isDisabled: boolean;
  text: string;
  clickHandler: () => void;
};

export const createButton = (
  obj: Omit<Button, "x" | "y" | "isHovered" | "isDisabled"> &
    Partial<{ x: number; y: number; isHovered: boolean; isDisabled: boolean }>,
): Button => ({
  x: 0,
  y: 0,
  isHovered: false,
  isDisabled: false,
  ...obj,
});
