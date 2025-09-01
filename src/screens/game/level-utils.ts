import levels from "./levels.js";

const decompress = (d: string): number[] =>
  [...d].flatMap((ch) => {
    const x = ch.charCodeAt(0);
    return Array(x & 31).fill(x >> 5);
  });

export function getLevelData(index: number): number[] {
  return decompress(levels[index]);
}
