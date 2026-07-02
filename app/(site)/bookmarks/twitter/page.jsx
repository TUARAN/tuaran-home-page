import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import ImageLightbox from '../../components/ImageLightbox'
import RanbiPaywall from '../../components/RanbiPaywall'
import TwitterBookmarksFilterClient from './TwitterBookmarksFilterClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '推特收藏',
  description: '不为别的，只是为了更好的认识这个世界🌍',
  alternates: {
    canonical: '/bookmarks/twitter',
  },
}

const knowledgeBookmarks = [
  {
    title: '你人生中太晚明白的道理是什么？',
    category: '人生/成长',
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
    category: '人生/成长',
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
    title: '《明朝那些事》浓缩 16 句话',
    category: '历史',
    description: '金句摘录',
    tocLabel: '摘录',
    featured: false,
    content: {
      quote: (
        <ol className="list-decimal pl-5 space-y-2">
          <li>要战胜一个无原则的对手，唯一的方法就是放弃所有原则。</li>
          <li>
            读书的能力和处理问题的能力是不一样的。书读得好，不代表事情能处理得好，能列出计划，不代表能后执行计划。
          </li>
          <li>能改的，叫缺点，不能改的，叫弱点。</li>
          <li>不要以为渺小的，就没有力量，不要以为卑微的，就没有尊严。</li>
          <li>
            你还很年轻，将来你会遇到很多人，经历很多事，得到很多，也会失去很多。但无论如何，有两样东西，你绝对不能丢弃，一个叫良心，一个叫理想。
          </li>
          <li>暴力也许解决不了问题，但是可以解决你。</li>
          <li>利益，只有充足的利益，才有驱动人们的魔力，这就是这个世界的真实面目，极其残酷，却异常的真实。</li>
          <li>
            即使你拥有人人羡慕的容貌，博览群书的才学，挥之不尽的财富，也不能证明你的强大。因为心的强大，才是真正的强大。
          </li>
          <li>所谓成功就是用自己的方式度过人生。</li>
          <li>在这个污浊的世界上，能够干干净净度过自己一生的人，是值得钦佩的。</li>
          <li>得到后再失去，远比一无所有要痛苦的多。</li>
          <li>
            张牙舞爪的人，往往是脆弱的。因为真正强大的人，是自信的，自信就会温和，温和就会坚定。
          </li>
          <li>一个人可以影响多数人于暂时，也可以影响少数人于永远，但无法影响多数人于永远。</li>
          <li>
            一个人要显示自己的力量，从来不是靠暴力，挑战这一准则的人必然会被历史从强者行列中淘汰，历来如此。
          </li>
          <li>历史告诉我们，所谓道德和公理，只有在实力相等的情况下才能拿出来讨论。</li>
          <li>
            只有真正了解这个世界的丑陋与污浊，被现实打击，被痛苦折磨，遍体鳞伤，无所遁形，却从未放弃对光明的追寻，依然微笑着，坚定前行的人，才是真正的勇者。
          </li>
        </ol>
      ),
    },
  },
  {
    title: '万年后，谁会被人类记住？',
    category: '历史',
    description: '科学家 vs 政治军事人物的留名之辩',
    tocLabel: '摘录',
    content: {
      meta: ['知乎 · 作者：人人都有不得已'],
      quote: (
        <>
          万年后，如果人类还有文明存在，牛顿、爱因斯坦、达尔文、麦克斯韦、伽利略、弗莱明等科学家都是绕不过去的存在，李白、杜甫、李后主、苏东坡等，能否被记住，要看汉字是否争气，但是，什么秦皇汉武、唐宗宋祖、朱元璋、康熙乾隆，凯撒、亚历山大，列宁、斯大林，被人记住的可能性，要小的多。
          <br />
          <br />
          所以，谁最伟大，我认牛顿，余下的达尔文、麦克斯韦、爱因斯坦等人争第二。在我心中，最伟大人物的前一百，也不会有政治军事领域的人物，这两个领域，除了极少数，简直是人渣、魔鬼的集中营。
          <br />
          <br />
          <a
            href="https://www.zhihu.com/question/8469060499/answer/82513981799"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#999] underline underline-offset-2 dark:text-gray-400"
          >
            原文链接（知乎）
          </a>
        </>
      ),
    },
  },
  {
    title: '建议收藏：一张表读懂中国传统文化核心常识',
    category: '文化常识',
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
    title: '富人 VS 穷人 思维对照表',
    category: '财富/投资',
    description: '序号 / 富人思维 / 穷人思维',
    tocLabel: '对照表',
    table: {
      headers: ['序号', '富人思维', '穷人思维'],
      rows: [
        ['1', '投资', '存钱'],
        ['2', '改变', '抱怨'],
        ['3', '向前看', '向后看'],
        ['4', '内耗少', '想太多'],
        ['5', '学管理', '学手艺'],
        ['6', '有目标', '爱瞎想'],
        ['7', '赚钱容易', '钱不好赚'],
        ['8', '控制风险', '拒绝冒险'],
        ['9', '博览群书', '刷短视频'],
        ['10', '有钱一起赚', '有钱自己赚'],
        ['11', '我想办法找资金', '我没有资金'],
        ['12', '我还很年轻', '要是我再年轻一点'],
        ['13', '不一定要赢', '我不可能赢'],
        ['14', '时间就是金钱', '时间用来挥霍'],
        ['15', '相信人定胜天', '全归咎于命运'],
        ['16', '我会不断学习', '我受的教育有限'],
        ['17', '贫穷是罪恶之源', '金钱是罪恶之源'],
        ['18', '我让金钱为我工作', '我要为赚钱提醒工作'],
        ['19', '逆境是上天的赏赐', '逆境是上天的惩罚'],
        ['20', '在自己身上找原因', '把错误归咎于他人'],
        ['21', '认为自己生来就该做富人', '认为自己一生就该如此'],
        ['22', '好好学习，为了收购好公司', '好好学习，为了找份好工作'],
        ['23', '写商业计划书，创建优秀的公司', '写漂亮的简历，找稳定的工作'],
      ],
    },
  },
  {
    title: '如果我能回到2008年，我一定会这样做',
    category: '财富/投资',
    description: '投资时间线（2008–2026）',
    tocLabel: '时间线',
    featured: true,
    content: {
      quote: (
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <span className="font-semibold">2008.10</span> 美股暴跌底：抄底苹果、亚马逊、谷歌
          </li>
          <li>
            <span className="font-semibold">2009.01.03</span> 比特币诞生：无脑挖矿，一分钱成本，亿倍收益
          </li>
          <li>
            <span className="font-semibold">2010</span> 比特币极低位：能买多少买多少，拿死不动
          </li>
          <li>
            <span className="font-semibold">2013</span> 比特币第一次大牛市：轻松百万倍收益
          </li>
          <li>
            <span className="font-semibold">2016 年初</span> 比特币 + 特斯拉低位：重仓这两个，人生直接起飞
          </li>
          <li>
            <span className="font-semibold">2017 年底</span> 加密货币大牛市：资产再翻 10–20 倍
          </li>
          <li>
            <span className="font-semibold">2020.03</span> 疫情暴跌黄金坑：抄底美股、比特币
          </li>
          <li>
            <span className="font-semibold">2021.11</span> 比特币历史高位：大幅减仓，落袋为安
          </li>
          <li>
            <span className="font-semibold">2022.09</span> 白银 4.15 元/克：重仓买入白银
          </li>
          <li>
            <span className="font-semibold">2023.03</span> 黄金约 410 元/克：重仓买入黄金
          </li>
          <li>
            <span className="font-semibold">2026 年初</span> 黄金、白银历史高位：全部卖出，落袋为安
          </li>
          <li>原来这十几年来，机会有那么多……</li>
        </ol>
      ),
    },
  },
  {
    title: '改变世界的 17 个方程',
    category: '科学/数学',
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
    title: '计算机知识树',
    category: '计算机/技术',
    description: '结构化速览',
    tocLabel: '树形图',
    content: {
      quote: (
        <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed">
          {`计算机知识树
├── 本质与理论
│   ├── 信息
│   │   ├── 表示：二进制、编码、格式
│   │   ├── 压缩：无损、有损
│   │   └── 噪声与纠错：冗余、校验
│   ├── 计算模型
│   │   ├── 可计算性：哪些问题能算
│   │   └── 复杂性：算到什么规模划算
│   └── 算法
│       ├── 正确性：证明与测试
│       ├── 效率：时间、空间
│       └── 鲁棒：异常与不确定
├── 硬件层
│   ├── 处理器
│   │   ├── 指令执行：取指、译码、执行
│   │   ├── 并行：流水线、多核
│   │   └── 加速：向量化、专用单元
│   ├── 存储
│   │   ├── 寄存器与缓存
│   │   ├── 内存
│   │   └── 磁盘与持久化
│   ├── 输入输出
│   │   ├── 设备与驱动
│   │   └── 总线与中断
│   └── 网络互连
│       ├── 带宽与延迟
│       └── 拓扑与协议
├── 软件层
│   ├── 操作系统
│   │   ├── 进程线程：并发与调度
│   │   ├── 虚拟内存：隔离与映射
│   │   ├── 文件系统：命名与持久化
│   │   └── 安全：权限与沙箱
│   ├── 语言与编译
│   │   ├── 语法与语义
│   │   ├── 编译优化
│   │   └── 运行时：内存管理、并发模型
│   ├── 数据系统
│   │   ├── 事务处理：一致性与恢复
│   │   ├── 分析处理：批处理与流处理
│   │   └── 缓存与索引：性能工程
│   └── 应用与服务
│       ├── 客户端：交互与体验
│       ├── 后端：业务与接口
│       └── 可观测：日志、指标、追踪
├── 系统形态与规模
│   ├── 单机系统
│   ├── 分布式系统
│   │   ├── 一致性与可用性权衡
│   │   ├── 容错：复制与恢复
│   │   └── 扩展：分片与负载均衡
│   ├── 云与平台
│   │   ├── 虚拟化与容器
│   │   ├── 弹性与调度
│   │   └── 成本与计量
│   └── 边缘与嵌入式
│       ├── 实时性
│       └── 能耗约束
└── 现实世界影响
├── 经济
│   ├── 复制成本趋近零
│   └── 平台与网络效应
├── 安全
│   ├── 攻击面扩大
│   └── 供应链与信任
└── 组织
├── 流程软件化
└── 协作工具与治理`}
        </pre>
      ),
    },
  },
  {
    title: '中国行政干部层级与人数分布',
    category: '政治/治理',
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
    title: '近10年资产表现排名',
    category: '财富/投资',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/assets-performance-10y.webp',
      alt: '近10年资产表现排名',
    },
  },
  {
    title: '一图了解美元体系',
    category: '财富/投资',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/usd-system.webp',
      alt: '一图了解美元体系',
    },
  },
  {
    title: '世界历史朝代图谱',
    category: '历史',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/world-history-dynasties.webp',
      alt: '世界历史朝代图谱',
    },
  },
  {
    title: '中国必爬名山',
    category: '地理/旅行',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/china-must-climb-famous-mountains.webp',
      alt: '中国必爬名山',
    },
  },
  {
    title: '普通人如何翻身',
    category: '财富/投资',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/how-ordinary-people-turn-their-lives-around.webp',
      alt: '普通人如何翻身',
    },
  },
  {
    title: '禅宗启示',
    category: '哲学/禅',
    description: '图片速览',
    tocLabel: '图片',
    image: {
      src: '/bookmarks/twitter/zen-koan.webp',
      alt: '禅宗启示',
    },
  },
  {
    title: '国家机构图解',
    category: '政治/治理',
    description: '两图并排（支持点击全屏查看）',
    tocLabel: '图解',
    gallery: [
      {
        src: '/bookmarks/twitter/state-org-1.webp',
        alt: '国家机构图解（1）',
      },
      {
        src: '/bookmarks/twitter/state-org-2.webp',
        alt: '国家机构图解（2）',
      },
    ],
  },
  {
    title: '利出一孔：一种政治经济控制框架',
    category: '政治/治理',
    description: '「利出一孔」结构图 + 经济评论摘要',
    tocLabel: '树形图',
    featured: true,
    content: {
      meta: ['概念出自《管子》《商君书》——「利出一孔者，其国无敌」'],
      quote: (
        <>
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed">
            {`利出一孔
├── 政治控制
│   ├── 户籍 + 连坐
│   ├── 升迁独木桥（当官）
│   └── 官场依附生态
├── 经济压制
│   ├── 农为本，商为贱
│   ├── 商人禁政权
│   └── 资源国家垄断
├── 社会结果
│   ├── 官权支配一切
│   ├── 公民社会难以生成
│   └── 每次变革沦为"换皮"
└── 根本问题
    ├── 路径依赖 → 制度自强化
    └── 政治封闭 → 没有出口`}
          </pre>
          <span className="mt-3 block">
            <strong>评论摘要</strong>
            ：本图借「利出一孔」（利益只从单一通道流出）框架，归纳一种观点——中国经济的症结不在金融，而在统治结构对利益通道的垄断，故直接融资难以被真正放开。该观点认为，真实矛盾是统治力量与民众发展诉求之间的矛盾，金融改革与刺激解决不了：市场缺的是「收益」而非资金或信心（投入普遍亏损，却被归因为信心不足）；高储蓄率具误导性，储蓄集中于少数人而非普通民众。结论是——靠金融偏门难以续命，否则经济发展成果会流失。（系对某视频观点的归纳，非本站判断。）
          </span>
        </>
      ),
    },
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

export default function TwitterBookmarksPage({ searchParams } = {}) {
  const CATEGORY_ORDER = [
    '哲学/禅',
    '人生/成长',
    '财富/投资',
    '历史',
    '文化常识',
    '科学/数学',
    '计算机/技术',
    '政治/治理',
    '地理/旅行',
  ]
  const FORMAT_ORDER = ['摘录', '时间线', '速查表', '对照表', '方程表', '树形图', '人数表', '图片', '图解']

  const allBookmarks = knowledgeBookmarks.map((item, idx) => ({
    ...item,
    _id: `bookmark-${idx}`,
    _contentId: `bookmark-${idx}-table`,
    _format: item.tocLabel || '其他',
  }))

  const unique = (arr) => Array.from(new Set(arr))

  const sortByOrder = (values, order) => {
    const orderIndex = new Map(order.map((v, i) => [v, i]))
    return [...values].sort((a, b) => {
      const ai = orderIndex.has(a) ? orderIndex.get(a) : Number.POSITIVE_INFINITY
      const bi = orderIndex.has(b) ? orderIndex.get(b) : Number.POSITIVE_INFINITY
      if (ai !== bi) return ai - bi
      return String(a).localeCompare(String(b), 'zh-Hans-CN')
    })
  }

  const allCategories = sortByOrder(unique(allBookmarks.map((b) => b.category).filter(Boolean)), CATEGORY_ORDER)
  const allFormats = sortByOrder(unique(allBookmarks.map((b) => b.tocLabel || '其他')), FORMAT_ORDER)

  const categoriesInView = allCategories
  const categoryIdMap = new Map(categoriesInView.map((cat, idx) => [cat, `category-${idx}`]))

  const tocItems = categoriesInView.map((category) => ({
    id: categoryIdMap.get(category),
    title: category,
    subItems: allBookmarks
      .filter((b) => b.category === category)
      .map((b) => ({
        id: b._id,
        label: b.title,
      })),
  }))

  const initialSelectedCategories = (() => {
    if (!searchParams?.category) return []
    return Array.isArray(searchParams.category) ? searchParams.category : [searchParams.category]
  })()
  const initialSelectedFormats = (() => {
    if (!searchParams?.format) return []
    return Array.isArray(searchParams.format) ? searchParams.format : [searchParams.format]
  })()

  const itemsMeta = allBookmarks.map((b) => ({
    id: b._id,
    category: b.category,
    format: b._format,
    categorySectionId: categoryIdMap.get(b.category),
  }))

  return (
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-twitter" />
      <RanbiPaywall resourceKey="resource:bookmarks-twitter" unitLabel="资源">
        <BookmarksTocLayout
          title="推特收藏"
          description="不为别的，只是为了更好的认识这个世界🌍"
          tocItems={tocItems}
          footer={<p>这里记录适合“收藏”的知识型推文/卡片，方便回看。</p>}
        >
          <TwitterBookmarksFilterClient
            categories={allCategories}
            formats={allFormats}
            itemsMeta={itemsMeta}
            initialSelectedCategories={initialSelectedCategories}
            initialSelectedFormats={initialSelectedFormats}
          />

      <div className="space-y-10">
        {categoriesInView.map((category) => {
          const items = allBookmarks.filter((b) => b.category === category)
          if (items.length === 0) return null

          const categoryId = categoryIdMap.get(category)
          return (
            <section
              key={category}
              data-bookmark-category-section-id={categoryId}
              aria-hidden="false"
            >
              <h2 id={categoryId} className="text-lg font-semibold text-[#333] dark:text-gray-100 scroll-mt-24">
                {category}
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6">
                {items.map((item) => (
                  <div
                    key={item.title}
                    data-bookmark-id={item._id}
                    data-bookmark-category={item.category}
                    data-bookmark-format={item._format}
                    aria-hidden="false"
                    className={
                      item.featured
                        ? 'border border-[#eee] bg-[#fafafa] dark:border-gray-800 dark:bg-gray-800/50 p-4'
                        : 'border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4'
                    }
                  >
                    <h3 id={item._id} className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24">
                      {item.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#999] dark:text-gray-400">
                      <span className="rounded-full border border-[#eee] dark:border-gray-800 px-2 py-0.5">
                        {item.category}
                      </span>
                      <span className="rounded-full border border-[#eee] dark:border-gray-800 px-2 py-0.5">
                        {item.tocLabel || '其他'}
                      </span>
                    </div>

                    {item.description ? (
                      <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>
                    ) : null}

                    <div id={item._contentId} className="mt-4 max-h-[70vh] overflow-y-auto pr-1 scroll-mt-24">
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
            </section>
          )
        })}
      </div>
        </BookmarksTocLayout>
      </RanbiPaywall>
      <ContentEngagement contentKey="resource:bookmarks-twitter" width="standard" />
    </>
  )
}
