declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

export type TauriFs = {
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
};

export type TauriPath = {
  downloadDir: () => Promise<string>;
};
