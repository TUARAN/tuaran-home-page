import Image from 'next/image'
import Link from 'next/link'

import { AVATAR_PATH } from '../../../lib/auth/avatar'
import {
  AUTHOR_ALLIANCE_URL,
  AUTHOR_INTRO_MARKDOWN,
  AUTHOR_LIBRARY_URL,
  AUTHOR_LINE_1,
  AUTHOR_LINE_2_TAIL,
  AUTHOR_SITE_URL,
} from '../../../lib/site/authorIntroMarkdown.js'

/**
 * 作者介绍：站内两行（身份 · 经历与实践）；分发三行（另加关注与合作引流）
 * - <AuthorByline />：页头 TL;DR 旁仅展示前两行
 * - AUTHOR_INTRO_MARKDOWN：智能体分发复制时在 H1 后插入三行 blockquote
 */

export {
  AUTHOR_ALLIANCE_URL,
  AUTHOR_INTRO_MARKDOWN,
  AUTHOR_LIBRARY_URL,
  AUTHOR_LINE_1,
  AUTHOR_LINE_2_TAIL,
  AUTHOR_SITE_URL,
} from '../../../lib/site/authorIntroMarkdown.js'

const authorOutboundClass = 'research-author-profile-link font-medium no-underline'

function AuthorOutboundLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={authorOutboundClass}>
      {children}
    </a>
  )
}

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