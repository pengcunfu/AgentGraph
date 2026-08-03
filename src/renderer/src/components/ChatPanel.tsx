import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatSettings } from '../lib/openai-client'
import { streamChat } from '../lib/openai-client'
import { extractDiagramFromText } from '../lib/drawio-parser'
import type { ParsedDiagram } from '../lib/drawio-parser'
import type { DrawioStatus } from './DrawioPanel'

interface ChatPanelProps {
  settings: ChatSettings
  onDiagram: (diagram: ParsedDiagram) => void
  drawioRef: React.RefObject<{
    exportXml: () => Promise<string | null>
    copyToClipboard: () => Promise<boolean>
    reload: () => void
  } | null>
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenSettings: () => void
  editorStatus: DrawioStatus
  editorMessage?: string
  notice?: string
}

export function ChatPanel({
  settings,
  onDiagram,
  drawioRef,
  theme,
  onToggleTheme,
  onOpenSettings,
  editorStatus,
  editorMessage,
  notice
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '你好！描述你想要的图表（流程图、架构图、ER 图等），我会用 draw.io 格式生成并自动加载到左侧编辑器。'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!settings.apiKey && !/localhost|127\.0\.0\.1/i.test(settings.baseURL)) {
      alert('请先在设置中配置 API Key')
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextHistory = [...messages.filter((m) => m.role !== 'system'), userMsg]
    setMessages([...nextHistory, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let contextPrefix = ''
      const exported = await drawioRef.current?.exportXml()
      if (exported && exported.includes('<mxGraphModel')) {
        contextPrefix = `当前画布中的 draw.io XML（供修改参考）：\n\`\`\`drawio\n${exported}\n\`\`\`\n\n用户请求：`
      }

      const full = await streamChat(
        settings,
        nextHistory.map((m, i) =>
          i === nextHistory.length - 1 && m.role === 'user'
            ? { ...m, content: contextPrefix + m.content }
            : m
        ),
        (delta) => {
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: last.content + delta }
            }
            return copy
          })
        },
        controller.signal
      )

      const diagram = extractDiagramFromText(full)
      if (diagram) onDiagram(diagram)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { role: 'assistant', content: `请求失败：${message}` }
        }
        return copy
      })
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。请描述你需要绘制的图表。'
      }
    ])
  }

  const editorLabel =
    editorStatus === 'error'
      ? '加载异常'
      : editorStatus === 'ready'
        ? '编辑器已就绪'
        : '正在连接 draw.io…'

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="brand">
          <span className="logo">◇</span>
          <div className="brand-text">
            <span className="brand-title">AgentGraph DrawIO</span>
            <span className="brand-sub">AI 绘图助手</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn ghost sm theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            {theme === 'dark' ? '浅色' : '深色'}
          </button>
          <button type="button" className="btn ghost sm" onClick={onOpenSettings}>
            设置
          </button>
        </div>
      </div>

      <div className="chat-toolbar">
        <span className={`badge${editorStatus === 'error' ? ' error' : ''}`}>{editorLabel}</span>
        <div className="toolbar-actions">
          {editorStatus === 'error' && (
            <button type="button" className="btn ghost sm" onClick={() => drawioRef.current?.reload()}>
              重试
            </button>
          )}
          <button
            type="button"
            className="btn ghost sm"
            disabled={editorStatus !== 'ready'}
            onClick={() => void drawioRef.current?.copyToClipboard()}
          >
            导出到剪贴板
          </button>
          <button type="button" className="btn ghost sm" onClick={clearChat} disabled={loading}>
            清空
          </button>
        </div>
      </div>

      {notice && <div className="chat-notice">{notice}</div>}
      {editorStatus === 'error' && editorMessage && (
        <div className="chat-notice error">{editorMessage}</div>
      )}

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="role-label">{m.role === 'user' ? '你' : '助手'}</span>
            <pre className="bubble-text">{m.content}</pre>
          </div>
        ))}
        {loading && <div className="typing">正在生成…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="例如：画一个用户登录的流程图，包含验证码分支"
          rows={3}
          disabled={loading}
        />
        <div className="input-actions">
          {loading ? (
            <button type="button" className="btn danger" onClick={stop}>
              停止
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => void send()} disabled={!input.trim()}>
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
