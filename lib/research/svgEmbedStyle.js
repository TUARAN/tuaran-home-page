// 调研内嵌 SVG 的独立文档配色。
//
// 正文页里 SVG 形状只写语义 class（sem-core 等），颜色由 app/globals.css 的
// `.prose-tuaran .research-inline-diagram .sem-*` 规则统一维护，明暗各一套。
// 但「查看图片 → 在新标签打开」会把 SVG 序列化成 blob 独立文档，站点 CSS 不随行，
// 语义 class 无样式，fill 回退默认黑色，整张图变成黑块（Issue #430）。
//
// 这里提供一份与 globals.css 语义色板同步的内嵌样式，注入到独立文档的 SVG 里；
// 用 prefers-color-scheme 覆盖明暗两套。正文页不受影响：页面级规则特异性
// （0,3,0）高于本样式（0,1,0）。mm-* 为思维导图配色，与 globals.css 保持同步。

export const SVG_EMBED_STYLE_TEXT = `
  .sem-core { fill: #e6f1fb; stroke: #185fa5; }
  .sem-good { fill: #e1f5ee; stroke: #0f6e56; }
  .sem-warn { fill: #fbf0dc; stroke: #b07a2a; }
  .sem-risk { fill: #fbe9e7; stroke: #b0433a; }
  .sem-mute { fill: #eef0ed; stroke: #a6aca4; }
  .sem-core-ink { fill: #0c447c; stroke: none; }
  .sem-good-ink { fill: #0b5a45; stroke: none; }
  .sem-warn-ink { fill: #7a4b12; stroke: none; }
  .sem-risk-ink { fill: #8a2f27; stroke: none; }
  .sem-mute-ink { fill: #4b514b; stroke: none; }
  .sem-surface { fill: #ffffff; stroke: #c7ccc4; }
  .sem-edge { fill: none; stroke: #c7ccc4; }
  .sem-grad-start { stop-color: #e6f1fb; }
  .sem-grad-end { stop-color: #185fa5; }
  .mm-center { fill: #4a6fa5; }
  .mm-center_text { fill: #ffffff; font-weight: 600; }
  .mm-branch { fill: #e9ebe6; stroke: #c3c5c0; }
  .mm-branch_text { fill: #15140f; font-weight: 600; }
  .mm-leaf { fill: #f7f8f5; stroke: #d0d2cd; }
  .mm-leaf_text { fill: #262724; }
  .mm-line { fill: none; stroke: #b4b6b1; stroke-width: 1.5; }
  .mm-label { font-family: sans-serif; font-size: 13px; }
  @media (prefers-color-scheme: dark) {
    .sem-core { fill: #16293b; stroke: #5b8fc4; }
    .sem-good { fill: #152b23; stroke: #4a9d77; }
    .sem-warn { fill: #2e2412; stroke: #bd944a; }
    .sem-risk { fill: #301b19; stroke: #c47066; }
    .sem-mute { fill: #222420; stroke: #6b7067; }
    .sem-core-ink { fill: #bcd8f2; stroke: none; }
    .sem-good-ink { fill: #b3e2c9; stroke: none; }
    .sem-warn-ink { fill: #ecd6a6; stroke: none; }
    .sem-risk-ink { fill: #f0c4bd; stroke: none; }
    .sem-mute-ink { fill: #c3c7be; stroke: none; }
    .sem-surface { fill: #171512; stroke: #4a4841; }
    .sem-edge { fill: none; stroke: #4a4841; }
    .sem-grad-start { stop-color: #16293b; }
    .sem-grad-end { stop-color: #5b8fc4; }
    .mm-center { fill: #5b7fb8; }
    .mm-branch { fill: #1c1d1b; stroke: #373836; }
    .mm-branch_text { fill: #dee0db; }
    .mm-leaf { fill: #161513; stroke: #2c2d2b; }
    .mm-leaf_text { fill: #b4b6b1; }
    .mm-line { stroke: #41423f; }
  }
`

export const SVG_EMBED_STYLE_MARK = 'data-svg-embed-style'

// 在 <svg> 开标签后插入内嵌样式，使 blob 独立文档也能按语义 class 显示配色。
// 幂等：已带标记的输入原样返回。
export function buildStandaloneSvgMarkup(svgMarkup) {
  if (typeof svgMarkup !== 'string' || !/<svg\b/i.test(svgMarkup)) return svgMarkup
  if (svgMarkup.includes(SVG_EMBED_STYLE_MARK)) return svgMarkup
  return svgMarkup.replace(
    /(<svg\b[^>]*>)/i,
    // 属性必须带值：blob 文档按 image/svg+xml 用 XML 解析器解析，无值属性会直接报错
    `$1<style ${SVG_EMBED_STYLE_MARK}="true">${SVG_EMBED_STYLE_TEXT}</style>`,
  )
}
