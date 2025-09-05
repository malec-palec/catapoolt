declare const c: HTMLCanvasElement;

interface ImportMetaEnv {
  readonly VITE_START_SCREEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
