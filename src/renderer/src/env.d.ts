/// <reference types="vite/client" />

type AppTheme = 'dark' | 'light'

interface AppSettings {
  apiKey: string
  baseURL: string
  model: string
  theme: AppTheme
}

interface Window {
  electronAPI?: {
    getSettings: () => Promise<AppSettings>
    setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  }
}
