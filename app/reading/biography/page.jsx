import Image from 'next/image'

import SettingsButton from '../../components/SettingsButton'

import ilyaAvatar from './avatar/伊利亚.jpeg'
import liFeifeiAvatar from './avatar/李飞飞.jpeg'
import leCunAvatar from './avatar/杨立昆.jpeg'

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
                  href="#ai-biography"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  人工智能人物传记
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#ai-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      人工智能时间线
                    </a>
                  </li>
                  <li>
                    <a href="#li-feifei" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      李飞飞
                    </a>
                    <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                      <li>
                        <a href="#li-feifei-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                          人物时间线
                        </a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <a href="#ai-lecun" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      杨立昆
                    </a>
                    <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                      <li>
                        <a href="#ai-lecun-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                          人物时间线
                        </a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <a href="#ai-sutskever" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      伊尔亚
                    </a>
                    <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                      <li>
                        <a href="#ai-sutskever-timeline" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                          人物时间线
                        </a>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <a href="#ai-turing" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Alan Turing
                    </a>
                  </li>
                  <li>
                    <a href="#ai-mccarthy" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      John McCarthy
                    </a>
                  </li>
                  <li>
                    <a href="#ai-minsky" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Marvin Minsky
                    </a>
                  </li>
                  <li>
                    <a href="#ai-vapnik" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Vladimir Vapnik
                    </a>
                  </li>
                  <li>
                    <a href="#ai-pearl" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Judea Pearl
                    </a>
                  </li>
                  <li>
                    <a href="#ai-hinton" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Geoffrey Hinton
                    </a>
                  </li>
                  <li>
                    <a href="#ai-bengio" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Yoshua Bengio
                    </a>
                  </li>
                  <li>
                    <a href="#ai-krizhevsky" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Alex Krizhevsky
                    </a>
                  </li>
                  <li>
                    <a href="#ai-sutton" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Richard Sutton
                    </a>
                  </li>
                  <li>
                    <a href="#ai-hassabis" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Demis Hassabis
                    </a>
                  </li>
                  <li>
                    <a href="#ai-amodei" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Dario Amodei
                    </a>
                  </li>
                  <li>
                    <a href="#ai-jensen-huang" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Jensen Huang
                    </a>
                  </li>
                  <li>
                    <a href="#ai-andrew-ng" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      Andrew Ng
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
            <h2 id="ai-biography" className="text-[#444] text-lg dark:text-gray-200 scroll-mt-24">
              人工智能人物传记
            </h2>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
              以“人物画像”的方式梳理 AI 发展的关键推手：他们在什么时代解决了什么问题、形成了什么方法论、留下了哪些长期影响。
              （先搭骨架，后续逐个补全。）
            </p>

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

            <h3
              id="li-feifei"
              className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24 flex items-center gap-3"
            >
              <Image
                src={liFeifeiAvatar}
                alt="李飞飞"
                width={48}
                height={48}
                className="rounded-full border border-[#eee] dark:border-gray-800"
              />
              <span>李飞飞</span>
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
              华裔女科学家，计算机视觉教母，ImageNet 创始人，推动了现代人工智能的视觉革命。
              通过对照人物时间线和 AI 发展时间线，理解个人贡献如何嵌入历史进程。
            </p>

            <h4 id="li-feifei-timeline" className="mt-8 text-[#444] text-sm font-bold dark:text-gray-200 scroll-mt-24">
              人物时间线
            </h4>

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
                      event: '加州理工攻读电气工程博士，导师 Pietro Perona',
                      state: '计算机视觉专业研究',
                      contribution: '物体识别的认知和计算模型研究',
                    },
                    {
                      time: '2005-2009',
                      age: '29-33',
                      event: 'UIUC 和普林斯顿助理教授',
                      state: '早期教职和研究',
                      contribution: '构思和启动 ImageNet 项目',
                    },
                    {
                      time: '2009',
                      age: 33,
                      event: '加入斯坦福大学，ImageNet 首次发布',
                      state: '学界反应冷淡，坚持愿景',
                      contribution: '1400万图像，2万类别，开创数据驱动 AI',
                    },
                    {
                      time: '2010-2012',
                      age: '34-36',
                      event: '主办 ImageNet 挑战赛（ILSVRC）',
                      state: '持续推进，等待突破',
                      contribution: '2012 年 AlexNet 验证大数据价值',
                    },
                    {
                      time: '2013-2015',
                      age: '37-39',
                      event: '深度学习爆发期，计算机视觉研究深化',
                      state: '学术影响力扩大',
                      contribution: '2015 年 ResNet 超越人类，创立 AI4ALL',
                    },
                    {
                      time: '2016-2017',
                      age: '40-41',
                      event: '启动智能医院项目，加入 Google Cloud 任首席科学家',
                      state: 'AI 应用与产业化',
                      contribution: '推动 AI 民主化和伦理应用',
                    },
                    {
                      time: '2018',
                      age: 42,
                      event: '离开 Google，回归斯坦福',
                      state: '重回学术和教育',
                      contribution: '专注 AI 伦理和政策研究',
                    },
                    {
                      time: '2019',
                      age: 43,
                      event: '联合创立斯坦福以人为本人工智能研究院（HAI）',
                      state: '推动负责任的 AI 发展',
                      contribution: '跨学科研究：技术 + 人文 + 社会',
                    },
                    {
                      time: '2020',
                      age: 44,
                      event: '入选美国国家工程院院士',
                      state: '学术地位确立',
                      contribution: 'AI 伦理、医疗 AI、教育推广',
                    },
                    {
                      time: '2021-2023',
                      age: '45-47',
                      event: '入选国家医学院院士，出版回忆录《The Worlds I See》',
                      state: 'AI 伦理领袖',
                      contribution: 'HAI 引领负责任 AI 讨论',
                    },
                    {
                      time: '2024-2026',
                      age: '48-50',
                      event: '继续领导 HAI，推动 AI 政策和监管',
                      state: 'AI 时代的思想领袖',
                      contribution: 'AI 安全、伦理、教育普及',
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

            <div className="mt-6 p-4 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
              <h4 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">核心洞见</h4>
              <ul className="text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
                <li>• <span className="font-medium">长期主义</span>：ImageNet 从构思（2006）到引爆革命（2012）历时 6 年，坚持愿景换来历史性突破</li>
                <li>• <span className="font-medium">基础工作价值</span>：数据集不如算法“性感”，但改变了整个 AI 领域的范式</li>
                <li>• <span className="font-medium">数据驱动</span>：“好的数据是 AI 成功的重要前提”，数据质量往往比小幅算法改进更关键</li>
                <li>• <span className="font-medium">以人为本</span>：技术进步必须伴随人文关怀，AI 的目的是增强而非取代人类</li>
                <li>• <span className="font-medium">多样性与包容</span>：移民背景带来独特视角，通过 AI4ALL 推动女性和少数族裔参与</li>
                <li>• <span className="font-medium">跨学科思维</span>：物理学 + 计算机 + 神经科学 + 人文关怀，交叉领域产生创新</li>
              </ul>
            </div>

            <h3 id="ai-turing" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Alan Turing
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：提出可操作的“智能判别”问题，为计算与智能讨论定了起点。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：关键论文 / 图灵测试 / 时代背景</li>
              <li>• 贡献与影响（待补）：把哲学问题工程化</li>
              <li>• 对我的启发（待补）：如何把宏大命题降维成可验证指标</li>
            </ul>

            <h3 id="ai-mccarthy" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              John McCarthy
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：提出“Artificial Intelligence”概念，奠定早期研究议程与方法边界。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：达特茅斯会议 / 早期实验室与系统</li>
              <li>• 贡献与影响（待补）：把学科命名=把问题域框定</li>
              <li>• 对我的启发（待补）：命名与议程设置的力量</li>
            </ul>

            <h3 id="ai-minsky" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Marvin Minsky
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：符号主义代表人物之一，推动早期 AI 社群与研究范式成形。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：黄金期 / 寒冬前后的路线选择</li>
              <li>• 贡献与影响（待补）：问题分解与“心智模块化”的思路</li>
              <li>• 对我的启发（待补）：范式之争背后是资源与可计算性</li>
            </ul>

            <h3 id="ai-vapnik" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Vladimir Vapnik
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：统计学习理论代表人物，把“泛化能力”变成可讨论的数学语言。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：VC 理论 / SVM / 统计学习浪潮</li>
              <li>• 贡献与影响（待补）：用理论约束经验主义</li>
              <li>• 对我的启发（待补）：指标不是结果，指标是边界</li>
            </ul>

            <h3 id="ai-pearl" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Judea Pearl
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：因果推断体系化，把“因果”从直觉变成可计算与可表达。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：贝叶斯网络 / 因果图 / do-演算</li>
              <li>• 贡献与影响（待补）：从相关走向干预与反事实</li>
              <li>• 对我的启发（待补）：解释与决策需要不同的模型语言</li>
            </ul>

            <h3 id="ai-hinton" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Geoffrey Hinton
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：表示学习与深度学习复兴的关键推动者之一，长期押注神经网络路线。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：反向传播 / 深度信念网络 / 2012 之后</li>
              <li>• 贡献与影响（待补）：把“表征”当作核心资产</li>
              <li>• 对我的启发（待补）：长期下注 + 关键时刻的范式跃迁</li>
            </ul>

            <h3
              id="ai-lecun"
              className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24 flex items-center gap-3"
            >
              <Image
                src={leCunAvatar}
                alt="杨立昆"
                width={48}
                height={48}
                className="rounded-full border border-[#eee] dark:border-gray-800"
              />
              <span>杨立昆（Yann LeCun）</span>
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
              法裔美籍计算机科学家，长期工作于机器学习、计算机视觉、机器人与图像压缩等领域。
              他最为人所知的是卷积神经网络在 OCR / 视觉中的开创性应用（LeNet 路线），以及把研究推进到可部署系统；同时也参与了 DjVu 图像压缩技术等工程化成果。
              职业路径上，他的主线非常清晰：Bell Labs 的工业场景锻造了“端到端可用系统”的审美；NYU/Meta 阶段则把这种审美扩展为研究平台与组织能力。
            </p>

            <h4 id="ai-lecun-timeline" className="mt-8 text-[#444] text-sm font-bold dark:text-gray-200 scroll-mt-24">
              人物时间线
            </h4>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件描述</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">状态与成就</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">关键贡献 / 关键词</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      time: '1960-07-08',
                      age: 0,
                      event: '出生于法国巴黎郊区 Soisy-sous-Montmorency',
                      state: '法国成长背景，后来成为法裔美籍科学家',
                      contribution: '—',
                    },
                    {
                      time: '1983',
                      age: 23,
                      event: '获 ESIEE Paris 工程师文凭（DipIng）',
                      state: '工程背景打底',
                      contribution: '工程训练',
                    },
                    {
                      time: '1987',
                      age: 27,
                      event: '获 Université Pierre et Marie Curie（现 Sorbonne University）计算机博士学位',
                      state: '在博士阶段提出早期反向传播形式之一（连接主义学习模型）',
                      contribution: 'Backprop（早期形式）/ 连接主义',
                    },
                    {
                      time: '1987-1988',
                      age: '27-28',
                      event: '多伦多大学做博士后研究（导师 Geoffrey Hinton）',
                      state: '与深度学习共同体核心人物形成学术连接',
                      contribution: '研究共同体 / 路线延续',
                    },
                    {
                      time: '1988-1996',
                      age: '28-36',
                      event: '加入 AT&T Bell Labs（Adaptive Systems Research）',
                      state: '把卷积网络等方法用于手写识别与 OCR，并走向大规模部署',
                      contribution: 'LeNet / OCR / “可部署”机器学习',
                    },
                    {
                      time: '1989-1990',
                      age: '29-30',
                      event: '提出并应用于手写识别的一系列工作（如 ZIP code 识别、Optimal Brain Damage）',
                      state: '把“训练—正则—部署”作为一体化问题处理',
                      contribution: '手写识别 / OBD 正则 / 工程闭环',
                    },
                    {
                      time: '1996',
                      age: 36,
                      event: '转入 AT&T Labs-Research，负责图像处理方向团队',
                      state: '从识别系统延伸到压缩与分发链路',
                      contribution: 'DjVu 图像压缩（参与）',
                    },
                    {
                      time: '1998',
                      age: 38,
                      event: '发表文档识别的经典综述（Gradient-based learning applied to document recognition）',
                      state: '把端到端学习方法系统化总结',
                      contribution: 'LeNet 体系化 / 文档识别',
                    },
                    {
                      time: '2003',
                      age: 43,
                      event: '加入纽约大学 NYU（Courant Institute），任 Jacob T. Schwartz 讲席教授',
                      state: '在学术体系内推进能量模型、表征学习与机器人方向',
                      contribution: 'Energy-based models / 视觉表征 / 机器人',
                    },
                    {
                      time: '2012',
                      age: 52,
                      event: '担任 NYU Center for Data Science 创始主任（后卸任）',
                      state: '把数据科学与机器学习研究组织化',
                      contribution: '研究组织与平台建设',
                    },
                    {
                      time: '2013年',
                      age: 53,
                      event: '加入 Facebook（现 Meta），领导 FAIR（AI Research）并担任 Chief AI Scientist',
                      state: '把研究实验室做成长期运转的组织能力',
                      contribution: 'FAIR / 研究平台化',
                    },
                    {
                      time: '2013',
                      age: 53,
                      event: '与 Yoshua Bengio 共同发起 ICLR（International Conference on Learning Representations）',
                      state: '推动开放评审与新兴学术共同体',
                      contribution: 'ICLR / 共同体建设',
                    },
                    {
                      time: '2018年',
                      age: 58,
                      event: '与 Geoffrey Hinton、Yoshua Bengio 共同获得 ACM 图灵奖',
                      state: '深度学习成为主流范式的标志性事件',
                      contribution: '深度学习范式确立（里程碑）',
                    },
                    {
                      time: '2021',
                      age: 61,
                      event: '当选美国国家科学院成员（NAS）',
                      state: '学术荣誉与影响力进一步确认',
                      contribution: '—',
                    },
                    {
                      time: '2023',
                      age: 63,
                      event: '获法国荣誉军团勋章（Legion of Honour）',
                      state: '跨国学术与产业影响的认可',
                      contribution: '—',
                    },
                    {
                      time: '2024-2025',
                      age: '64-65',
                      event: '获 VinFuture Prize（2024）、Queen Elizabeth Prize for Engineering（2025）等',
                      state: '作为深度学习时代关键人物被持续表彰',
                      contribution: '学术与工程影响力',
                    },
                    {
                      time: '2025',
                      age: 65,
                      event: '离开 Meta，转向个人创业（世界模型/类人智能方向）',
                      state: '把研究议程延伸为新的组织与产品形态',
                      contribution: 'World-model architectures（路线选择）',
                    },
                    {
                      time: '2020年代',
                      age: '60+ ',
                      event: '持续推动自监督学习与“世界模型”式表征范式（如 JEPA 思路）',
                      state: '把重点从“纯监督规模化”转向“可建模世界”的表征与规划',
                      contribution: '自监督 / 表征 / 世界模型',
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

            <div className="mt-6 p-4 bg-[#fafafa] dark:bg-gray-800/50 border border-[#eee] dark:border-gray-800">
              <h4 className="text-sm font-bold text-[#444] dark:text-gray-200 mb-2">核心洞见（我想抓住的 5 件事）</h4>
              <ul className="text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
                <li>• <span className="font-medium">结构=先验</span>：CNN 的价值不是“更深”，而是把局部性与平移不变性写进了模型，使学习更高效、更稳定。</li>
                <li>• <span className="font-medium">端到端</span>：尽量减少手工特征与规则，把优化目标交给数据与梯度，这是一种工程哲学。</li>
                <li>• <span className="font-medium">可落地才算数</span>：Bell Labs 的 OCR/支票识别是典型样本：研究价值最终要穿过部署与规模化的门槛。</li>
                <li>• <span className="font-medium">范式不是一次胜利</span>：从 CNN 到自监督/世界模型，他始终在做同一件事：寻找更通用的表征学习机制。</li>
                <li>• <span className="font-medium">研究平台化</span>：从 NYU 到 FAIR，再到创业，贯穿的是“把议程做成组织能力”，而不是只做一次性成果。</li>
              </ul>
            </div>

            <h3
              id="ai-sutskever"
              className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24 flex items-center gap-3"
            >
              <Image
                src={ilyaAvatar}
                alt="伊尔亚"
                width={48}
                height={48}
                className="rounded-full border border-[#eee] dark:border-gray-800"
              />
              <span>伊尔亚</span>
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：大模型路线的关键推动者之一，代表“训练范式 + 直觉驱动”的研究风格。</p>

            <h4 id="ai-sutskever-timeline" className="mt-8 text-[#444] text-sm font-bold dark:text-gray-200 scroll-mt-24">
              人物时间线
            </h4>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
                <thead className="bg-white dark:bg-gray-900">
                  <tr className="text-xs text-[#999] dark:text-gray-400">
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">时间</th>
                    <th className="text-right font-bold p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">年龄</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">事件描述</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">状态与成就</th>
                    <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">关键贡献 / 关键词</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      time: '1986-12-08',
                      age: 0,
                      event: '出生于苏联俄罗斯高尔基（今下诺夫哥罗德）',
                      state: '后成为加拿大 / 以色列公民',
                      contribution: '—',
                    },
                    {
                      time: '2000-2002',
                      age: '13-15',
                      event: '就读以色列开放大学',
                      state: '早期学习阶段',
                      contribution: '数学 / 计算机基础',
                    },
                    {
                      time: '2002',
                      age: 15,
                      event: '与家人移居加拿大，转入多伦多大学',
                      state: '进入北美学术体系',
                      contribution: '—',
                    },
                    {
                      time: '2005',
                      age: 18,
                      event: '获多伦多大学数学学士学位（BSc）',
                      state: '本科毕业',
                      contribution: '数学训练',
                    },
                    {
                      time: '2007',
                      age: 20,
                      event: '获多伦多大学计算机科学硕士学位（MSc）',
                      state: '研究训练深化',
                      contribution: '序列模型研究积累',
                    },
                    {
                      time: '2012',
                      age: 25,
                      event: '在 Geoffrey Hinton 指导下获多伦多大学博士学位（PhD）',
                      state: '深度学习学派核心梯队',
                      contribution: '深度学习训练与优化（论文/学位工作）',
                    },
                    {
                      time: '2012',
                      age: 25,
                      event: '在斯坦福大学师从吴恩达做了约两个月博士后',
                      state: '短期博士后经历',
                      contribution: '研究网络扩展',
                    },
                    {
                      time: '2012-2013',
                      age: '25-26',
                      event: '加入 DNNResearch（Hinton 团队衍生公司）',
                      state: '产业化前沿研究团队',
                      contribution: '深度学习工程化',
                    },
                    {
                      time: '2013-03',
                      age: 26,
                      event: 'Google 收购 DNNResearch，加入 Google Brain',
                      state: '成为研究科学家',
                      contribution: '规模化训练与系统化研究',
                    },
                    {
                      time: '2013-2014',
                      age: '26-27',
                      event: '与 O. Vinyals、Quoc V. Le 合作创建 Seq2Seq 学习算法',
                      state: '序列学习范式扩张',
                      contribution: 'Seq2Seq / 编码器-解码器',
                    },
                    {
                      time: '2015',
                      age: 28,
                      event: '与 Alex Krizhevsky、Geoffrey Hinton 共同提出 AlexNet（相关工作）',
                      state: '深度学习拐点事件的关键作者之一',
                      contribution: 'AlexNet / CNN 视觉革命',
                    },
                    {
                      time: '2015-12',
                      age: 29,
                      event: '离开 Google，加入新成立的 OpenAI（负责人/领导层）',
                      state: 'OpenAI 联合创始人、首席科学家',
                      contribution: '大模型研究路线与组织推动',
                    },
                    {
                      time: '2015',
                      age: 28,
                      event: '入选《麻省理工科技评论》35 岁以下创新者（TR35）',
                      state: '早期学术影响力确认',
                      contribution: '—',
                    },
                    {
                      time: '2022',
                      age: 35,
                      event: '当选英国皇家学会院士（FRS）',
                      state: '学术荣誉',
                      contribution: '—',
                    },
                    {
                      time: '2024-05',
                      age: 37,
                      event: '宣布离开 OpenAI',
                      state: '从组织内关键岗位退出',
                      contribution: '—',
                    },
                    {
                      time: '2024-06',
                      age: 37,
                      event: '与 Daniel Gross、Daniel Levy 共同创立 Safe Superintelligence（SSI）',
                      state: '以 AI 安全为重点的新公司',
                      contribution: 'AI 安全 / 对齐 / 超级智能',
                    },
                    {
                      time: '2024-09',
                      age: 37,
                      event: 'SSI 宣布融资 10 亿美元，估值约 50 亿美元（维基条目描述）',
                      state: '资本与市场认可',
                      contribution: '安全 AI 研发资源',
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

            <ul className="mt-6 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 贡献与影响（摘要）：AlexNet、Seq2Seq、以及在 OpenAI 推动大规模训练范式与研究组织化。</li>
              <li>• 对我的启发（摘要）：把“可规模化”当作第一原则，同时把安全问题视为主线而不是附属条件。</li>
            </ul>

            <h3 id="ai-bengio" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Yoshua Bengio
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：深度学习学术共同体的重要推动者之一，强调理论化与可持续研究生态。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：深度学习早期 / 表征学习 / 安全与治理</li>
              <li>• 贡献与影响（待补）：把研究变成共同体工程</li>
              <li>• 对我的启发（待补）：生态建设与单点突破同等重要</li>
            </ul>

            <h3 id="ai-krizhevsky" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Alex Krizhevsky
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：AlexNet 关键作者之一，代表“工程+算力+数据”共同触发的拐点事件。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：AlexNet / GPU 加速 / 视觉革命</li>
              <li>• 贡献与影响（待补）：让深度学习从“可行”变成“碾压”</li>
              <li>• 对我的启发（待补）：拐点往往来自系统变量的同向叠加</li>
            </ul>

            <h3 id="ai-sutton" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Richard Sutton
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：强化学习理论骨架的奠基者之一，强调规模化与通用方法的长期主义。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：TD 学习 / RL 教科书 / “The Bitter Lesson”</li>
              <li>• 贡献与影响（待补）：用学习代替手工规则</li>
              <li>• 对我的启发（待补）：把能规模化的路径当作第一原则</li>
            </ul>

            <h3 id="ai-hassabis" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Demis Hassabis
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：DeepMind 路线代表人物，把“研究 + 工程 + 组织”打成一体化能力。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：AlphaGo / AlphaFold / 研究组织范式</li>
              <li>• 贡献与影响（待补）：系统集成能力决定上限</li>
              <li>• 对我的启发（待补）：大问题需要组织能力配套</li>
            </ul>

            <h3 id="ai-amodei" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Dario Amodei
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：以对齐与安全为核心视角的公司路线代表，把研究议题变成工程与组织机制。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：对齐研究 / 模型治理 / 组织化落地</li>
              <li>• 贡献与影响（待补）：把“安全”写进研发流程</li>
              <li>• 对我的启发（待补）：工程化=把价值观变成约束条件</li>
            </ul>

            <h3 id="ai-jensen-huang" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Jensen Huang
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：算力时代关键推手之一，GPU 生态使许多“可学的东西”变得可训练。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：CUDA / GPU 通用计算 / AI 基础设施</li>
              <li>• 贡献与影响（待补）：把研究的上限变成可购买的资源</li>
              <li>• 对我的启发（待补）：底层基础设施决定创新的速度</li>
            </ul>

            <h3 id="ai-andrew-ng" className="mt-8 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              Andrew Ng
            </h3>
            <p className="mt-3 text-sm text-[#666] dark:text-gray-300">画像骨架：把机器学习工程化、产品化、教育化的人，擅长把前沿方法沉淀为可复制路径。</p>
            <ul className="mt-3 text-xs text-[#666] dark:text-gray-400 space-y-2 leading-relaxed">
              <li>• 时间线（待补）：在线教育 / 工程落地 / 产业化方法论</li>
              <li>• 贡献与影响（待补）：把“学会”变成“能用”</li>
              <li>• 对我的启发（待补）：规模化传播也是一种技术影响力</li>
            </ul>
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
