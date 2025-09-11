/**
 * Debug console overlay for the game
 * Displays console messages on top of the game canvas
 */

export class DebugConsole {
  private messages: string[] = [];
  private maxMessages = 10;
  private element: HTMLDivElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.id = "debug-console";
    this.element.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(this.element);

    // Override console methods
    this.interceptConsole();
  }

  private interceptConsole(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      this.addMessage("LOG", args.join(" "));
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      this.addMessage("WARN", args.join(" "));
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      this.addMessage("ERROR", args.join(" "));
    };
  }

  private addMessage(type: string, message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${type}: ${message}`;

    this.messages.push(formattedMessage);

    // Keep only the last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.render();
  }

  private render(): void {
    this.element.innerHTML = this.messages.map((msg) => `<div>${msg}</div>`).join("");

    // Auto-scroll to bottom
    this.element.scrollTop = this.element.scrollHeight;
  }

  public show(): void {
    this.element.style.display = "block";
  }

  public hide(): void {
    this.element.style.display = "none";
  }

  public toggle(): void {
    if (this.element.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  public clear(): void {
    this.messages = [];
    this.render();
  }
}

// Create global debug console instance
export const debugConsole = new DebugConsole();

// Add keyboard shortcut to toggle console (F12 or Ctrl+`)
window.addEventListener("keydown", (event) => {
  if (event.key === "F12" || (event.ctrlKey && event.key === "`")) {
    event.preventDefault();
    debugConsole.toggle();
  }
});

// Show console by default in development
if (import.meta.env.DEV) {
  debugConsole.show();
  console.log("🐛 Debug console initialized");
  console.log("📋 Press F12 or Ctrl+` to toggle console");
  console.log("🎮 Click buttons to see detailed logging");
  console.log("🔊 Audio initialization will be logged on first interaction");
}
