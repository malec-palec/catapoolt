import { World } from "./world";

const initGame = (): void => {
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

  const world = new World(canvas);

  const gameLoop = () => {
    world.update();
    world.draw();

    requestAnimationFrame(gameLoop);
  };
  gameLoop();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
