import { IScreen, IScreenManager, ScreenName } from "./screen";
import { CreditsScreen } from "./screens/credits-screen";
import { GameScreen } from "./screens/game-screen";
import { LevelSelectScreen } from "./screens/level-select-screen";
import { MenuScreen } from "./screens/menu-screen";
import { SplashScreen } from "./screens/splash-screen";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

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
  static readonly GAME_WIDTH = 800;
  static readonly GAME_HEIGHT = 600;

  private context: CanvasRenderingContext2D;
  private screen: IScreen;
  private currentScreenName: ScreenName;
  private isNavigatingBack = false;

  constructor() {
    this.context = c.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.screen = new GameScreen(this);
    this.currentScreenName = ScreenName.Game;

    history.replaceState({ screen: this.currentScreenName }, "", "");

    c.onclick = mouseHandler((x, y) => this.screen.onClick(x, y));
    c.onmousemove = mouseHandler((x, y) => this.screen.onMouseMove(x, y));
    c.ontouchstart = touchHandler((x, y) => this.screen.onClick(x, y));
    c.ontouchmove = touchHandler((x, y) => this.screen.onMouseMove(x, y));
    window.onpopstate = (event) => {
      if (event.state && event.state.screen) {
        this.isNavigatingBack = true;
        this.changeScreen(event.state.screen, ...(event.state.args || []));
        this.isNavigatingBack = false;
      }
    };
    window.onresize = () => this.screen.onResize();

    this.screen.onResize();
  }

  changeScreen(name: ScreenName, ...rest: any[]): void {
    this.screen.destroy();

    c.style.cursor = "default";

    if (!this.isNavigatingBack && name !== this.currentScreenName) {
      history.pushState({ screen: name, args: rest }, "", "");
    }
    this.currentScreenName = name;

    let newScreen: IScreen;
    switch (name) {
      case ScreenName.Splash:
        newScreen = new SplashScreen(this);
        break;
      case ScreenName.Menu:
        newScreen = new MenuScreen(this);
        break;
      case ScreenName.Credits:
        newScreen = new CreditsScreen(this);
        break;
      case ScreenName.LevelSelect:
        newScreen = new LevelSelectScreen(this);
        break;
      case ScreenName.Game: {
        newScreen = new GameScreen(this, rest[0] as number);
        break;
      }
    }
    newScreen.onResize();
    this.screen = newScreen;
  }

  update(dt: number): void {
    const { screen, context } = this;
    screen.update(dt);

    screen.draw(context);
  }
}
