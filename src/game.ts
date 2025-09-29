import { IScreen, IScreenManager, ScreenConstructor } from "./base-screen";
import { Point2D } from "./core/geom";
import { device, getOptimalCanvasSettings } from "./device-detection";
import { CreditsScreen } from "./screens/credits-screen";
import { GameScreen } from "./screens/game-screen";
import { HighScoresScreen } from "./screens/high-scores-screen";
import { SplashScreen } from "./screens/splash-screen";
import { StartScreen } from "./screens/start-screen";
import { max, min } from "./system";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

const SCREENS: Record<string, ScreenConstructor> = {
  SplashScreen,
  StartScreen,
  GameScreen,
  HighScoresScreen,
  CreditsScreen,
};

const getCanvasCoordinates = (clientX: number, clientY: number): Point2D => {
  const rect = c.getBoundingClientRect();
  // Calculate relative position within the displayed canvas
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;
  // Calculate scale factors based on actual displayed size vs internal canvas size
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  // Apply scaling to get internal canvas coordinates and clamp in one step
  return {
    x: max(0, min(c.width, relativeX * scaleX)),
    y: max(0, min(c.height, relativeY * scaleY)),
  };
};

const pointerHandler =
  (callback: (point: Point2D) => void) =>
  (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    callback(getCanvasCoordinates(event.clientX, event.clientY));
  };
export class Game implements IGame {
  private context: CanvasRenderingContext2D;
  private screen: IScreen;

  constructor() {
    // Use device-specific canvas settings to prevent flickering
    const canvasSettings = getOptimalCanvasSettings();
    console.log(
      `🎨 Using canvas settings for ${device.isIOS ? "iOS" : device.isAndroid ? "Android" : "Desktop"}:`,
      canvasSettings,
    );

    this.context = c.getContext("2d", canvasSettings)!;

    let screenName = "SplashScreen";
    if (import.meta.env.DEV) screenName = import.meta.env.VITE_HOME_SCREEN!;
    const homeScreenCtor = SCREENS[screenName];
    this.screen = new homeScreenCtor(this);

    c.onpointerdown = pointerHandler((point) => this.screen.onPointerDown(point));
    c.onpointermove = pointerHandler((point) => this.screen.onPointerMove(point));
    c.onpointerup = pointerHandler((point) => this.screen.onPointerUp(point));
    c.onpointerleave = pointerHandler((point) => this.screen.onPointerLeave(point));

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

  tick(dt: number): void {
    this.screen.tick(dt);
    this.screen.render(this.context);
  }
}
