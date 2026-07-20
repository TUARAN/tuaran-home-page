import {
  SEO_EVOLUTION_ROADMAP,
  SEO_GOVERNANCE_RULES,
  SEO_STRATEGY_LAYERS,
  getSeoGovernanceSnapshot,
} from '../../../../lib/seoGovernance'
import { listPublishedArticlePosts } from '../../../../lib/articlePosts'
import { AdminButton, AdminPage, Section, StatCard, StatusPill } from '../../components/ui'
import SeoRegistryTable from './SeoRegistryTable'

const STATUS_META = {
  stable: { label: '稳定运行', tone: 'success' },
  standardized: { label: '已统一', tone: 'success' },
  established: { label: '已覆盖', tone: 'info' },
  guarded: { label: '已隔离', tone: 'success' },
  fragmented: { label: '待统一', tone: 'warning' },
  planned: { label: '规划中', tone: 'neutral' },
}

const ROADMAP_META = {
  done: { label: '已完成', tone: 'success' },
  next: { label: '优先推进', tone: 'warning' },
  planned: { label: '规划中', tone: 'neutral' },
}

function StrategyLayer({ layer }) {
  const meta = STATUS_META[layer.status] || STATUS_META.planned
  return (
    <article className="rounded-lg border border-[#e2e3da] bg-[#fbfcf8] p-4 dark:border-[#243040] dark:bg-[#0d131b]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{layer.name}</h3>
          <p className="mb-0 mt-1 text-[12.5px] leading-6 text-[#67695d] dark:text-gray-400">{layer.scope}</p>
        </div>
        <StatusPill tone={meta.tone} size="sm">{meta.label}</StatusPill>
      </div>
      <div className="mt-3 rounded-md bg-[#f0f1e9] px-3 py-2 font-mono text-[10.5px] leading-5 text-[#6f7166] dark:bg-[#151c26] dark:text-[#8f9bad]">
        {layer.source}
      </div>
      <ul className="mb-0 mt-3 space-y-1.5 text-[12px] leading-5 text-[#55574f] dark:text-gray-400">
        {layer.rules.map((rule) => <li key={rule}>· {rule}</li>)}
      </ul>
      <p className="mb-0 mt-3 text-[10.5px] uppercase tracking-[0.12em] text-[#96988d] dark:text-[#657286]">Owner · {layer.owner}</p>
    </article>
  )
}

