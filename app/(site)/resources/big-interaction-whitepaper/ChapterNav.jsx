import BookToc from '../../components/book-reader/BookToc'
import styles from './whitepaper.module.css'

export default function ChapterNav({ chapters }) {
  const [foreword, plates, framework, mechanism, quality, boundaries, archive] = chapters
  return (
    <BookToc
      title="章节目录"
      caption="按篇、章、节查阅"
      className={styles.chapterNav}
      groups={[
        { heading: '序与卷首', items: [foreword, plates].map((chapter) => ({ id: chapter.id, label: `${chapter.number} ${chapter.title}` })) },
        { heading: '第一篇 · 开始互动', items: [
          { id: framework.id, label: `${framework.number} ${framework.title}` },
          { id: 'care', label: '1.1 三层台阶', depth: 1 },
          { id: 'opening', label: '1.2 打开接触', depth: 1 },
          { id: mechanism.id, label: `${mechanism.number} ${mechanism.title}` },
          { id: 'edge', label: '2.1 理解边界', depth: 1 },
          { id: 'express', label: '2.2 真诚互动', depth: 1 },
          { id: 'revise', label: '2.3 带走一次修正', depth: 1 },
        ] },
        { heading: '第二篇 · 质量与边界', items: [
          { id: quality.id, label: `${quality.number} ${quality.title}` },
          { id: 'sources', label: '3.1 信息来源', depth: 1 },
          { id: 'frequency', label: '3.2 次数与持续性', depth: 1 },
          { id: 'depth', label: '3.3 深度与对象', depth: 1 },
          { id: 'value', label: '3.4 内容价值', depth: 1 },
          { id: boundaries.id, label: `${boundaries.number} ${boundaries.title}` },
          { id: 'choice', label: '4.1 自愿与退出', depth: 1 },
          { id: 'limit-reading', label: '4.2 逼近极限', depth: 1 },
          { id: 'scope', label: '4.3 适用范围', depth: 1 },
        ] },
        { heading: '附录', items: [{ id: archive.id, label: `${archive.number} ${archive.title}` }] },
      ]}
    />
  )
}
