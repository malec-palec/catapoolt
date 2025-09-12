// import "./debug-console";
import { Game } from "./game";
import "./styles.css";

const game = new Game();
let then = performance.now();

const loop = (now: DOMHighResTimeStamp) => {
  game.tick(now - then);
  then = now;
  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
