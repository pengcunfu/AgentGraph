import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { DrawioPanel, type DrawioPanelHandle } from './components/DrawioPanel'
import { SettingsModal, type AppFormSettings, type AppTheme } from './components/SettingsModal'
import type { ChatSettings } from './lib/openai-client'
import type { ParsedDiagram } from './lib/drawio-parser'
import './styles.css'

const defaultSettings: AppFormSettings = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  theme: 'dark'
}

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export default function App() {
  const drawioRef = useRef<DrawioPanelHandle>(null)
  const [settings, setSettings] = useState<AppFormSettings>(defaultSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    applyTheme(defaultSettings.theme)
    window.electronAPI?.getSettings().then((s) => {
      const next: AppFormSettings = {
        apiKey: s.apiKey ?? '',
        baseURL: s.baseURL ?? defaultSettings.baseURL,
        model: s.model ?? defaultSettings.model,
        theme: s.theme === 'light' ? 'light' : 'dark'
      }
      setSettings(next)
      applyTheme(next.theme)
    })
  }, [])

  const saveSettings = async (next: AppFormSettings) => {
    setSettings(next)
    applyTheme(next.theme)
    if (window.electronAPI) {
      await window.electronAPI.setSettings(next)
    }
  }

  const toggleTheme = () => {
    const nextTheme: AppTheme = settings.theme === 'dark' ? 'light' : 'dark'
    void saveSettings({ ...settings, theme: nextTheme })
  }

  const onDiagram = useCallback((diagram: ParsedDiagram) => {
    drawioRef.current?.loadDiagram(diagram)
    setStatus(diagram.type === 'mermaid' ? '已导入 Mermaid 图表' : '已加载 draw.io 图表')
    setTimeout(() => setStatus(''), 3000)
  }, [])

  const chatSettings: ChatSettings = {
    apiKey: settings.apiKey,
    baseURL: settings.baseURL,
    model: settings.model
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">◇</span>
          <span>AgentGraph DrawIO</span>
        </div>
        <div className="header-actions">
          {status && <span className="status">{status}</span>}
          <button
            type="button"
            className="btn ghost theme-toggle"
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            {settings.theme === 'dark' ? '浅色' : '深色'}
          </button>
          <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}>
            设置
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="pane drawio-pane">
          <DrawioPanel ref={drawioRef} theme={settings.theme} />
        </section>
        <section className="pane chat-pane">
          <ChatPanel settings={chatSettings} onDiagram={onDiagram} drawioRef={drawioRef} />
        </section>
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => void saveSettings(s)}
      />
    </div>
  )
}
