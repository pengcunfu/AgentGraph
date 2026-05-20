/** 空白画布，用于 embed 模式 init 后解除 spin 加载状态 */
export const EMPTY_DRAWIO_XML = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  </root>
</mxGraphModel>`

/** embed 参数：不用 spin=1，避免未 load 时一直转圈 */
export const DRAWIO_EMBED_URL =
  'https://embed.diagrams.net/?embed=1&ui=atlas&proto=json&libraries=1&saveAndExit=0&noSaveBtn=1'
