import { contextBridge, ipcRenderer } from 'electron'

export interface AppSettings {
  apiKey: string
  baseURL: string
  model: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', settings)
})
