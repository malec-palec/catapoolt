import { IScreen, IScreenManager, ScreenConstructor } from "./screen";
import { CreditsScreen } from "./screens/credits-screen";
import { MenuScreen } from "./screens/menu-screen";
import { SlingGameScreen } from "./screens/sling-game-screen";
import { SplashScreen } from "./screens/splash-screen";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

const SCREENS: Record<string, ScreenConstructor> = {
  MenuScreen,
  SplashScreen,
  CreditsScreen,
  SlingGameScreen,
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
  private currentScreenConstructor: ScreenConstructor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentScreenArgs: any[];
  private isNavigatingBack = false;

  constructor() {
    const screenName = import.meta.env.VITE_START_SCREEN || "SplashScreen";
    const startScreenCtor = SCREENS[screenName];

    this.context = c.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.screen = new startScreenCtor(this);
    this.currentScreenConstructor = this.screen.constructor as ScreenConstructor;
    this.currentScreenArgs = [];

    history.replaceState(
      {
        screenName: this.currentScreenConstructor.name,
        args: this.currentScreenArgs,
      },
      "",
      "",
    );

    c.onclick = mouseHandler((x, y) => this.screen.onClick(x, y));
    c.onmousedown = mouseHandler((x, y) => this.screen.onMouseDown?.(x, y));
    c.onmouseup = mouseHandler((x, y) => this.screen.onMouseUp?.(x, y));
    c.onmousemove = mouseHandler((x, y) => this.screen.onMouseMove(x, y));
    c.ontouchstart = touchHandler((x, y) => this.screen.onMouseDown?.(x, y));
    c.ontouchend = touchHandler((x, y) => this.screen.onMouseUp?.(x, y));
    c.ontouchmove = touchHandler((x, y) => this.screen.onMouseMove(x, y));
    window.onpopstate = (event) => {
      if (event.state && event.state.screenName) {
        const screenConstructor = SCREENS[event.state.screenName];
        if (screenConstructor) {
          this.isNavigatingBack = true;
          this.changeScreen(screenConstructor, ...(event.state.args || []));
          this.isNavigatingBack = false;
        }
      }
    };
    window.onresize = () => this.screen.onResize();

    this.screen.onResize();
  }

  changeScreen(screenCtor: ScreenConstructor, ...rest: any[]): void {
    this.screen.destroy();

    c.style.cursor = "default";

    if (!this.isNavigatingBack && screenCtor !== this.currentScreenConstructor) {
      history.pushState(
        {
          screenName: screenCtor.name,
          args: rest,
        },
        "",
        "",
      );
    }
    this.currentScreenConstructor = screenCtor;
    this.currentScreenArgs = rest;

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
