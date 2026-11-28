/**
 * 调研/文章正文外的页脚注解：适用范围、风险提示等（从正文 HTML 拆出）。
 */
export default function ArticleBoundaryFootnotes({ html }) {
  if (!html) return null
  return (
    <aside
      className="research-article-footnotes mt-10 border-t border-[var(--site-line)] pt-5"
      aria-label="注解说明"
    >
      <p className="research-article-footnotes__label mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-muted)]">
        注解
      </p>
      <div
        className="prose-tuaran research-article-footnotes__prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </aside>
  )
}