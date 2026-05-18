import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { DrawioPanel, type DrawioPanelHandle } from './components/DrawioPanel'
import { SettingsModal } from './components/SettingsModal'
import type { ChatSettings } from './lib/openai-client'
import type { ParsedDiagram } from './lib/drawio-parser'
import './styles.css'

const defaultSettings: ChatSettings = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini'
}

export default function App() {
  const drawioRef = useRef<DrawioPanelHandle>(null)
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => {
      setSettings({
        apiKey: s.apiKey ?? '',
        baseURL: s.baseURL ?? defaultSettings.baseURL,
        model: s.model ?? defaultSettings.model
      })
    })
  }, [])

  const saveSettings = async (next: ChatSettings) => {
    setSettings(next)
    if (window.electronAPI) {
      await window.electronAPI.setSettings(next)
    }
  }

  const onDiagram = useCallback((diagram: ParsedDiagram) => {
    drawioRef.current?.loadDiagram(diagram)
    setStatus(diagram.type === 'mermaid' ? '已导入 Mermaid 图表' : '已加载 draw.io 图表')
    setTimeout(() => setStatus(''), 3000)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">◇</span>
          <span>AgentGraph DrawIO</span>
        </div>
        <div className="header-actions">
          {status && <span className="status">{status}</span>}
          <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}>
            设置
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="pane chat-pane">
          <ChatPanel settings={settings} onDiagram={onDiagram} drawioRef={drawioRef} />
        </section>
        <section className="pane drawio-pane">
          <DrawioPanel ref={drawioRef} />
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
