import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import {
  DrawioPanel,
  type DrawioPanelHandle,
  type DrawioStatus
} from './components/DrawioPanel'
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
  const [notice, setNotice] = useState('')
  const [editorStatus, setEditorStatus] = useState<DrawioStatus>('loading')
  const [editorMessage, setEditorMessage] = useState('')

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
    setNotice(diagram.type === 'mermaid' ? '已导入 Mermaid 图表' : '已加载 draw.io 图表')
    setTimeout(() => setNotice(''), 3000)
  }, [])

  const onEditorStatus = useCallback((status: DrawioStatus, message?: string) => {
    setEditorStatus(status)
    setEditorMessage(status === 'error' ? message ?? '' : '')
  }, [])

  const chatSettings: ChatSettings = {
    apiKey: settings.apiKey,
    baseURL: settings.baseURL,
    model: settings.model
  }

  return (
    <div className="app">
      <main className="app-main">
        <section className="pane drawio-pane">
          <DrawioPanel
            ref={drawioRef}
            theme={settings.theme}
            onStatusChange={onEditorStatus}
          />
        </section>
        <section className="pane chat-pane">
          <ChatPanel
            settings={chatSettings}
            onDiagram={onDiagram}
            drawioRef={drawioRef}
            theme={settings.theme}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setSettingsOpen(true)}
            editorStatus={editorStatus}
            editorMessage={editorMessage}
            notice={notice}
          />
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
