import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('viberHubCompanion', {
  handoffToViber: (payload: { text: string; phoneNumber?: string }) =>
    ipcRenderer.invoke('handoff-to-viber', payload),
  platform: process.platform,
  isCompanion: true
});
