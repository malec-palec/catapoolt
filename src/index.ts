import { Game } from "./game";
import "./styles.css";

export const isVerticalLayout = (): boolean => window.innerHeight > window.innerWidth;

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 800;

const game = new Game();

let then = performance.now();
const loop = (now: DOMHighResTimeStamp) => {
  const dt = now - then;
  then = now;

  game.update(dt);

  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

if (import.meta.hot) import.meta.hot.accept();
