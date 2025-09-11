declare const c: HTMLCanvasElement;

interface ImportMetaEnv {
  readonly VITE_HOME_SCREEN?: string;
  readonly PACKAGE_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Pico8 Audio Player Types
interface Pico8AudioSource {
  stop(): void;
}

declare class Pico8 {
  constructor(sfx: string, music: string);
  sfx(index: number): Pico8AudioSource;
  music(index: number): Pico8AudioSource;
}

// Global declarations for the Pico8 audio player
declare const Pico8: typeof Pico8;
