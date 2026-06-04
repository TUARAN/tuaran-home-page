// 长期罗盘内容渲染器：包装 marked，统一容错。
//
// 抽出来是为了：未来想换 renderer / 加 DOMPurify / 做 syntax highlight 时，
// 只动这一个文件，所有卡片自动跟上。

import { Marked } from 'marked'

const markdown = new Marked({ gfm: true, breaks: true })

export function renderMarkdown(text) {
  if (!text) return ''
  try {
    return markdown.parse(text)
  } catch {
    return ''
  }
}

// 标准卡片 prose 样式（卡片正文容器用）。
// 抽常量是为了 RecordCard / Timeline / Snapshot 等地复用同一种排版。
export const PROSE_CLASS =
  'prose prose-sm mt-3 max-w-none rounded-lg bg-[#faf7f1] px-3 py-2.5 text-[#4d463c] ' +
  'dark:prose-invert dark:bg-[#0d1218] dark:text-gray-300 ' +
  'prose-headings:font-serif prose-headings:text-[#221f19] dark:prose-headings:text-gray-100 ' +
  'prose-p:leading-7 prose-li:leading-7 ' +
  'prose-table:text-xs prose-th:bg-[#f0e9d8] dark:prose-th:bg-[#1a222d] ' +
  'prose-blockquote:border-l-[#c5b89c] prose-blockquote:text-[#5d554a] ' +
  'dark:prose-blockquote:border-l-[#475061] dark:prose-blockquote:text-gray-400 ' +
  'prose-code:text-[#6b4f21] dark:prose-code:text-[#e0c38f]'
