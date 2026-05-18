const DRAWIO_BLOCK = /```(?:drawio|xml)\s*\n([\s\S]*?)```/gi
const GENERIC_XML_BLOCK = /```(?:xml)?\s*\n([\s\S]*?<mxGraphModel[\s\S]*?)```/gi
const MERMAID_BLOCK = /```mermaid\s*\n([\s\S]*?)```/gi

function normalizeXml(raw: string): string {
  let xml = raw.trim()
  if (xml.startsWith('<?xml')) {
    const idx = xml.indexOf('<mxGraphModel')
    if (idx >= 0) xml = xml.slice(idx)
  }
  if (!xml.includes('<mxGraphModel')) {
    const start = xml.indexOf('<mxGraphModel')
    const end = xml.lastIndexOf('</mxGraphModel>')
    if (start >= 0 && end >= 0) {
      xml = xml.slice(start, end + '</mxGraphModel>'.length)
    }
  }
  return xml
}

export interface ParsedDiagram {
  type: 'drawio' | 'mermaid'
  content: string
}

export function extractDiagramFromText(text: string): ParsedDiagram | null {
  for (const re of [DRAWIO_BLOCK, GENERIC_XML_BLOCK]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const xml = normalizeXml(m[1])
      if (xml.includes('<mxGraphModel')) {
        return { type: 'drawio', content: xml }
      }
    }
  }

  const inline = text.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/)
  if (inline) {
    return { type: 'drawio', content: normalizeXml(inline[0]) }
  }

  MERMAID_BLOCK.lastIndex = 0
  const mm = MERMAID_BLOCK.exec(text)
  if (mm) {
    return { type: 'mermaid', content: mm[1].trim() }
  }

  return null
}
