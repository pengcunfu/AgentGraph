import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  apiKey: string
  baseURL: string
  model: string
}

const defaults: AppSettings = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini'
}

function settingsPath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'settings.json')
}

export function getSettings(): AppSettings {
  const path = settingsPath()
  if (!existsSync(path)) return { ...defaults }
  try {
    return { ...defaults, ...JSON.parse(readFileSync(path, 'utf-8')) }
  } catch {
    return { ...defaults }
  }
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...partial }
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}
