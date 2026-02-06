import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ImageLightbox from '../../components/ImageLightbox'

export const dynamic = 'force-static'

export const metadata = {
  title: '推特收藏',
  description: '不为别的，只是为了更好的认识这个世界🌍',
}

const knowledgeBookmarks = [
  {
    title: '你人生中太晚明白的道理是什么？',
    description: '',
    tocLabel: '摘录',
    featured: true,
    content: {
      meta: ['5,090 个回答 · 5.1 万关注', '匿名用户 · 4.1 万人赞同了该回答'],
      quote:
        '无论你在寻找什么，亲情、友情、或爱情，终其一生，其实你都是一个人，极少有人能真正地像你一样理解你自己，哪怕是亲人、朋友或恋人，他们只能辅助你去理解自己，你唯一的人生课题就是找到自己。放在第一位。',
    },
  },
  {
    title: '什么是最大的杠杆？',
    description: '',
    tocLabel: '摘录',
    featured: false,
    content: {
      quote: (
        <>
          做你真正喜欢的事，做已经坚持了好几年的事，做你从一开始就没想过赚钱还能坚持下来的事，就是最可能成的事、最大的杠杆。
          <br />
          <br />
          杠杆的本质其实是时间，是你的生命。只有付出了足够多，才能获得超出正常水平的收益率。这个过程非常漫长。
        </>
      ),
    },
  },
  {
    title: '建议收藏：一张表读懂中国传统文化核心常识',
    description: '编号 / 分类（关键词）/ 内容（速查表）',
    tocLabel: '速查表',
    table: {
      headers: ['编号', '分类 / 关键词', '内容'],
      rows: [
        ['1', '第一位女诗人', '蔡琰（文姬）'],
        ['2', '纪传体通史', '史记'],
        ['3', '词典', '尔雅'],
        ['4', '百科全书', '永乐大典'],
        ['5', '诗歌总集', '诗经'],
        ['6', '文选', '昭明文选'],
        ['7', '字典', '说文解字'],
        ['8', '神话集', '山海经'],
        ['9', '志人小说', '世说新语'],
        ['10', '志怪小说', '搜神记'],
        ['11', '语录体著作', '论语'],
        ['12', '编年体史书', '春秋'],
        ['13', '断代史', '汉书'],
        ['14', '兵书', '孙子兵法'],
        ['15', '西汉两司马', '司马迁、司马相如'],
        ['16', '乐府双璧', '木兰词、孔雀东南飞（并称《秦妇吟》）'],
        ['17', '史学双璧', '史记、资治通鉴'],
        ['18', '二拍', '初刻拍案惊奇、二刻拍案惊奇'],
        ['19', '大李杜', '李白、杜甫'],
        ['', '小李杜', '李商隐、杜牧'],
        ['20', '文坛双子星', '鲁迅、郭沫若'],
        ['21', '三不朽', '立德、立功、立言'],
        ['22', '三代', '夏、商、周'],
        ['23', '春秋三传', '左传、公羊传、谷梁传'],
        ['24', '三王', '夏禹、商汤、周公'],
        ['25', '三山', '蓬莱、方丈、瀛洲'],
        ['26', '三教', '儒、释、道'],
        ['27', '三公', '周：司马司徒司空；汉：丞相太尉御史大夫；清：太师太傅太保'],
        ['28', '三曹', '曹操、曹丕、曹植'],
        ['29', '公安三袁', '袁宗道、袁宏道、袁中道'],
        ['30', '江南三大名楼', '岳阳楼、黄鹤楼、滕王阁'],
        ['31', '岁寒三友', '松、竹、梅'],
        ['32', '三辅', '左冯翊、右扶风、京兆尹'],
        ['33', '科举三元', '解元、会元、状元'],
        ['34', '殿试三鼎甲', '状元、榜眼、探花'],
        ['35', '三大国粹', '京剧、中医、中国画'],
        ['36', '三言', '喻世明言、警世通言、醒世恒言'],
        ['37', '三别', '新婚别、垂老别、无家别'],
        ['38', '郭沫若三部曲', '女神之再生、湘果、棠棣之花'],
        ['39', '茅盾三部曲', '幻灭、动摇、追求'],
        ['', '农村三部曲', '春蚕、秋收、残冬'],
        ['40', '巴金三部曲', '雾、雨、电'],
        ['', '激流三部曲', '家、春、秋'],
        ['41', '国别史', '国语'],
        ['42', '谋臣策士专集', '战国策'],
        ['43', '个人言行史书', '晏子春秋'],
        ['44', '爱国诗人', '屈原'],
        ['45', '长篇叙事诗', '孔雀东南飞'],
        ['46', '文学批评专著', '典论·论文（曹丕）'],
        ['47', '田园诗人', '陶渊明'],
        ['48', '文学理论', '文心雕龙（刘勰）'],
        ['49', '诗歌评论', '诗品（钟嵘）'],
        ['50', '科普著作', '梦溪笔谈'],
        ['51', '日记体游记', '徐霞客游记'],
        ['52', '女词人', '李清照'],
        ['53', '四书', '大学、中庸、论语、孟子'],
        ['54', '四大类书', '太平御览、册府元龟、文苑英华、全唐文'],
        ['55', '战国四君', '孟尝君、平原君、春申君、信陵君'],
        ['56', '初唐四杰', '王勃、杨炯、卢照邻、骆宾王'],
        ['57', '北宋文坛四家', '王安石、欧阳修、苏轼、黄庭坚'],
        ['58', '元曲四大家', '关汉卿、马致远、白朴、郑光祖'],
        ['59', '江南四大才子', '唐伯虎、祝枝山、文徵明、周文宾'],
        ['60', '北宋四大书法家', '苏轼、黄庭坚、米芾、蔡襄'],
        ['61', '楷书四大家', '颜真卿、柳公权、欧阳询、赵孟頫'],
        ['62', '书法四体', '楷、草、隶、篆'],
        ['63', '文房四宝', '湖笔、徽墨、宣纸、端砚'],
        ['64', '四大藏书阁', '文渊阁、文溯阁、文津阁、文澜阁'],
        ['65', '文人四艺', '琴、棋、书、画'],
        ['66', '国画四君子', '梅、兰、竹、菊'],
        ['67', '四库', '经、史、子、集'],
        ['68', '兄弟排行', '伯（孟）、仲、叔、季'],
        ['69', '五胡', '匈奴、鲜卑、羯、氐、羌'],
        ['70', '七政', '日、月、金、木、水、火、土'],
        ['71', '战国七雄', '齐、楚、燕、韩、赵、魏、秦'],
        ['72', '七情', '喜、怒、哀、惧、爱、恶、欲'],
        ['73', '七大古都', '北京、西安、洛阳、开封、南京、杭州、安阳'],
        ['74', '八仙', '铁拐李、汉钟离、张果老、何仙姑、蓝采和、吕洞宾、韩湘子、曹国舅'],
        ['75', '唐宋八大家', '韩愈、柳宗元、欧阳修、苏洵、苏轼、苏辙、王安石、曾巩'],
        ['76', '文起八代', '汉、魏、宋、晋、齐、梁、陈、隋'],
        ['77', '四时八节', '立春、春分、立夏、夏至、立秋、秋分、立冬、冬至'],
      ],
    },
  },
  {
    title: '改变世界的 17 个方程',
    description: '序号 / 名称 / 核心公式 / 提出者 / 年代（去除调侃项）',
    tocLabel: '方程表',
    table: {
      headers: ['序号', '名称', '核心公式', '提出者', '年代'],
      rows: [
        ['1', '毕达哥拉斯定理', 'a² + b² = c²', 'Pythagoras', '公元前 530'],
        ['2', '对数', 'log(xy) = log x + log y', 'John Napier', '1610'],
        ['3', '微积分', 'df/dt = lim(h→0) [f(t+h) − f(t)] / h', 'Newton', '1668'],
        ['4', '万有引力定律', 'F = G·m₁m₂ / r²', 'Newton', '1687'],
        ['5', '虚数单位', 'i² = −1', 'Euler', '1750'],
        ['6', '欧拉多面体公式', 'V − E + F = 2', 'Euler', '1751'],
        ['7', '正态分布', 'Φ(x) = 1/(√(2π)σ) · e^{−(x−μ)² / (2σ²)}', 'C. F. Gauss', '1810'],
        ['8', '波动方程', '∂²u/∂t² = c²·∂²u/∂x²', 'J. d’Alembert', '1746'],
        ['9', '傅立叶变换', 'f(ω) = ∫₋∞^∞ f(x)e^(−2πixω) dx', 'J. Fourier', '1822'],
        ['10', '纳维–斯托克斯方程', 'ρ(∂v/∂t + v·∇v) = −∇p + ∇·T + f', 'C. Navier, G. Stokes', '1845'],
        [
          '11',
          '麦克斯韦方程组',
          '∇·E = 0；∇·H = 0；<br>∇×E = −(1/c)∂H/∂t；<br>∇×H = (1/c)∂E/∂t',
          'J. C. Maxwell',
          '1865',
        ],
        ['12', '热力学第二定律', 'dS ≥ 0', 'L. Boltzmann', '1874'],
        ['13', '相对论', 'E = mc²', 'Einstein', '1905'],
        ['14', '薛定谔方程', 'iħ ∂Ψ/∂t = HΨ', 'E. Schrödinger', '1927'],
        ['15', '信息论', 'H = −∑ p(x) log p(x)', 'C. Shannon', '1949'],
        ['16', '混沌理论', 'x₍t+1₎ = kxₜ(1 − xₜ)', 'Robert May', '1975'],
        ['17', '布莱克–斯科尔斯方程', '½σ²S²∂²V/∂S² + rS∂V/∂S + ∂V/∂t − rV = 0', 'F. Black, M. Scholes', '1990'],
      ],
    },
  },
  {
    title: '中国行政干部层级与人数分布',
    description: '序号 / 行政级别 / 约人数',
    tocLabel: '人数表',
    table: {
      headers: ['序号', '行政级别', '约人数'],
      rows: [
        ['1', '正国级', '7–9 个'],
        ['2', '副国级', '约 60 个'],
        ['3', '正部级', '约 300 个'],
        ['4', '副部级', '约 3,000 个'],
        ['5', '正厅级', '约 7,000 个'],
        ['6', '副厅级', '约 40,000 个'],
        ['7', '正处级', '约 80,000 个'],
        ['8', '副处级', '约 140,000 个'],
        ['9', '正科级', '约 250,000 个'],
        ['10', '副科级', '约 600,000 个'],
      ],
    },
  },
  {
    title: '一图了解美元体系',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/usd-system.png',
      alt: '一图了解美元体系',
    },
  },
  {
    title: '世界历史朝代图谱',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/world-history-dynasties.png',
      alt: '世界历史朝代图谱',
    },
  },
  {
    title: '国家机构图解',
    description: '两图并排（支持点击全屏查看）',
    tocLabel: '图解',
    gallery: [
      {
        src: '/bookmarks/twitter/state-org-1.jpeg',
        alt: '国家机构图解（1）',
      },
      {
        src: '/bookmarks/twitter/state-org-2.jpeg',
        alt: '国家机构图解（2）',
      },
    ],
  },
]

