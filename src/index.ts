import { Game } from "./game";

const game = new Game();

let then = performance.now();
const loop = (now: DOMHighResTimeStamp) => {
  const dt = now - then;
  then = now;

  game.update(dt);

  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
