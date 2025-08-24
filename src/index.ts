import { Game } from "./game";
import "./styles.css";

const game = new Game();

const handleResize = () => game.resize(window.innerWidth, window.innerHeight);
onresize = handleResize;
handleResize();

let then = performance.now();
const loop = (now: DOMHighResTimeStamp) => {
  const dt = now - then;
  then = now;

  game.update(dt);

  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
