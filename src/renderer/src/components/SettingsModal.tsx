import { useEffect, useState } from 'react'
import type { ChatSettings } from '../lib/openai-client'

export type AppTheme = 'dark' | 'light'

export interface AppFormSettings extends ChatSettings {
  theme: AppTheme
}

interface SettingsModalProps {
  open: boolean
  settings: AppFormSettings
  onClose: () => void
  onSave: (settings: AppFormSettings) => void
}

export function SettingsModal({ open, settings, onClose, onSave }: SettingsModalProps) {
  const [form, setForm] = useState(settings)

  useEffect(() => {
    if (open) setForm(settings)
  }, [open, settings])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>设置</h2>

        <label>
          界面主题
          <div className="theme-options">
            <button
              type="button"
              className={`theme-option${form.theme === 'dark' ? ' active' : ''}`}
              onClick={() => setForm({ ...form, theme: 'dark' })}
            >
              深色
            </button>
            <button
              type="button"
              className={`theme-option${form.theme === 'light' ? ' active' : ''}`}
              onClick={() => setForm({ ...form, theme: 'light' })}
            >
              浅色
            </button>
          </div>
        </label>

        <h2 style={{ marginTop: 8 }}>API 设置（OpenAI 协议）</h2>
        <label>
          Base URL
          <input
            value={form.baseURL}
            onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label>
          API Key
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </label>
        <label>
          模型
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="gpt-4o-mini"
          />
        </label>
        <p className="hint">
          兼容 OpenAI Chat Completions 的服务均可使用（OpenAI、Azure、OneAPI、Ollama 等）。
        </p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onSave(form)
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
