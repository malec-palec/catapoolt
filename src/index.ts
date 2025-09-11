// import "./debug-console";
import { Game } from "./game";
import "./styles.css";

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
