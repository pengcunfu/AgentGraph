/// <reference types="vite/client" />

interface AppSettings {
  apiKey: string
  baseURL: string
  model: string
}

interface Window {
  electronAPI?: {
    getSettings: () => Promise<AppSettings>
    setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  }
}
