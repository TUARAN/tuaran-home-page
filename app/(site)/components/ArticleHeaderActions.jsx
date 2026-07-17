import ArticleActionsDropdown from './ArticleActionsDropdown'
import RssButton from './RssButton'
import SharePageButton from './SharePageButton'

export default function ArticleHeaderActions({
  title,
  text,
  url,
  children,
  actionsEnabled = true,
  className = '',
}) {
  return (
    <div className={`flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap ${className}`}>
      {actionsEnabled ? <SharePageButton title={title} text={text} url={url} /> : null}
      <RssButton label="RSS" />
      {actionsEnabled && children ? (
        <ArticleActionsDropdown label="更多">{children}</ArticleActionsDropdown>
      ) : null}
    </div>
  )
}
