declare const c: HTMLCanvasElement;

interface ImportMetaEnv {
  readonly VITE_HOME_SCREEN?: string;
  readonly PACKAGE_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
