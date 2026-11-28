import Image from 'next/image'
import Link from 'next/link'

import { AVATAR_PATH } from '../../../lib/auth/avatar'

/**
 * 作者介绍：站内两行（身份 · 经历与实践）；分发三行（另加关注与合作引流）
 * - <AuthorByline />：页头 TL;DR 旁仅展示前两行
 * - AUTHOR_INTRO_MARKDOWN：智能体分发复制时在 H1 后插入三行 blockquote
 */

export const AUTHOR_SITE_URL = 'https://2aran.com'
export const AUTHOR_LIBRARY_URL = 'https://2aran.com/resources/books'
export const AUTHOR_ALLIANCE_URL = 'https://blogger-alliance.cn/'

const authorOutboundClass = 'research-author-profile-link font-medium no-underline'

function AuthorOutboundLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={authorOutboundClass}>
      {children}
    </a>
  )
}

export const AUTHOR_LINE_1 =
  '涂阿燃 · 前端与智能体工程师 · 技术作者 · 社区 KOL，粉丝 5 万+'

export const AUTHOR_LINE_2_TAIL =
  '，深度参与开源社区与智能体工程实践，全面拥抱 AI 与去中心化。'

export const AUTHOR_LINE_2 =
  `持续出版多部技术作品${AUTHOR_LINE_2_TAIL}`

export const AUTHOR_LINE_2_MARKDOWN =
  `持续出版多部[技术作品](${AUTHOR_LIBRARY_URL})${AUTHOR_LINE_2_TAIL}`

export const AUTHOR_LINE_3 =
  `更多请关注个人网络日志 ${AUTHOR_SITE_URL}；推广合作在博主联盟。`

export const AUTHOR_LINE_3_MARKDOWN =
  `更多请关注个人[网络日志](${AUTHOR_SITE_URL})；推广合作在[博主联盟](${AUTHOR_ALLIANCE_URL})。`

export const AUTHOR_INTRO_MARKDOWN = `> ${AUTHOR_LINE_1}
> ${AUTHOR_LINE_2_MARKDOWN}
> ${AUTHOR_LINE_3_MARKDOWN}`

export function AuthorByline() {
  return (
    <div className="research-author-byline flex items-start gap-3">
      <Link
        href="/about"
        rel="author"
        aria-label="了解作者涂阿燃"
        className="research-author-avatar mt-0.5 shrink-0 rounded-full no-underline"
      >
        <Image
          src={AVATAR_PATH}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 rounded-full object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="research-author-name m-0 text-[11px] font-semibold leading-5">
          <Link href="/about" rel="author" className="no-underline">
            {AUTHOR_LINE_1}
          </Link>
        </p>
        <p className="research-author-muted m-0 text-[11px] leading-5">
          持续出版多部
          <AuthorOutboundLink href={AUTHOR_LIBRARY_URL}>技术作品</AuthorOutboundLink>
          {AUTHOR_LINE_2_TAIL}
        </p>
      </div>

      <Link
        href="/about"
        className="research-author-profile-link mt-0.5 inline-flex shrink-0 items-center gap-1 text-[11px] font-medium no-underline"
      >
        个人介绍
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default AuthorByline