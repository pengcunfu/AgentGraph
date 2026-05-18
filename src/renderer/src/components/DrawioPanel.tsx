import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { ParsedDiagram } from '../lib/drawio-parser'

const EMBED_URL =
  'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&modified=unsavedChanges&proto=json&libraries=1'

export interface DrawioPanelHandle {
  loadDiagram: (diagram: ParsedDiagram) => void
  exportXml: () => Promise<string | null>
}

interface DrawioPanelProps {
  onReady?: () => void
}

export const DrawioPanel = forwardRef<DrawioPanelHandle, DrawioPanelProps>(
  function DrawioPanel({ onReady }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const readyRef = useRef(false)
    const [ready, setReady] = useState(false)
    const pendingRef = useRef<ParsedDiagram | null>(null)
    const exportResolveRef = useRef<((xml: string | null) => void) | null>(null)

    const post = (payload: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), '*')
    }

    const applyLoad = (diagram: ParsedDiagram) => {
      if (diagram.type === 'mermaid') {
        post({
          action: 'load',
          descriptor: { format: 'mermaid', data: diagram.content }
        })
      } else {
        post({ action: 'load', xml: diagram.content, autosave: 1 })
      }
    }

    const loadDiagram = (diagram: ParsedDiagram) => {
      if (!readyRef.current) {
        pendingRef.current = diagram
        return
      }
      applyLoad(diagram)
    }

    const exportXml = () =>
      new Promise<string | null>((resolve) => {
        if (!readyRef.current) {
          resolve(null)
          return
        }
        exportResolveRef.current = resolve
        post({ action: 'export', format: 'xml' })
      })

    const copyToClipboard = async () => {
      const xml = await exportXml()
      if (xml) await navigator.clipboard.writeText(xml)
    }

    useImperativeHandle(ref, () => ({
      loadDiagram,
      exportXml
    }))

    useEffect(() => {
      const onMessage = (event: MessageEvent) => {
        if (typeof event.data !== 'string') return
        let msg: { event?: string; xml?: string; data?: string }
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg.event === 'init') {
          readyRef.current = true
          setReady(true)
          onReady?.()
          if (pendingRef.current) {
            applyLoad(pendingRef.current)
            pendingRef.current = null
          }
        }

        if (msg.event === 'export' && exportResolveRef.current) {
          exportResolveRef.current(msg.data ?? msg.xml ?? null)
          exportResolveRef.current = null
        }
      }

      window.addEventListener('message', onMessage)
      return () => window.removeEventListener('message', onMessage)
    }, [onReady])

    return (
      <div className="drawio-panel">
        <div className="panel-toolbar">
          <span className="badge">{ready ? '编辑器已就绪' : '正在加载 draw.io…'}</span>
          <button
            type="button"
            className="btn ghost"
            disabled={!ready}
            onClick={() => void copyToClipboard()}
          >
            导出到剪贴板
          </button>
        </div>
        <iframe
          ref={iframeRef}
          className="drawio-frame"
          title="draw.io"
          src={EMBED_URL}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    )
  }
)
