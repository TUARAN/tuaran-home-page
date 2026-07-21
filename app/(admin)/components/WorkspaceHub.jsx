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
function WorkspaceLinks({ items }) {
  return (
    <div className="border-y border-[#d9d9cf] dark:border-[#26313e]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group -mx-2 flex items-start gap-4 border-t border-[#e4e4dc] px-2 py-5 transition-colors first:border-t-0 hover:bg-[#efeee7]/70 focus-visible:bg-[#efeee7]/70 focus-visible:outline-none dark:border-[#202b38] dark:hover:bg-[#131b25] dark:focus-visible:bg-[#131b25]"
        >
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#6b6d62] dark:text-[#aab6c8]">
            <AdminIcon name={item.icon} size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</span>
            <span className="mt-1 block text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.description}</span>
            {item.note ? <span className="mt-2 block font-mono text-[10px] text-[#929487] dark:text-[#718096]">{item.note}</span> : null}
          </span>
          <IconArrowRight
            size={15}
            className="mt-1.5 shrink-0 text-[#a3a598] transition group-hover:translate-x-1 group-hover:text-[#55574e] dark:text-[#536173] dark:group-hover:text-[#aab6c8]"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  )
}

export default function WorkspaceHub({ title, description, eyebrow, flow, items, sections = [] }) {
  return (
    <AdminPage title={title} description={description}>
      {flow?.length ? (
        <section className="mb-9 border-y border-[#d9d9cf] py-4 dark:border-[#26313e] md:grid md:grid-cols-[180px_1fr] md:items-center md:gap-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#858779] dark:text-[#8e9ab0]">
            {eyebrow || '推荐流程'}
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-0 md:flex md:items-center">
            {flow.map((step, index) => (
              <li key={step} className="flex min-w-0 flex-1 items-center text-[12px] text-[#53554d] dark:text-gray-300">
                <span className="mr-2 font-mono text-[10px] font-semibold tabular-nums text-[#929487] dark:text-[#718096]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium">{step}</span>
                {index < flow.length - 1 ? (
                  <span className="mx-4 hidden h-px min-w-4 flex-1 bg-[#d9d9cf] dark:bg-[#26313e] md:block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {items?.length ? <WorkspaceLinks items={items} /> : null}

      {sections.length ? <div>
        {sections.map((section) => (
          <section
            key={section.title}
            className="border-t border-[#d9d9cf] py-7 first:border-t-0 first:pt-0 dark:border-[#26313e] md:grid md:grid-cols-[240px_1fr] md:gap-10"
          >
            <div className="mb-4 md:mb-0">
              <h2 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{section.title}</h2>
              {section.description ? <p className="mt-2 text-[12px] leading-5 text-[#77796d] dark:text-gray-400">{section.description}</p> : null}
            </div>
            <WorkspaceLinks items={section.items} />
          </section>
        ))}
      </div> : null}
    </AdminPage>
  )
}
