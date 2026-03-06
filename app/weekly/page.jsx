import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '周报 · TUARAN ｜ 涂阿燃 Weekly',
  description:
    '写给自己的每周周报，记录生活、技术学习、综合学习、感悟与工作小结。',
  keywords: ['涂阿燃', 'tuaran', '周报', 'weekly', '生活记录', '工作小结'],
  alternates: {
    canonical: '/weekly',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

const weeklyPosts = [
  {
    title: '2026年第10周｜写给自己的周报',
    week: '2026年第10周',
    date: '2026-03-04',
    sections: [
      {
        title: '感悟',
        paragraphs: [
          '这一周，我想想，为什么我之前（2022年底）就能感受到自己身处洪流之中，却无法抓住机遇？',
          '明知道流量变现、卖焦虑卖课赚钱、为何还不耻为伍，写什么知识付费，不如写标题党的流量文章，先发展，再优化，不是吗？',
          '大模型下，没有知识是稀缺的了，观点才是！合群才是！',
        ],
      },
    ],
  },
  {
    title: '2026年第9周｜写给自己的周报',
    week: '2026年第9周',
    date: '2026-02-25',
    sections: [
      {
        title: '感悟',
        paragraphs: [
          '我一定要坚定不移地拥抱新科技，就比如大模型、比如机器人。',
          '为什么？因为要翻身，因为要革命。一定不能守旧。在这个时代，守旧意味着落伍，意味着被卷掉。',
          '无论是个人的职业发展，还是人类的进步，都离不开对新技术的拥抱。那些真正改变世界的人，从来都是敢于直面变革、拥抱变革的人。',
        ],
      },
    ],
  },
  {
    title: '2026年第8周｜写给自己的周报',
    week: '2026年第8周',
    date: '2026-02-18',
    sections: [
      {
        title: '感悟',
        paragraphs: [
          '千万不要觉得父母好可怜，对他们愧疚。',
          '因为这样意味着，你和父母的位置和次序一直是颠倒的。',
          '你一直没把父母当成年人，也没把自己当小孩。',
          '长大就是要学会平等地看待父母，尊重他们的选择，也让他们学会尊重你的选择。愧疚不是感恩，反而是一种变相的控制和伤害。',
        ],
      },
    ],
  },
  {
    title: '2026年第7周｜写给自己的周报',
    week: '2026年第7周',
    date: '2026-02-10',
    sections: [
      {
        title: '生活',
        paragraphs: [
          '新的一周，生活上大家开始陆续返乡了。从抖音和高德上看到高速已经堵了，不是？实际上法定节假日是这周日才开始啊，大家都放十几天的吗？',
        ],
      },
      {
        title: '工作',
        paragraphs: [
          '工作上，大家似乎也没啥心思在工作了，明显的就是没啥会议了。大家坐在工位上，看起来好像是还在啪啦啪打字，忙碌着，实际上呢，难评。',
          '过年啊，打工牛马还要什么过年呢？背井离乡，一年也就这短暂一周多的时间，还要应付这个应付那个，切换状态本身就够累了。',
        ],
      },
    ],
  },
  {
    title: '2026年第6周｜写给自己的周报',
    week: '2026年第6周',
    date: '2026-02-05',
    sections: [
      {
        title: '生活',
        paragraphs: [
          '这一周，生活最大的感受仍然是带娃难。上周周一请假一天，这周周二又请了一上午。',
          '连续3天宝宝都在夜晚醒，醒了不睡，不同程度的闹到1-2小时；宝宝妈妈也几度崩溃。',
          '宝宝鼻子堵、又还有点咳嗽，天呐，怎么这么难啊。',
        ],
      },
      {
        title: '感悟',
        paragraphs: [
          '上班的时候，在摄像头看到宝宝哭、宝妈哭，真的很绝望。',
          '不知道这个班上的还有什么意义？钱也没赚到，仍然维持"整体体系在空转"的观点不变。',
        ],
      },
    ],
  },
]

export default function WeeklyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="border-b border-[#eee] pb-6 mb-8 dark:border-gray-800">
        <p className="text-xs uppercase tracking-widest text-[#999]">
          Weekly Review
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111] dark:text-white">
          周报 · 涂阿燃 ｜ TUARAN WEEKLY
        </h1>
        <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
          每周都要为工作写周报，但更重要的是写给自己。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-[#004276] dark:text-blue-400 underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            返回首页
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold">最新周报</h2>
        {weeklyPosts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[#ddd] p-6 text-sm text-[#888] dark:border-gray-700 dark:text-gray-400">
            还没有发布周报。先立个 flag：每周更新一篇。
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {weeklyPosts.map((post) => (
              <article
                key={post.title}
                className="rounded-lg border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold text-[#111] dark:text-gray-100">
                    {post.title}
                  </h3>
                  <span className="text-xs text-[#999] dark:text-gray-400">
                    {post.week} · {post.date}
                  </span>
                </div>
                <div className="mt-4 space-y-4 text-sm text-[#666] dark:text-gray-300">
                  {post.sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#222] dark:text-gray-200">
                        {section.title}
                      </h4>
                      {section.paragraphs.map((text, index) => (
                        <p key={`${section.title}-${index}`} className="m-0">
                          {text}
                        </p>
                      ))}
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}