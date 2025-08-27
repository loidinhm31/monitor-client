declare module "@tauri-apps/plugin-fs" {
  export function exists(path: string): Promise<boolean>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function writeFile(path: string, data: Uint8Array): Promise<void>;
  export function readFile(path: string): Promise<Uint8Array>;
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, contents: string): Promise<void>;
  export function removeFile(path: string): Promise<void>;
  export function removeDir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

declare module "@tauri-apps/api/path" {
  export function appConfigDir(): Promise<string>;
  export function appDataDir(): Promise<string>;
  export function appLocalDataDir(): Promise<string>;
  export function appCacheDir(): Promise<string>;
  export function appLogDir(): Promise<string>;
  export function audioDir(): Promise<string>;
  export function cacheDir(): Promise<string>;
  export function configDir(): Promise<string>;
  export function dataDir(): Promise<string>;
  export function desktopDir(): Promise<string>;
  export function documentDir(): Promise<string>;
  export function downloadDir(): Promise<string>;
  export function executableDir(): Promise<string>;
  export function fontDir(): Promise<string>;
  export function homeDir(): Promise<string>;
  export function localDataDir(): Promise<string>;
  export function pictureDir(): Promise<string>;
  export function publicDir(): Promise<string>;
  export function resourceDir(): Promise<string>;
  export function runtimeDir(): Promise<string>;
  export function templateDir(): Promise<string>;
  export function videoDir(): Promise<string>;
  export function join(...paths: string[]): Promise<string>;
  export function dirname(path: string): Promise<string>;
  export function basename(path: string, ext?: string): Promise<string>;
  export function extname(path: string): Promise<string>;
  export function isAbsolute(path: string): Promise<boolean>;
  export function resolve(path: string): Promise<string>;
  export function normalize(path: string): Promise<string>;
}

declare module "@tauri-apps/api/core" {
  export function invoke<T = any>(command: string, args?: Record<string, any>): Promise<T>;
}

// Global Tauri interface extension
declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}
