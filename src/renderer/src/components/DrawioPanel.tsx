import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef
} from 'react'
import type { ParsedDiagram } from '../lib/drawio-parser'
import { DRAWIO_EMBED_URL, EMPTY_DRAWIO_XML } from '../lib/drawio-default'

const DRAWIO_ORIGINS = new Set([
  'https://embed.diagrams.net',
  'https://app.diagrams.net',
  'https://www.diagrams.net'
])

export interface DrawioPanelHandle {
  loadDiagram: (diagram: ParsedDiagram) => void
  exportXml: () => Promise<string | null>
}

interface DrawioPanelProps {
  onReady?: () => void
}

export const DrawioPanel = forwardRef(function DrawioPanel(
  { onReady }: DrawioPanelProps,
  ref: ForwardedRef<DrawioPanelHandle>
) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const readyRef = useRef(false)
    const [ready, setReady] = useState(false)
    const [loadError, setLoadError] = useState('')
    const pendingRef = useRef<ParsedDiagram | null>(null)
    const exportResolveRef = useRef<((xml: string | null) => void) | null>(null)

    const post = useCallback((payload: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), '*')
    }, [])

    const applyLoad = useCallback(
      (diagram: ParsedDiagram) => {
        if (diagram.type === 'mermaid') {
          post({
            action: 'load',
            descriptor: { format: 'mermaid', data: diagram.content }
          })
        } else {
          post({ action: 'load', xml: diagram.content, autosave: 1 })
        }
      },
      [post]
    )

    const loadDiagram = useCallback(
      (diagram: ParsedDiagram) => {
        if (!readyRef.current) {
          pendingRef.current = diagram
          return
        }
        applyLoad(diagram)
      },
      [applyLoad]
    )

    const exportXml = useCallback(
      () =>
        new Promise<string | null>((resolve) => {
          if (!readyRef.current) {
            resolve(null)
            return
          }
          exportResolveRef.current = resolve
          post({ action: 'export', format: 'xml' })
        }),
      [post]
    )

    const copyToClipboard = async () => {
      const xml = await exportXml()
      if (xml) await navigator.clipboard.writeText(xml)
    }

    const reloadEditor = () => {
      readyRef.current = false
      setReady(false)
      setLoadError('')
      pendingRef.current = null
      if (iframeRef.current) {
        iframeRef.current.src = DRAWIO_EMBED_URL
      }
    }

    useImperativeHandle(ref, () => ({
      loadDiagram,
      exportXml
    }))

    useEffect(() => {
      const timeout = window.setTimeout(() => {
        if (!readyRef.current) {
          setLoadError('draw.io 加载超时，请检查网络后点击重试')
        }
      }, 45000)

      const onMessage = (event: MessageEvent) => {
        if (DRAWIO_ORIGINS.size > 0 && event.origin && !DRAWIO_ORIGINS.has(event.origin)) {
          return
        }
        if (typeof event.data !== 'string') return

        let msg: { event?: string; xml?: string; data?: string; message?: string }
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg.event === 'init') {
          readyRef.current = true
          setReady(true)
          setLoadError('')
          onReady?.()

          // spin=1 时必须先 load 才会结束「加载中」；无待加载图则打开空白画布
          const pending = pendingRef.current
          pendingRef.current = null
          if (pending) {
            applyLoad(pending)
          } else {
            post({ action: 'load', xml: EMPTY_DRAWIO_XML, autosave: 1 })
          }
        }

        if (msg.event === 'export' && exportResolveRef.current) {
          exportResolveRef.current(msg.data ?? msg.xml ?? null)
          exportResolveRef.current = null
        }
      }

      window.addEventListener('message', onMessage)
      return () => {
        window.clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
      }
    }, [onReady, applyLoad, post])

    return (
      <div className="drawio-panel">
        <div className="panel-toolbar">
          <span className="badge">
            {loadError ? '加载异常' : ready ? '编辑器已就绪' : '正在连接 draw.io…'}
          </span>
          <div className="toolbar-actions">
            {loadError && (
              <button type="button" className="btn ghost" onClick={reloadEditor}>
                重试
              </button>
            )}
            <button
              type="button"
              className="btn ghost"
              disabled={!ready}
              onClick={() => void copyToClipboard()}
            >
              导出到剪贴板
            </button>
          </div>
        </div>
        {loadError && <div className="drawio-error">{loadError}</div>}
        <iframe
          ref={iframeRef}
          className="drawio-frame"
          title="draw.io"
          src={DRAWIO_EMBED_URL}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    )
})
