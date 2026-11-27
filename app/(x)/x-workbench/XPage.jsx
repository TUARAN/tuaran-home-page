import Link from 'next/link'

import ManualPaper from '../../(site)/components/book-reader/ManualPaper'
import PageContainer from '../../(site)/components/PageContainer'
import XSiteFrame from './XSiteFrame'
import { xPageNeighbors } from './tabs'
import s from './xPage.module.css'

// X大互动 各入口页共用的外壳：顶栏高亮、纸面、页头、上一页 / 下一页。
export default function XPage({ active, title, intro, meta, tone = 'green', after = null, className = '', children }) {
  const { group, prev, next } = xPageNeighbors(active)
  return (
    <XSiteFrame active={active}>
      <ManualPaper tone={tone}>
        <PageContainer width="standard" className={`${s.page} ${className}`}>
          <header className={s.head}>
            <div className={s.headRow}>
              {group ? <p className={s.kicker}>{group.label}</p> : null}
              <h1 className={s.title}>{title}</h1>
            </div>
            {intro || meta ? (
              <div className={s.headRowSub}>
                {intro ? <p className={s.intro}>{intro}</p> : null}
                {meta ? <div className={s.meta}>{meta}</div> : null}
              </div>
            ) : null}
          </header>
          {children}
          {prev || next ? (
            <nav className={s.pager} aria-label="上一页与下一页">
              {prev ? <Link className={s.pagerLink} href={prev.href} rel="prev"><span>上一页</span><b>{prev.label}</b></Link> : <span />}
              {next ? <Link className={`${s.pagerLink} ${s.pagerNext}`} href={next.href} rel="next"><span>下一页</span><b>{next.label}</b></Link> : <span />}
            </nav>
          ) : null}
        </PageContainer>
        {after}
      </ManualPaper>
    </XSiteFrame>
  )
}
