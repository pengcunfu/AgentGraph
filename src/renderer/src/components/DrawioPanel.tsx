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
import { EMPTY_DRAWIO_XML, getDrawioEmbedUrl } from '../lib/drawio-default'

const DRAWIO_ORIGINS = new Set([
  'https://embed.diagrams.net',
  'https://app.diagrams.net',
  'https://www.diagrams.net'
])

export type DrawioStatus = 'loading' | 'ready' | 'error'

export interface DrawioPanelHandle {
  loadDiagram: (diagram: ParsedDiagram) => void
  exportXml: () => Promise<string | null>
  copyToClipboard: () => Promise<boolean>
  reload: () => void
}

interface DrawioPanelProps {
  theme?: 'dark' | 'light'
  onStatusChange?: (status: DrawioStatus, message?: string) => void
  onReady?: () => void
}

export const DrawioPanel = forwardRef(function DrawioPanel(
  { theme = 'dark', onStatusChange, onReady }: DrawioPanelProps,
  ref: ForwardedRef<DrawioPanelHandle>
) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const [embedUrl, setEmbedUrl] = useState(() => getDrawioEmbedUrl(theme))
  const pendingRef = useRef<ParsedDiagram | null>(null)
  const exportResolveRef = useRef<((xml: string | null) => void) | null>(null)
  const themeRef = useRef(theme)
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  const reportStatus = useCallback((status: DrawioStatus, message?: string) => {
    onStatusChangeRef.current?.(status, message)
  }, [])

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

  const copyToClipboard = useCallback(async () => {
    const xml = await exportXml()
    if (!xml) return false
    await navigator.clipboard.writeText(xml)
    return true
  }, [exportXml])

  const reloadEditor = useCallback(
    (nextTheme = theme, preserveXml?: string | null) => {
      readyRef.current = false
      reportStatus('loading')
      if (preserveXml?.includes('<mxGraphModel')) {
        pendingRef.current = { type: 'drawio', content: preserveXml }
      } else {
        pendingRef.current = null
      }
      const url = getDrawioEmbedUrl(nextTheme)
      setEmbedUrl(url)
      if (iframeRef.current) {
        iframeRef.current.src = url
      }
    },
    [theme, reportStatus]
  )

  useImperativeHandle(ref, () => ({
    loadDiagram,
    exportXml,
    copyToClipboard,
    reload: () => reloadEditor()
  }))

  useEffect(() => {
    reportStatus('loading')
  }, [reportStatus])

  useEffect(() => {
    if (themeRef.current === theme) return
    themeRef.current = theme

    let cancelled = false
    ;(async () => {
      const xml = readyRef.current ? await exportXml() : null
      if (cancelled || themeRef.current !== theme) return
      reloadEditor(theme, xml)
    })()

    return () => {
      cancelled = true
    }
  }, [theme, exportXml, reloadEditor])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!readyRef.current) {
        reportStatus('error', 'draw.io 加载超时，请检查网络后点击重试')
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
        reportStatus('ready')
        onReady?.()

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
  }, [onReady, applyLoad, post, reportStatus])

  return (
    <div className="drawio-panel">
      <iframe
        ref={iframeRef}
        className="drawio-frame"
        title="draw.io"
        src={embedUrl}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
})
