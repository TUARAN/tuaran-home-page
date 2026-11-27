'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import {
  IconArrowDown, IconArrowRight, IconArrowUpRight, IconBox,
  IconBraces, IconChartDots3, IconCloud, IconDownload, IconPackage,
  IconSparkles, IconTerminal2, IconWriting,
} from '@tabler/icons-react'

import McpCatalog from '../mcp-center/McpCatalog'
import PromptCatalog from '../prompt-center/PromptCatalog'
import WorkBuddyCatalog from '../workbuddy-publish-center/WorkBuddyCatalog'
import styles from './skill-center.module.css'

const HERO_LOGO_ROWS = [
  Array.from({ length: 15 }, (_, index) => index + 1),
  Array.from({ length: 14 }, (_, index) => index + 16),
]

const AGENTS = [
  { name: 'Claude Code', src: '/images/skill-center/agents/claude-code.svg' },
  { name: 'Codex', src: '/images/skill-center/agents/codex.svg' },
  { name: 'Cursor', src: '/images/skill-center/agents/cursor.svg' },
  { name: 'Hermes Agent', src: '/images/skill-center/agents/hermes.svg' },
  { name: 'Grok', src: '/images/skill-center/agents/grok.svg' },
  { name: 'OpenCode', src: '/images/skill-center/agents/opencode.svg' },
  { name: 'OpenClaw', src: '/images/skill-center/agents/openclaw.svg' },
]

const HUB_SECTIONS = [
  { id: 'skills', title: 'Skill', subtitle: '可安装的任务方法', Icon: IconBraces, href: '/capabilities', accent: '#df7657' },
  { id: 'mcp', title: 'MCP', subtitle: '可连接的数据与工具', Icon: IconCloud, href: '#mcp', accent: '#82acc3' },
  { id: 'prompt', title: 'Prompt', subtitle: '可复制的任务模板', Icon: IconWriting, href: '#prompt', accent: '#8da171' },
  { id: 'workbuddy', title: 'WorkBuddy', subtitle: '可下载的能力包', Icon: IconPackage, href: '#workbuddy', accent: '#c8c1e1' },
]

const ART = [
  { bg: '#a9cae9', ink: '#273640', Icon: IconBraces },
  { bg: '#c7c1e3', ink: '#343046', Icon: IconSparkles },
  { bg: '#8d9b68', ink: '#202719', Icon: IconChartDots3 },
  { bg: '#e27351', ink: '#3c211c', Icon: IconDownload },
]

