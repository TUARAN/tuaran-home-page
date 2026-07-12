import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import { AdminIcon } from '../../../lib/adminIcons'
import { AdminPage } from './ui'

/**
 * 后台一级工作台的轻量入口页。
 *
 * 旧控制台继续拥有各自的路由和数据边界；工作台负责按工作目标把它们收在一起，
 * 避免把技术对象、供应商名称和工作动作混排在侧边栏。
 */
export default function WorkspaceHub({ title, description, eyebrow, flow, sections }) {
  return (
    <AdminPage title={title} description={description} maxWidth="1180px">
      {flow?.length ? (
        <section className="mb-7 rounded-xl border border-[#e2e3da] bg-[#fafaf6] px-4 py-4 dark:border-[#1e2733] dark:bg-[#10161f]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#858779] dark:text-[#8e9ab0]">
            {eyebrow || '推荐流程'}
          </p>
          <ol className="mt-3 flex flex-col gap-2 md:flex-row md:items-stretch">
            {flow.map((step, index) => (
              <li key={step} className="flex min-w-0 flex-1 items-center gap-2 text-[12px] text-[#53554d] dark:text-gray-300">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#15140f] font-mono text-[10px] text-white dark:bg-gray-100 dark:text-[#111827]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{section.title}</h2>
                {section.description ? <p className="mt-1 text-[12px] text-[#67695d] dark:text-gray-400">{section.description}</p> : null}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-[112px] items-start gap-3 rounded-xl border border-[#e2e3da] bg-white p-4 transition hover:border-[#aeb0a2] hover:shadow-sm dark:border-[#1e2733] dark:bg-[#10161f] dark:hover:border-[#394757]"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f1ea] text-[#5b5d53] dark:bg-[#1a2330] dark:text-[#aab6c8]">
                    <AdminIcon name={item.icon} size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[14px] font-semibold text-[#15140f] dark:text-gray-100">
                      {item.title}
                      <IconArrowRight size={14} className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.description}</span>
                    {item.note ? <span className="mt-2 block font-mono text-[10px] text-[#929487] dark:text-[#718096]">{item.note}</span> : null}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminPage>
  )
}
