import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export default function BiographyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">读无用书 · 传记</h1>
            <p className="text-sm text-[#666] mt-2">这里会整理传记类的阅读记录。</p>
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
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
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
        </main>
      </div>
    </div>
  )
}
