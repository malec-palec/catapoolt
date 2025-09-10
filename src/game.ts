import { IScreen, IScreenManager, ScreenConstructor } from "./base-screen";
import { CreditsScreen } from "./screens/credits-screen";
import { HighScoresScreen } from "./screens/high-scores-screen";
// import { GameScreen } from "./screens/game-screen";
import { SplashScreen } from "./screens/splash-screen";
import { StartScreen } from "./screens/start-screen";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

const SCREENS: Record<string, ScreenConstructor> = {
  SplashScreen,
  StartScreen,
  HighScoresScreen,
  CreditsScreen,
  // GameScreen,
};

const getCanvasCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
  const rect = c.getBoundingClientRect();
  // Calculate relative position within the displayed canvas
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;
  // Calculate scale factors based on actual displayed size vs internal canvas size
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  // Apply scaling to get internal canvas coordinates
  let x = relativeX * scaleX;
  let y = relativeY * scaleY;
  // Clamp coordinates to internal canvas bounds
  x = Math.max(0, Math.min(c.width, x));
  y = Math.max(0, Math.min(c.height, y));
  return { x, y };
};

const mouseHandler =
  (callback: (x: number, y: number) => void) =>
  (event: MouseEvent): void => {
    const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);
    callback(x, y);
  };

const touchHandler =
  (callback: (x: number, y: number) => void) =>
  (event: TouchEvent): void => {
    event.preventDefault();
    const touch = event.touches[0] || event.changedTouches[0];
    if (touch) {
      const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
      callback(x, y);
    }
  };
export class Game implements IGame {
  private context: CanvasRenderingContext2D;
  private screen: IScreen;

  constructor() {
    this.context = c.getContext("2d", {
      willReadFrequently: true,
    })!;

    const screenName = import.meta.env.VITE_HOME_SCREEN || "SplashScreen";
    const homeScreenCtor = SCREENS[screenName];
    this.screen = new homeScreenCtor(this);

    c.onclick = mouseHandler((x, y) => this.screen.onClick(x, y));
    c.onmousedown = mouseHandler((x, y) => this.screen.onMouseDown(x, y));
    c.onmouseup = mouseHandler((x, y) => this.screen.onMouseUp(x, y));
    c.onmousemove = mouseHandler((x, y) => this.screen.onMouseMove(x, y));
    c.ontouchstart = touchHandler((x, y) => this.screen.onMouseDown(x, y));
    c.ontouchend = touchHandler((x, y) => this.screen.onMouseUp(x, y));
    c.ontouchmove = touchHandler((x, y) => this.screen.onMouseMove(x, y));

    window.onresize = () => this.screen.onResize();
    this.screen.onResize();
  }

  changeScreen(screenCtor: ScreenConstructor, ...rest: any[]): void {
    this.screen.destroy();

    c.style.cursor = "default";

    const newScreen: IScreen = new screenCtor(this, ...rest);
    newScreen.onResize();

    this.screen = newScreen;
  }

  update(dt: number): void {
    const { screen, context } = this;
    screen.update(dt);

    screen.draw(context);
  }
}
