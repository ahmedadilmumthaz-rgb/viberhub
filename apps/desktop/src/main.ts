/**
 * Viber Hub Desktop Companion (Electron)
 * 
 * Boundary Compliance:
 * - Strictly an operator assistant for task retrieval, notifications, and copy-to-clipboard handoff.
 * - DOES NOT reverse-engineer Viber protocol, automate keystrokes, or scrape memory.
 */

import { app, BrowserWindow, ipcMain, clipboard, shell } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    title: 'Viber Hub — Desktop Companion',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load paired companion dashboard or web dashboard URL
  const serverUrl = process.env.VIBERHUB_SERVER_URL || 'http://localhost:3000';
  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // IPC: Copy text to clipboard and open Viber Desktop
  ipcMain.handle('handoff-to-viber', async (_event: any, { text, phoneNumber }: { text: string; phoneNumber?: string }) => {
    // 1. Copy prepared message text to OS clipboard
    clipboard.writeText(text);

    // 2. Open Viber via standard registered URI scheme or OS application launcher
    // This brings Viber to focus for the operator to select the chat and paste
    try {
      if (phoneNumber) {
        // Viber registered custom URL scheme (standard deep link to initiate contact chat)
        await shell.openExternal(`viber://chat?number=${encodeURIComponent(phoneNumber)}`);
      } else {
        await shell.openExternal('viber://');
      }
      return { success: true, message: 'Message copied to clipboard and Viber activated.' };
    } catch (err: any) {
      console.warn('Could not launch viber:// URI scheme, falling back to clipboard only:', err);
      return { success: true, message: 'Message copied to clipboard. Please paste in Viber.' };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
