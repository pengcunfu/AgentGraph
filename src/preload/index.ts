import { contextBridge, ipcRenderer } from 'electron'

export type AppTheme = 'dark' | 'light'

export interface AppSettings {
  apiKey: string
  baseURL: string
  model: string
  theme: AppTheme
}

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', settings)
})
