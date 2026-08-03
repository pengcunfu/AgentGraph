import type { AppSettings, AppTheme } from './index'

export type { AppSettings, AppTheme }

declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<AppSettings>
      setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
    }
  }
}

export {}
