declare global {
  interface Window {
    __TAURI__?: any;
  }
}

// Type definitions for Tauri commands
export interface TauriCommands {
  greet: (name: string) => Promise<string>;
  ensure_directory: (path: string) => Promise<void>;
  save_file: (fileName: string, data: string, path: string) => Promise<void>;
  get_app_data_dir: () => Promise<string>;
  get_document_dir: () => Promise<string>;
}

export class TauriFileManager {
  static async ensureDirectory(path: string): Promise<boolean> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("ensure_directory", { path });
      return true;
    } catch (error) {
      console.error("Failed to create directory:", error);
      return false;
    }
  }

  static async saveFile(fileName: string, data: string, path: string): Promise<boolean> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_file", { fileName, data, path });
      return true;
    } catch (error) {
      console.error("Failed to save file:", error);
      return false;
    }
  }

  static async getAppDataDir(): Promise<string | null> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("get_app_data_dir");
    } catch (error) {
      console.error("Failed to get app data directory:", error);
      return null;
    }
  }

  static async getDocumentDir(): Promise<string | null> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke("get_document_dir");
    } catch (error) {
      console.error("Failed to get document directory:", error);
      return null;
    }
  }

  static isTauriEnvironment(): boolean {
    return typeof window !== "undefined" && window.__TAURI__;
  }
}

export default TauriFileManager;
