// import "./debug-console";
import "../styles.css";
import { setupRAF } from "./core/utils";
import { Game } from "./game";

const game = new Game();
let then = performance.now();

const loop = (now: DOMHighResTimeStamp) => {
  game.tick(now - then);
  then = now;
};
setupRAF(loop);
