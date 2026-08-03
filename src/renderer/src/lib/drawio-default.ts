/** 空白画布，用于 embed 模式 init 后解除 spin 加载状态 */
export const EMPTY_DRAWIO_XML = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`

/** embed 参数：不用 spin=1，避免未 load 时一直转圈；隐藏保存/退出（常驻编辑器无需退出） */
const DRAWIO_EMBED_BASE =
  'https://embed.diagrams.net/?embed=1&proto=json&libraries=1&saveAndExit=0&noSaveBtn=1&noExitBtn=1'

export function getDrawioEmbedUrl(theme: 'dark' | 'light' = 'dark'): string {
  const ui = theme === 'dark' ? 'dark' : 'atlas'
  return `${DRAWIO_EMBED_BASE}&ui=${ui}`
}
