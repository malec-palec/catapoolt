declare const c: HTMLCanvasElement;

interface ImportMetaEnv {
  readonly VITE_HOME_SCREEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
