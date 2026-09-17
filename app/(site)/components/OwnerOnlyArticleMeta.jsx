import { ownerAuthorValue } from '../../../lib/contentEditCount'

/**
 * 站长内部记录：作者、协助工具、模型 ID、版本。
 * 由右侧「站长」菜单展开后展示，普通访客不渲染。
 * 有过实质修订时，作者行附带「修改过X次」；从未修改则不写。
 */
export function getOwnerMetaParts(ownerMeta) {
  if (!ownerMeta) return []

  const {
    author = 'TUARAN',
    assistance = '',
    model = '',
    assistanceLabel = '',
    version = '',
    revision,
    editCount,
  } = ownerMeta
  const assistanceText = assistance || assistanceLabel
  const parts = []
  if (author) parts.push({ label: '作者', value: ownerAuthorValue(author, revision, editCount) })
  if (assistanceText) parts.push({ label: '协助', value: assistanceText })
  if (model) parts.push({ label: '模型', value: model })
  if (version) parts.push({ label: '版本', value: version })
  return parts
}

export default function OwnerOnlyArticleMeta(props) {
  const parts = Array.isArray(props.parts) ? props.parts : getOwnerMetaParts(props)
  if (!parts.length) return null

  return (
    <div className="article-owner-meta" aria-label="站长内部记录">
      {parts.map((part) => (
        <p key={part.label} className="article-owner-meta-row">
          <span className="article-owner-meta-label">{part.label}</span>
          {part.value}
        </p>
      ))}
    </div>
  )
}
