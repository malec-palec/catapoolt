import { IScreen, IScreenManager, ScreenConstructor } from "./base-screen";
import { device, getOptimalCanvasSettings } from "./device-detection";
import { CreditsScreen } from "./screens/credits-screen";
import { GameScreen } from "./screens/game-screen";
import { HighScoresScreen } from "./screens/high-scores-screen";
import { SplashScreen } from "./screens/splash-screen";
import { StartScreen } from "./screens/start-screen";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGame extends IScreenManager {}

const SCREENS: Record<string, ScreenConstructor> = {
  SplashScreen,
  StartScreen,
  GameScreen,
  HighScoresScreen,
  CreditsScreen,
};

const getCanvasCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
  const rect = c.getBoundingClientRect();
  // Calculate relative position within the displayed canvas
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;
  // Calculate scale factors based on actual displayed size vs internal canvas size
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  // Apply scaling to get internal canvas coordinates and clamp in one step
  return {
    x: Math.max(0, Math.min(c.width, relativeX * scaleX)),
    y: Math.max(0, Math.min(c.height, relativeY * scaleY)),
  };
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
  private touchStartPosition: { x: number; y: number } | null = null;

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

    // Mouse events
    c.onclick = mouseHandler((x, y) => this.screen.onClick(x, y));
    c.onmousedown = mouseHandler((x, y) => this.screen.onMouseDown(x, y));
    c.onmouseup = mouseHandler((x, y) => this.screen.onMouseUp(x, y));
    c.onmousemove = mouseHandler((x, y) => this.screen.onMouseMove(x, y));
    c.onmouseleave = mouseHandler((x, y) => this.screen.onMouseLeave(x, y));

    // Touch events with proper event options for iOS and Android
    c.addEventListener(
      "touchstart",
      touchHandler((x, y) => {
        this.touchStartPosition = { x, y };
        this.screen.onMouseDown(x, y);
      }),
      { passive: false },
    );

    c.addEventListener(
      "touchend",
      touchHandler((x, y) => {
        this.screen.onMouseUp(x, y);
        // Simulate click if touch end is close to touch start
        if (this.touchStartPosition) {
          const dx = x - this.touchStartPosition.x;
          const dy = y - this.touchStartPosition.y;
          // If touch moved less than 10 pixels, treat it as a click
          if (dx * dx + dy * dy < 100) {
            this.screen.onClick(x, y);
          }
          this.touchStartPosition = null;
        }
      }),
      { passive: false },
    );

    c.addEventListener(
      "touchmove",
      touchHandler((x, y) => this.screen.onMouseMove(x, y)),
      { passive: false },
    );

    // Handle touch cancel (important for Android)
    c.addEventListener(
      "touchcancel",
      (event) => {
        event.preventDefault();
        // Simulate mouse up at last known position if we had a touch start
        if (this.touchStartPosition) {
          this.screen.onMouseUp(this.touchStartPosition.x, this.touchStartPosition.y);
          this.touchStartPosition = null;
        }
      },
      { passive: false },
    );

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
