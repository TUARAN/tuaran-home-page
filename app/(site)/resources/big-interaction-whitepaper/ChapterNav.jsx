import BookToc from '../../components/book-reader/BookToc'

export default function ChapterNav({ chapters }) {
  return (
    <BookToc
      title="章节目录"
      caption="按章阅读 · 点击跳转"
      groups={[{ heading: '大互动理论', items: chapters.map((chapter) => ({
        id: chapter.id,
        label: `${chapter.number} ${chapter.title}`,
      })) }]}
    />
  )
}
