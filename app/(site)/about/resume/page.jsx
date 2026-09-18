import Image from 'next/image'
import Link from 'next/link'

import {
  RESUME_CANONICAL,
  RESUME_DESCRIPTION,
  RESUME_PATH,
  RESUME_TITLE,
  resumeCertifications,
  resumeContacts,
  resumeEducation,
  resumeExperience,
  resumeOpenSource,
  resumeProfile,
  resumeSameAs,
  resumeSkills,
  resumeSummary,
  resumeWorks,
  resumeWriting,
} from '../../../../lib/resume'
import ResumeToolbar from './ResumeToolbar'

export const dynamic = 'force-static'

export const metadata = {
  title: RESUME_TITLE,
  description: RESUME_DESCRIPTION,
  keywords: [
    '涂阿燃',
    'TUARAN',
    '求职简历',
    '简历',
    'AI 前沿部署工程师',
    'FDE',
    '前端工程师',
    'AI Agent',
    '矩联科技',
  ],
  alternates: { canonical: RESUME_PATH },
  openGraph: {
    title: RESUME_TITLE,
    description: RESUME_DESCRIPTION,
    url: RESUME_CANONICAL,
    type: 'profile',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const resumeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  name: RESUME_TITLE,
  url: RESUME_CANONICAL,
  mainEntity: {
    '@type': 'Person',
    '@id': 'https://2aran.com/about#person',
    name: resumeProfile.name,
    alternateName: ['TUARAN', ...resumeProfile.aliases],
    jobTitle: ['AI 前沿部署工程师', '矩联科技创始人'],
    url: 'https://2aran.com/about',
    email: 'mailto:tuaran666@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: resumeProfile.location,
      addressCountry: 'CN',
    },
    sameAs: resumeSameAs,
  },
}

function ResumeSection({ kicker, title, children }) {
  return (
    <section className="resume-section">
      <header className="mb-2.5">
        <p className="resume-kicker">{kicker}</p>
        <h2 className="resume-h2">{title}</h2>
      </header>
      {children}
    </section>
  )
}

export default function ResumePage() {
  return (
    <main className="resume-page min-h-screen text-[#dbe6f0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resumeStructuredData).replace(/</g, '\\u003c') }}
      />

      <div className="resume-glow resume-glow-a" aria-hidden="true" />
      <div className="resume-glow resume-glow-b" aria-hidden="true" />

      <header className="resume-chrome sticky top-0 z-10 border-b border-[#1c2a3c] bg-[#080c15]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-2 px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff5f57]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#febc2e]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#28c840]" aria-hidden="true" />
          <span className="ml-2 min-w-0 truncate font-mono text-[11px] text-[#5b6c82]">~/about/resume</span>
          <div className="ml-auto">
            <ResumeToolbar title={RESUME_TITLE} text={RESUME_DESCRIPTION} url={RESUME_PATH} />
          </div>
        </div>
      </header>

      <div className="resume-desk relative z-[1] px-4 py-8 sm:py-10">
        <article className="resume-sheet mx-auto w-full max-w-[820px] overflow-hidden">
          <div className="resume-spine" aria-hidden="true" />

          <div className="resume-hero">
            <div className="resume-hero-copy">
              <p className="resume-kicker">Curriculum Vitae · 求职简历</p>
              <h1 className="resume-name">
                {resumeProfile.name}
                <span className="resume-name-en">{resumeProfile.nameEn}</span>
              </h1>
              <p className="resume-headline">{resumeProfile.headline}</p>
              <p className="resume-intent">求职方向：{resumeProfile.intent}</p>
              <p className="resume-aliases">{resumeProfile.aliases.join(' · ')}</p>
            </div>
            <div className="resume-portrait">
              <Image
                src={resumeProfile.avatar}
                alt="涂阿燃 TUARAN"
                width={240}
                height={288}
                priority
                unoptimized
                sizes="112px"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="resume-grid">
            <aside className="resume-aside">
              <ResumeSection kicker="Contact" title="联系">
                <ul className="resume-contact-list">
                  <li>
                    <span>城市</span>
                    <strong>{resumeProfile.location}</strong>
                  </li>
                  {resumeContacts.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className="resume-link">
                          {item.value}
                        </a>
                      ) : (
                        <strong>{item.value}</strong>
                      )}
                    </li>
                  ))}
                </ul>
              </ResumeSection>

              <ResumeSection kicker="Skills" title="能力">
                <div className="space-y-3">
                  {resumeSkills.map((group) => (
                    <div key={group.label}>
                      <h3 className="resume-h3">{group.label}</h3>
                      <p className="resume-muted">{group.items.join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </ResumeSection>

              <ResumeSection kicker="Cert" title="认证">
                <ul className="space-y-2">
                  {resumeCertifications.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="resume-link">
                        {item.name}
                      </Link>
                      <p className="resume-muted">
                        {item.org}
                        <br />
                        {item.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </ResumeSection>
            </aside>

            <div className="resume-main">
              <ResumeSection kicker="Summary" title="概述">
                <p className="resume-body">{resumeSummary}</p>
              </ResumeSection>

              <ResumeSection kicker="Experience" title="经历">
                <ol className="resume-timeline">
                  {resumeExperience.map((job) => (
                    <li key={`${job.org}-${job.period}`}>
                      <div className="resume-job-head">
                        <h3 className="resume-h3">
                          {job.title}
                          <span> · {job.org}</span>
                        </h3>
                        <p className="resume-period">{job.period}</p>
                      </div>
                      <ul className="resume-bullets">
                        {job.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </ResumeSection>

              <ResumeSection kicker="Writing" title="写作与出版">
                <div className="resume-stats">
                  {resumeWriting.stats.map((stat) => (
                    <div key={stat.label}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <p className="resume-period mb-2">{resumeWriting.period}</p>
                <ul className="resume-bullets">
                  {resumeWriting.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <ul className="resume-works">
                  {resumeWorks.map((work) => (
                    <li key={work.title}>
                      <a href={work.href} target="_blank" rel="noreferrer" className="resume-link">
                        {work.title}
                      </a>
                      <span className="resume-muted"> {work.meta}</span>
                    </li>
                  ))}
                </ul>
              </ResumeSection>

              <ResumeSection kicker="Open Source" title="开源">
                <p className="resume-body mb-2">
                  <a href={resumeOpenSource.href} target="_blank" rel="noreferrer" className="resume-link">
                    {resumeOpenSource.title}
                  </a>
                </p>
                <ul className="resume-bullets">
                  {resumeOpenSource.items.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} target="_blank" rel="noreferrer" className="resume-link">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </ResumeSection>

              <ResumeSection kicker="Education" title="教育">
                {resumeEducation.map((item) => (
                  <div key={item.school}>
                    <div className="resume-job-head">
                      <h3 className="resume-h3">
                        {item.school}
                        <span> · {item.degree}</span>
                      </h3>
                      <p className="resume-period">{item.period}</p>
                    </div>
                    <p className="resume-muted">{item.note}</p>
                  </div>
                ))}
              </ResumeSection>
            </div>
          </div>

          <footer className="resume-footer">
            <span>https://2aran.com{RESUME_PATH}</span>
            <span>广州 · 可打印 · 可另存 PDF</span>
          </footer>
        </article>
      </div>
    </main>
  )
}
