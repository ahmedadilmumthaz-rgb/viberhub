declare module 'electron' {
  export const app: {
    whenReady(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): void;
    quit(): void;
  };

  export class BrowserWindow {
    constructor(options?: any);
    loadURL(url: string): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): void;
    static getAllWindows(): BrowserWindow[];
  }

  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => Promise<any> | any): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
  };

  export const clipboard: {
    writeText(text: string): void;
    readText(): string;
  };

  export const shell: {
    openExternal(url: string): Promise<void>;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: any): void;
  };
}