export default async function SeoManagementConsole() {
  const publishedArticles = await listPublishedArticlePosts()
  const snapshot = getSeoGovernanceSnapshot({ publishedArticles })
  const { totals, pages } = snapshot

  return (
    <AdminPage
      title="SEO 管理"
      description="统一查看文章、分析、资源、多维页面的索引、Metadata、结构化数据、Sitemap 和演进策略。内容注册源与实际页面模板共同构成审计口径；后台负责发现问题和规划，避免未经评审直接修改线上 SEO。"
      actions={(
        <>
          <AdminButton href="/sitemap.xml" target="_blank" rel="noreferrer" size="sm">Sitemap</AdminButton>
          <AdminButton href="/robots.txt" target="_blank" rel="noreferrer" size="sm">Robots</AdminButton>
          <AdminButton href="/llms.txt" target="_blank" rel="noreferrer" size="sm">LLMs</AdminButton>
        </>
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="内容 SEO 注册" value={totals.pages} sub={`多维页面 ${totals.richPages} · 文章 ${totals.articles} · 分析 ${totals.research} · 资源 ${totals.resources}`} icon="analytics" tone="info" />
        <StatCard label="Metadata 完整" value={`${totals.metadataReady}/${totals.pages}`} sub={`${totals.indexable} 个可索引 · ${totals.noindex} 个 noindex`} icon="articles" tone={totals.metadataReady === totals.pages ? 'success' : 'warning'} />
        <StatCard label="JSON-LD 完整" value={`${totals.jsonLdReady}/${totals.pages}`} sub="Schema 与发布时间字段" icon="researchStyle" tone={totals.jsonLdReady === totals.pages ? 'success' : 'warning'} />
        <StatCard label="Canonical 唯一" value={totals.canonicalUnique ? '通过' : '冲突'} sub={`${totals.withImages} 个专属 OG 图 · ${totals.withKeywords} 个关键词集`} icon="audit" tone={totals.canonicalUnique ? 'success' : 'danger'} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <Section title="当前 SEO 策略地图" description="按内容来源和技术职责分层；状态为“待统一”的部分是下一阶段治理重点。">
          <div className="grid gap-3 md:grid-cols-2">
            {SEO_STRATEGY_LAYERS.map((layer) => <StrategyLayer key={layer.id} layer={layer} />)}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="当前治理边界" description="第一版明确什么能在后台看，什么仍必须走代码评审。">
            <div className="space-y-3 text-[12.5px] leading-6 text-[#55574f] dark:text-gray-400">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <b className="text-emerald-800 dark:text-emerald-200">后台可审计</b>
                <p className="mb-0 mt-1">策略分层、注册表覆盖、索引状态、Schema 类型、日期、OG 图和关键词机会。</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <b className="text-amber-800 dark:text-amber-200">代码内管理</b>
                <p className="mb-0 mt-1">canonical、robots、Metadata 与 JSON-LD 模板。变更经过构建验证后发布，可追踪、可回滚。</p>
              </div>
              <div className="rounded-lg border border-[#d8dad0] bg-[#f5f6f0] p-3 dark:border-[#263142] dark:bg-[#151c26]">
                <b className="text-[#35372f] dark:text-gray-200">后续开放编辑</b>
                <p className="mb-0 mt-1">只有在草稿、预览、校验、审批和回滚链路齐全后，才允许后台直接发布 SEO 变更。</p>
              </div>
            </div>
          </Section>

          <Section title="索引与时间规则">
            <ul className="mb-0 space-y-2 text-[12.5px] leading-6 text-[#55574f] dark:text-gray-400">
              <li>· `lastmod` 表示内容真实修改日，不是构建或部署时间。</li>
              <li>· 无可靠修改日的普通静态页省略 `lastmod`。</li>
              <li>· `noindex`、加密内容和后台 URL 不进入 Sitemap。</li>
              <li>· 路径迁移必须同时处理 301、canonical、Sitemap 和站内链接。</li>
            </ul>
          </Section>
        </div>
      </div>

      <Section
        className="mt-5"
        title="全站内容 SEO 注册表"
        description="统一汇总多维页面、精选文章、分析和资源。支持按类型筛选与搜索；状态来自注册数据和实际页面模板，缺失项会如实标记。"
      >
        <SeoRegistryTable pages={pages} />
      </Section>

      <Section className="mt-5" title="变更治理清单" description="把页面生命周期里的 SEO 动作固定下来，减少遗漏和互相冲突。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SEO_GOVERNANCE_RULES.map((rule, index) => (
            <article key={rule.action} className="rounded-lg border border-[#e2e3da] p-4 dark:border-[#243040]">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9a7a3c] dark:text-[#c8a35c]">0{index + 1}</p>
              <h3 className="mt-2 text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{rule.action}</h3>
              <ol className="mb-0 mt-3 space-y-2 text-[12px] leading-5 text-[#62645b] dark:text-gray-400">
                {rule.steps.map((step, stepIndex) => <li key={step}>{stepIndex + 1}. {step}</li>)}
              </ol>
            </article>
          ))}
        </div>
      </Section>

      <Section className="mt-5" title="演进路线" description="从代码统一走向自动审计、搜索数据反馈和安全发布。">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SEO_EVOLUTION_ROADMAP.map((item) => {
            const meta = ROADMAP_META[item.status]
            return (
              <article key={item.phase} className="rounded-lg border border-[#e2e3da] bg-[#fbfcf8] p-4 dark:border-[#243040] dark:bg-[#0d131b]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f9185] dark:text-[#68768b]">{item.phase}</span>
                  <StatusPill tone={meta.tone} size="sm">{meta.label}</StatusPill>
                </div>
                <h3 className="mt-3 text-[14px] font-semibold leading-6 text-[#15140f] dark:text-gray-100">{item.title}</h3>
                <ul className="mb-0 mt-3 space-y-2 text-[12px] leading-5 text-[#62645b] dark:text-gray-400">
                  {item.items.map((entry) => <li key={entry}>· {entry}</li>)}
                </ul>
              </article>
            )
          })}
        </div>
      </Section>
    </AdminPage>
  )
}
