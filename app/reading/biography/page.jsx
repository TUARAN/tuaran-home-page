import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '读无用书 · 传记',
  description: '涂阿燃（tuaran）的读书笔记：传记类阅读记录与时间线整理。',
  keywords: ['涂阿燃', 'tuaran', '读书笔记', '传记', '阅读记录', '网络日志'],
  alternates: {
    canonical: '/reading/biography',
  },
}

export default function BiographyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">读无用书 · 传记</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">这里会整理传记类的阅读记录。</p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden md:block md:w-52 shrink-0">
          <nav className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-6">
            <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
              目录
            </div>
            <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              <li>
                <a
                  href="#su-shi"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  苏轼
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#su-shi-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      生平时间线表
                    </a>
                  </li>
                  <li>
                    <a href="#su-shi-compare" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      对照苏轼
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  href="#li-feifei"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  李飞飞
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#li-feifei-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      自传时间线
                    </a>
                  </li>
                  <li>
                    <a href="#ai-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      人工智能时间线
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 id="su-shi" className="text-[#444] text-lg dark:text-gray-200 scroll-mt-24">
              苏轼
            </h2>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
              以时间线的方式整理苏轼生平关键节点，便于回看“仕途—流放—心境—作品”之间的对应关系。
            </p>

            <h3 id="su-shi-timeline" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              生平时间线表
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件描述</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">人生特征 / 状态</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">代表作品</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">在位皇帝（在位时间）</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      time: '1037年',
                      age: 0,
                      event: '出生于四川眉山书香门第，父苏洵，弟苏辙',
                      state: '家学渊源，早慧',
                      works: '—',
                      emperor: '宋仁宗（1022–1063）',
                    },
                    {
                      time: '1057年',
                      age: 20,
                      event: '与苏辙同登进士第，名动京师',
                      state: '文名初成，仕途开启',
                      works: '《题西林壁》',
                      emperor: '宋仁宗',
                    },
                    {
                      time: '1059年',
                      age: 22,
                      event: '任凤翔府签判，开始地方官生涯',
                      state: '入世实践',
                      works: '—',
                      emperor: '宋仁宗',
                    },
                    {
                      time: '1061年',
                      age: 24,
                      event: '制科及第，授大理评事，后任密州知州',
                      state: '政务与文学并进',
                      works: '—',
                      emperor: '宋仁宗',
                    },
                    {
                      time: '1069年',
                      age: 32,
                      event: '王安石变法开始，苏轼公开反对新法',
                      state: '政见分歧，埋下贬谪伏笔',
                      works: '—',
                      emperor: '宋神宗（1067–1085）',
                    },
                    {
                      time: '1071年',
                      age: 34,
                      event: '调任杭州通判，治理有方，深得民心',
                      state: '治理能力突出',
                      works: '《饮湖上初晴后雨》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1073年',
                      age: 36,
                      event: '任密州知州，文风豪放成熟',
                      state: '豪放词风定型',
                      works: '《江城子·密州出猎》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1076年',
                      age: 39,
                      event: '任徐州知州，成功治理水患',
                      state: '实干官员形象',
                      works: '《浣溪沙·徐门石潭谢雨》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1079年',
                      age: 42,
                      event: '乌台诗案发，被捕后贬黄州',
                      state: '人生低谷，精神转折',
                      works: '《赤壁赋》《念奴娇·赤壁怀古》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1080年',
                      age: 43,
                      event: '黄州躬耕，自号“东坡居士”',
                      state: '旷达、超脱成型',
                      works: '《定风波·莫听穿林打叶声》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1083年',
                      age: 46,
                      event: '黄州定居，孤独而自守',
                      state: '内敛、清冷',
                      works: '《卜算子·黄州定慧院寓居作》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1084年',
                      age: 47,
                      event: '调任汝州、应天府',
                      state: '人生回暖',
                      works: '《和子由渑池怀旧》',
                      emperor: '宋神宗',
                    },
                    {
                      time: '1086年',
                      age: 49,
                      event: '哲宗即位，新党失势，召回京师，任翰林学士',
                      state: '政治短暂顺风期',
                      works: '《和陶渊明饮酒》',
                      emperor: '宋哲宗（1085–1100）',
                    },
                    {
                      time: '1089年',
                      age: 52,
                      event: '再任杭州知州，疏浚西湖',
                      state: '政声巅峰',
                      works: '《饮湖上初晴后雨·其二》',
                      emperor: '宋哲宗',
                    },
                    {
                      time: '1093年',
                      age: 56,
                      event: '任颍州知州，清廉爱民',
                      state: '稳健务实',
                      works: '—',
                      emperor: '宋哲宗',
                    },
                    {
                      time: '1094年',
                      age: 57,
                      event: '新法党复起，贬惠州，后至儋州',
                      state: '再度流放，精神自守',
                      works: '《记承天寺夜游》',
                      emperor: '宋哲宗',
                    },
                    {
                      time: '1100年',
                      age: 63,
                      event: '哲宗去世，徽宗即位，大赦召还',
                      state: '人生晚景，体弱多病',
                      works: '—',
                      emperor: '宋徽宗（1100–1126）',
                    },
                    {
                      time: '1101年',
                      age: 64,
                      event: '北归途中卒于常州，追谥“文忠”',
                      state: '一代文宗落幕',
                      works: '—',
                      emperor: '宋徽宗',
                    },
                  ].map((row) => (
                    <tr key={`${row.time}-${row.age}`} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">
                        <span className="font-bold text-[#444] dark:text-gray-200">{row.time}</span>
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 text-right whitespace-nowrap">
                        {row.age}
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.event}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.state}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.works}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{row.emperor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 id="su-shi-compare" className="mt-10 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              对照苏轼
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">维度</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">苏轼</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">tuaran</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      dim: '出身与起点',
                      a: '蜀地眉山书香门第，父苏洵、弟苏辙，起点极高',
                      b: '几乎无可继承的家族背景与资源',
                    },
                    {
                      dim: '早期阶段',
                      a: '少年得志，20岁进士，名动京师',
                      b: '早期在技术社区与科创项目中迅速成长',
                    },
                    {
                      dim: '核心能力',
                      a: '文采横溢 + 政务能力 + 情绪韧性',
                      b: '技术能力 + 系统化思维 + 写作表达',
                    },
                    {
                      dim: '所在系统',
                      a: '北宋文官体系，高度官僚化、派系化',
                      b: '大型组织/体制化环境',
                    },
                    {
                      dim: '主要冲突',
                      a: '与王安石新法集团理念冲突',
                      b: '与组织机制、评价体系、空转流程冲突',
                    },
                    {
                      dim: '第一次下坠',
                      a: '乌台诗案，被捕、贬黄州',
                      b: '职业与现实预期落差，情绪与现实双重挤压',
                    },
                    {
                      dim: '低谷状态',
                      a: '身份下降、资源剥离、被边缘化',
                      b: '责任较大、空间受限、心理耗损',
                    },
                    {
                      dim: '低谷应对',
                      a: '不内耗，不自毁，转向内在秩序',
                      b: '开始反思结构、记录、拆解问题',
                    },
                    {
                      dim: '关键转折',
                      a: '黄州时期，自号“东坡居士”',
                      b: '开始系统化写作、做表、建模型',
                    },
                    {
                      dim: '人格变化',
                      a: '从“士大夫”转为“完整的人”',
                      b: '从“执行者”转为“观察者+建构者”',
                    },
                    {
                      dim: '创作高峰',
                      a: '《赤壁赋》《定风波》《念奴娇》',
                      b: '组织分析、机制拆解、长文表达',
                    },
                    {
                      dim: '对苦难态度',
                      a: '“莫听穿林打叶声”',
                      b: '不再情绪化对抗，尝试结构性理解',
                    },
                    {
                      dim: '对世界判断',
                      a: '世界不完美，但仍可自得',
                      b: '系统失真，但仍可建立个人秩序',
                    },
                    {
                      dim: '最终定位',
                      a: '文学史上的“完成型人格”',
                      b: '尚未完成，但路径已清晰',
                    },
                    {
                      dim: '核心相同点',
                      a: <span className="font-bold text-[#444] dark:text-gray-200">都没把苦难变成怨恨</span>,
                      b: <span className="font-bold text-[#444] dark:text-gray-200">都在把混乱转化为结构</span>,
                    },
                    {
                      dim: '核心不同点',
                      a: '苏轼靠“文”完成自洽',
                      b: '你靠“系统+写作”完成自洽',
                    },
                  ].map((row) => (
                    <tr key={row.dim} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">
                        <span className="font-bold text-[#444] dark:text-gray-200">{row.dim}</span>
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.a}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900 mt-6">
            <h2 id="li-feifei" className="text-[#444] text-lg dark:text-gray-200 scroll-mt-24">
              李飞飞
            </h2>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
              华裔女科学家，计算机视觉教母，ImageNet创始人，推动了现代人工智能的视觉革命。
              通过对照自传时间线和AI发展时间线，理解个人贡献如何嵌入历史进程。
            </p>

            <h3 id="li-feifei-timeline" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              自传时间线
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件描述</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">状态与成就</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">关键贡献</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      time: '1976年',
                      age: 0,
                      event: '出生于北京知识分子家庭',
                      state: '童年在成都度过',
                      contribution: '—',
                    },
                    {
                      time: '1993年',
                      age: 16,
                      event: '随父母移民美国新泽西，语言障碍，餐馆打工',
                      state: '移民适应期，艰难奋斗',
                      contribution: '—',
                    },
                    {
                      time: '1995-1999',
                      age: '19-22',
                      event: '普林斯顿大学物理学和计算机科学双学位',
                      state: '学术基础建立',
                      contribution: '开始对计算机视觉产生兴趣',
                    },
                    {
                      time: '1999-2000',
                      age: 23,
                      event: '前往西藏研究藏医药一年',
                      state: '技术与人文交融',
                      contribution: '形成对科技与人文关系的思考',
                    },
                    {
                      time: '2000-2005',
                      age: '24-29',
                      event: '加州理工攻读电气工程博士，导师Pietro Perona',
                      state: '计算机视觉专业研究',
                      contribution: '物体识别的认知和计算模型研究',
                    },
                    {
                      time: '2005-2009',
                      age: '29-33',
                      event: 'UIUC和普林斯顿助理教授',
                      state: '早期教职和研究',
                      contribution: '构思和启动ImageNet项目',
                    },
                    {
                      time: '2009',
                      age: 33,
                      event: '加入斯坦福大学，ImageNet首次发布',
                      state: '学界反应冷淡，坚持愿景',
                      contribution: '1400万图像，2万类别，开创数据驱动AI',
                    },
                    {
                      time: '2010-2012',
                      age: '34-36',
                      event: '主办ImageNet挑战赛（ILSVRC）',
                      state: '持续推进，等待突破',
                      contribution: '2012年AlexNet验证大数据价值',
                    },
                    {
                      time: '2013-2015',
                      age: '37-39',
                      event: '深度学习爆发期，计算机视觉研究深化',
                      state: '学术影响力扩大',
                      contribution: '2015年ResNet超越人类，创立AI4ALL',
                    },
                    {
                      time: '2016-2017',
                      age: '40-41',
                      event: '启动智能医院项目，加入Google Cloud任首席科学家',
                      state: 'AI应用与产业化',
                      contribution: '推动AI民主化和伦理应用',
                    },
                    {
                      time: '2018',
                      age: 42,
                      event: '离开Google，回归斯坦福',
                      state: '重回学术和教育',
                      contribution: '专注AI伦理和政策研究',
                    },
                    {
                      time: '2019',
                      age: 43,
                      event: '联合创立斯坦福以人为本人工智能研究院（HAI）',
                      state: '推动负责任的AI发展',
                      contribution: '跨学科研究：技术+人文+社会',
                    },
                    {
                      time: '2020',
                      age: 44,
                      event: '入选美国国家工程院院士',
                      state: '学术地位确立',
                      contribution: 'AI伦理、医疗AI、教育推广',
                    },
                    {
                      time: '2021-2023',
                      age: '45-47',
                      event: '入选国家医学院院士，出版回忆录《The Worlds I See》',
                      state: 'AI伦理领袖',
                      contribution: 'HAI引领负责任AI讨论',
                    },
                    {
                      time: '2024-2026',
                      age: '48-50',
                      event: '继续领导HAI，推动AI政策和监管',
                      state: 'AI时代的思想领袖',
                      contribution: 'AI安全、伦理、教育普及',
                    },
                  ].map((row) => (
                    <tr key={row.time} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap text-[#999] dark:text-gray-400">
                        {row.time}
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 text-right text-[#999] dark:text-gray-400 whitespace-nowrap">
                        {row.age}
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.event}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.state}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 id="ai-timeline" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              人工智能时间线
            </h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">AI发展</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">技术突破</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">李飞飞节点</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      time: '1950-1956',
                      ai: '图灵测试、达特茅斯会议，AI诞生',
                      tech: '符号主义，早期专家系统',
                      li: '—',
                    },
                    {
                      time: '1957-1974',
                      ai: '感知机、ELIZA聊天机器人，黄金期',
                      tech: '神经网络雏形，过度乐观',
                      li: '—',
                    },
                    {
                      time: '1974-1980',
                      ai: '第一次AI寒冬，资金削减',
                      tech: '计算能力受限，承诺落空',
                      li: '李飞飞出生（1976）',
                    },
                    {
                      time: '1980-1987',
                      ai: '专家系统繁荣，商业化尝试',
                      tech: 'MYCIN医疗系统，日本第五代计算机',
                      li: '在成都成长',
                    },
                    {
                      time: '1987-1993',
                      ai: '第二次AI寒冬，专家系统衰落',
                      tech: '知识工程瓶颈，成本过高',
                      li: '1993年移民美国（16岁）',
                    },
                    {
                      time: '1997-1998',
                      ai: '深蓝战胜卡斯帕罗夫，MNIST数据集',
                      tech: '蛮力计算，机器学习范式转变',
                      li: '普林斯顿大学就读',
                    },
                    {
                      time: '2000-2005',
                      ai: 'SVM、集成学习、贝叶斯网络',
                      tech: '从符号主义到统计学习',
                      li: '加州理工读博，研究物体识别',
                    },
                    {
                      time: '2006',
                      ai: 'Hinton提出深度信念网络',
                      tech: '深度学习复兴，解决训练问题',
                      li: '构思ImageNet项目',
                    },
                    {
                      time: '2009',
                      ai: 'ImageNet数据集发布',
                      tech: '大规模标注数据，1400万图像',
                      li: '加入斯坦福，发布ImageNet',
                    },
                    {
                      time: '2012',
                      ai: 'AlexNet引爆深度学习革命',
                      tech: 'CNN+GPU，错误率从26%降至15%',
                      li: 'ImageNet验证大数据价值',
                    },
                    {
                      time: '2014-2015',
                      ai: 'GoogLeNet、VGG、ResNet，超越人类',
                      tech: '网络更深，计算机视觉成熟',
                      li: '创立AI4ALL，推动教育多样性',
                    },
                    {
                      time: '2016',
                      ai: 'AlphaGo击败李世石',
                      tech: '深度强化学习，复杂策略游戏突破',
                      li: '启动智能医院项目',
                    },
                    {
                      time: '2017',
                      ai: 'Transformer架构（Attention Is All You Need）',
                      tech: '改变NLP，奠定大语言模型基础',
                      li: '加入Google Cloud任首席科学家',
                    },
                    {
                      time: '2018',
                      ai: 'BERT、GPT发布',
                      tech: '预训练模型，迁移学习',
                      li: '回归斯坦福',
                    },
                    {
                      time: '2019',
                      ai: 'GPT-2，深度伪造技术',
                      tech: '生成能力惊人，伦理担忧',
                      li: '联合创立HAI（以人为本AI研究院）',
                    },
                    {
                      time: '2020',
                      ai: 'GPT-3（1750亿参数），AlphaFold 2',
                      tech: '大模型时代，蛋白质结构预测',
                      li: '入选美国国家工程院院士',
                    },
                    {
                      time: '2021-2022',
                      ai: 'DALL-E、GitHub Copilot、ChatGPT',
                      tech: '多模态生成，AI进入大众视野',
                      li: '入选国家医学院院士，AI伦理研究',
                    },
                    {
                      time: '2023',
                      ai: 'GPT-4，大模型竞赛（Claude、Gemini）',
                      tech: 'AI安全和监管成全球议题',
                      li: '出版回忆录《The Worlds I See》',
                    },
                    {
                      time: '2024-2025',
                      ai: 'AI Agent崛起，多模态模型成熟',
                      tech: 'AI在科学研究中深度应用',
                      li: 'HAI推动负责任AI发展',
                    },
                    {
                      time: '2026',
                      ai: 'AI无处不在，从工具到基础设施',
                      tech: '伦理、安全、监管成核心议题',
                      li: '继续领导HAI，AI政策和教育',
                    },
                  ].map((row) => (
                    <tr key={row.time} className="align-top">
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap text-[#999] dark:text-gray-400">
                        {row.time}
                      </td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.ai}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.tech}</td>
                      <td className="p-2 border-b border-[#eee] dark:border-gray-800">
                        {row.li !== '—' ? (
                          <span className="font-medium text-[#444] dark:text-gray-200">{row.li}</span>
                        ) : (
                          row.li
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
              <h4 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">核心洞见</h4>
              <ul className="text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
                <li>• <span className="font-medium">长期主义</span>：ImageNet从构思（2006）到引爆革命（2012）历时6年，坚持愿景换来历史性突破</li>
                <li>• <span className="font-medium">基础工作价值</span>：数据集不如算法&quot;性感&quot;，但改变了整个AI领域的范式</li>
                <li>• <span className="font-medium">数据驱动</span>：&quot;好的数据是AI成功的70%&quot;，数据质量比算法更重要</li>
                <li>• <span className="font-medium">以人为本</span>：技术进步必须伴随人文关怀，AI的目的是增强而非取代人类</li>
                <li>• <span className="font-medium">多样性与包容</span>：移民背景带来独特视角，通过AI4ALL推动女性和少数族裔参与</li>
                <li>• <span className="font-medium">跨学科思维</span>：物理学+计算机+神经科学+人文关怀，交叉领域产生创新</li>
              </ul>
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