function TileMarquee({ logoNumbers, reverse = false }) {
  return (
    <div className={styles.tileRail} aria-hidden="true">
      <div className={`${styles.tileTrack} ${reverse ? styles.tileTrackReverse : ''}`}>
        {[0, 1].map((copy) => (
          <div className={styles.tileGroup} key={copy}>
            {logoNumbers.map((number) => (
              <div className={styles.heroSkillLogo} key={`${copy}-${number}`}>
                <Image
                  src={`/images/skill-center/hero-skill-logos/skill-logo-${String(number).padStart(2, '0')}.webp`}
                  alt=""
                  width={420}
                  height={420}
                  priority={copy === 0 && number <= 4}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentStack() {
  return (
    <div className={styles.agentStack}>
      {AGENTS.map((agent) => (
        <span key={agent.name} title={agent.name}>
          <Image src={agent.src} alt={agent.name} width={27} height={27} />
        </span>
      ))}
      <span className={styles.moreAgents}>+6</span>
    </div>
  )
}

function PreviewSkillCard({ skill, index }) {
  const art = ART[index % ART.length]
  const Icon = art.Icon
  return (
    <article className={styles.skillCard}>
      <Link href={`/skill-center/${skill.id}`} className={styles.cardArtLink} aria-label={`查看 ${skill.title}`}>
        <div className={styles.artTile} style={{ '--art-bg': art.bg, '--art-ink': art.ink }}>
          <span className={styles.artDot} />
          <Icon stroke={1.45} />
          <span className={styles.artLine} />
          <small>{skill.outputCount}</small>
        </div>
      </Link>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}><span>{skill.category}</span><b>{skill.installable ? '可安装' : '说明'}</b></div>
        <Link href={`/skill-center/${skill.id}`} className={styles.cardTitle}>{skill.title}</Link>
        <p>{skill.desc}</p>
        <div className={styles.cardFooter}>
          <span><IconBox size={14} /> {skill.name}</span>
          <Link href={`/skill-center/${skill.id}`} aria-label={`打开 ${skill.title}`}><IconArrowUpRight size={17} /></Link>
        </div>
      </div>
    </article>
  )
}

function scrollToHash(hash) {
  const id = hash.replace(/^#/, '')
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function AgentApplicationCenterExperience({ skills, mcpServices, prompts, workbuddyArtifacts, securityItems }) {
  const featuredSkills = useMemo(() => skills.slice(0, 4), [skills])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return
    const id = window.location.hash.replace(/^#/, '')
    requestAnimationFrame(() => scrollToHash(id))
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <p className={styles.heroEyebrow}><span /> AGENT APPLICATION HUB <span /></p>
        <h1>智能应用<br className={styles.mobileBreak} />中心</h1>
        <TileMarquee logoNumbers={HERO_LOGO_ROWS[0]} />
        <div className={styles.tileRailSecond}><TileMarquee logoNumbers={HERO_LOGO_ROWS[1]} reverse /></div>
        <div className={styles.heroActions}>
          <a href="#skills"><IconArrowDown size={17} /> 从 Skill 开始</a>
          <a href="#mcp">连接 MCP 服务</a>
        </div>
        <div className={styles.worksWith}>
          <p>支持的 AGENT</p>
          <AgentStack />
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p>FOUR PILLARS</p>
            <h2>按能力类型进入</h2>
            <span>完整 Skill 列表在 Skill 目录；下载、配置与复制可走现金或燃币，定价在后台「支付订单 → 内容定价」按 resource key 配置。</span>
          </div>
        </div>
        <div className={styles.categoryGrid}>
          {HUB_SECTIONS.map(({ id, title, subtitle, Icon, href, accent }) => {
            const inner = (
              <>
                <span style={{ background: accent }}><Icon size={25} stroke={1.5} /></span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
                <IconArrowUpRight className={styles.categoryArrow} size={19} />
              </>
            )
            return href.startsWith('/') ? (
              <Link key={id} href={href} className={styles.categoryLink}>{inner}</Link>
            ) : (
              <a key={id} href={href} className={styles.categoryLink}>{inner}</a>
            )
          })}
        </div>
      </section>

      <section id="skills" className={`${styles.contentSection} ${styles.softSection} ${styles.catalog}`}>
        <div className={styles.sectionHeading}>
          <div>
            <p>SKILLS</p>
            <h2>Skill 精选</h2>
            <span>可安装的工作流与任务方法。完整目录、筛选与安装说明见 Skill 目录。</span>
          </div>
          <Link href="/capabilities">打开 Skill 目录 <IconArrowRight size={16} /></Link>
        </div>
        <div className={styles.featuredGrid}>
          {featuredSkills.map((skill, index) => <PreviewSkillCard key={skill.id} skill={skill} index={index} />)}
        </div>
      </section>

      <section id="mcp" className={`${styles.contentSection} ${styles.embeddedCatalog}`}>
        <McpCatalog services={mcpServices} sectionId="mcp-catalog" embedded />
      </section>

      <section id="prompt" className={`${styles.contentSection} ${styles.softSection} ${styles.embeddedCatalog}`}>
        <PromptCatalog prompts={prompts} sectionId="prompt-catalog" embedded />
      </section>

      <section id="workbuddy" className={`${styles.contentSection} ${styles.embeddedCatalog}`}>
        <WorkBuddyCatalog artifacts={workbuddyArtifacts} sectionId="workbuddy-catalog" embedded />
      </section>

      <section className={`${styles.contentSection} ${styles.connectSectionWrap}`}>
        <div id="connect" className={styles.connectSection}>
          <div className={styles.connectIntro}>
            <p>SECURITY</p>
            <h2>连接前请确认</h2>
            <span>远程 MCP 与本地 stdio 的能力边界、授权方式和滥用控制如下。</span>
            <a href="#mcp">返回 MCP 分区 <IconArrowRight size={17} /></a>
          </div>
          <motionInstallList items={securityItems} />
        </div>
      </section>

      <section className={styles.finalCta}>
        <IconTerminal2 size={30} stroke={1.4} />
        <h2>从一种能力类型开始</h2>
        <p>Skill 负责怎么做，MCP 负责连什么，Prompt 负责怎么说，WorkBuddy 负责装进本地客户端。</p>
        <a href="#skills">回到 Skill 分区 <IconArrowRight size={17} /></a>
      </section>
    </main>
  )
}

function motionInstallList({ items }) {
  return (
    <div className={styles.installCard}>
      <div className={styles.installCardHead}>
        <span><IconSparkles size={19} /></span>
        <div><strong>MCP 使用边界</strong><small>远程 + 本地</small></div>
      </div>
      <ol>
        {items.map(([title, desc], index) => (
          <li key={title}>
            <span>{`0${index + 1}`}</span>
            <motionInstallItem title={title} desc={desc} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function motionInstallItem({ title, desc }) {
  return (
    <div>
      <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{title}</strong>
      <span style={{ fontSize: 12, color: '#6d6861', lineHeight: 1.6 }}>{desc}</span>
    </div>
  )
}