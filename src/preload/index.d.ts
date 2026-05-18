import type { AppSettings } from './index'

declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<AppSettings>
      setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
    }
  }
}

export {}