function KnowledgeTable({ table }) {
  const renderCell = (value) => {
    if (value == null) return ''
    const text = String(value)
    const parts = text.split(/<br\s*\/?\s*>/gi)
    if (parts.length === 1) return text
    return (
      <span>
        {parts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap border border-[#eee] bg-white px-3 py-2 text-left font-semibold text-[#333] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, idx) => (
            <tr key={`${row[0]}-${row[1]}-${idx}`}>
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="align-top border border-[#eee] px-3 py-2 text-[#666] dark:border-gray-800 dark:text-gray-300 whitespace-pre-wrap break-words"
                >
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TwitterBookmarksPage() {
  const tocItems = knowledgeBookmarks.map((item, idx) => ({
    id: `bookmark-${idx}`,
    title: item.title,
    subItems: [{ id: `bookmark-${idx}-table`, label: item.tocLabel || '表格' }],
  }))

  return (
    <BookmarksTocLayout
      title="推特收藏"
      description="不为别的，只是为了更好的认识这个世界🌍"
      tocItems={tocItems}
      footer={<p>这里记录适合“收藏”的知识型推文/卡片，方便回看。</p>}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {knowledgeBookmarks.map((item, idx) => (
          <div
            key={item.title}
            className={
              item.featured
                ? 'border border-[#eee] bg-[#fafafa] dark:border-gray-800 dark:bg-gray-800/50 p-4'
                : 'border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4'
            }
          >
            <h2 id={`bookmark-${idx}`} className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24">
              {item.title}
            </h2>
            {item.description ? (
              <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>
            ) : null}

            <div id={`bookmark-${idx}-table`} className="mt-4 max-h-[70vh] overflow-y-auto pr-1 scroll-mt-24">
              {item.table && <KnowledgeTable table={item.table} />}
              {item.image && <ImageLightbox images={[item.image]} columns={1} />}
              {item.gallery && <ImageLightbox images={item.gallery} columns={2} />}
              {item.content ? (
                <div className="text-sm text-[#666] dark:text-gray-300">
                  {item.content.meta && item.content.meta.length > 0 ? (
                    <div className="text-xs text-[#999] dark:text-gray-400 space-y-1">
                      {item.content.meta.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  ) : null}

                  {item.content.quote ? (
                    <blockquote className="mt-3 border-l border-[#eee] dark:border-gray-800 pl-4 leading-relaxed">
                      {item.content.quote}
                    </blockquote>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </BookmarksTocLayout>
  )
}
