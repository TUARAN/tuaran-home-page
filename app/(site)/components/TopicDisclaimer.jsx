import Link from 'next/link'

const COPY = {
  finance: {
    title: '非投资建议',
    body: '这里整理的是公开资料和个人判断，不构成投资建议、买卖推荐或收益承诺。证券、加密资产和市场数据以交易所、上市公司和监管披露为准。',
  },
  health: {
    title: '非医疗建议',
    body: '这里整理的是公开资料和个人记录，不构成诊断、治疗或用药建议。身体不适请咨询具备资质的医疗机构。',
  },
}

export default function TopicDisclaimer({ kind }) {
  const copy = COPY[kind]
  if (!copy) return null
  return (
    <aside
      className="mb-6 rounded-xl border border-[#e4d3b4] bg-[#fff8ec] px-4 py-3 text-[13px] leading-6 text-[#5c4b32] dark:border-[#5a4630] dark:bg-[#241b12] dark:text-[#ead7b8]"
      role="note"
    >
      <p className="mb-1 font-semibold">{copy.title}</p>
      <p className="mb-0">
        {copy.body}
        {' '}
        <Link href="/editorial" className="underline decoration-dotted underline-offset-4">内容说明</Link>
      </p>
    </aside>
  )
}
