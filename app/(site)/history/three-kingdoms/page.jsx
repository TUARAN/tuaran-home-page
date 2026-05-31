import Link from 'next/link'

import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const CAO_CAO_TIMELINE = [
  {
    ad: '155',
    age: '0',
    era: '永寿元年',
    event: '出生（沛国谯县）',
    identity: '—',
    people: '家族：曹嵩（父），曹腾（养祖父）',
    location: '谯县（今安徽亳州）',
    impact: '出身与宦官养祖父体系相关，为后续身世争议埋伏笔',
  },
  {
    ad: '174',
    age: '19',
    era: '熹平三年',
    event: '察举孝廉入仕',
    identity: '郎官 → 洛阳北部尉（同年）',
    people: '推荐者：司马防等',
    location: '洛阳',
    impact: '开始进入中央治安系统',
  },
  {
    ad: '174-175',
    age: '19-20',
    era: '熹平末',
    event: '“五色棒”执法严酷，棒杀宦官蹇硕叔父蹇图（传）',
    identity: '洛阳北部尉',
    people: '宦官集团',
    location: '洛阳',
    impact: '得罪权阉，被“外放”成常见结局',
  },
  {
    ad: '177',
    age: '22',
    era: '熹平后/光和初',
    event: '外放地方',
    identity: '顿丘令',
    people: '—',
    location: '顿丘',
    impact: '离开权力中心',
  },
  {
    ad: '178',
    age: '23',
    era: '光和元年',
    event: '牵连免官（堂妹夫宋奇案）',
    identity: '免官闲居',
    people: '—',
    location: '谯县',
    impact: '仕途短暂停摆',
  },
  {
    ad: '180',
    age: '25',
    era: '光和三年',
    event: '再征召入朝',
    identity: '议郎',
    people: '汉灵帝',
    location: '洛阳',
    impact: '多次上书论政，感到“难以匡正”',
  },
  {
    ad: '184',
    age: '29',
    era: '中平元年',
    event: '黄巾起义爆发，出兵镇压',
    identity: '骑都尉 → 济南相（国相）',
    people: '黄巾军；地方豪强',
    location: '颍川、济南',
    impact: '以“严明”著称，整肃吏治、禁淫祀',
  },
  {
    ad: '188',
    age: '33',
    era: '中平五年',
    event: '西园军设立',
    identity: '典军校尉',
    people: '桥玄门生王儁等',
    location: '京畿',
    impact: '在权力结构中继续上升但不稳定',
  },
  {
    ad: '189',
    age: '34',
    era: '中平六年',
    event: '汉灵帝死，何进被杀，董卓入京',
    identity: '受董卓拉拢（骁骑校尉）但不受',
    people: '董卓、袁绍等',
    location: '洛阳',
    impact: '选择跑路：更名改姓东归陈留',
  },
  {
    ad: '189',
    age: '34',
    era: '中平六年',
    event: '途中“吕伯奢事件”（史书版本不一）',
    identity: '逃亡者',
    people: '吕伯奢一家（传）',
    location: '成皋附近',
    impact: '形成“宁我负人”形象母题（注意：不同史源叙事差异大）',
  },
  {
    ad: '190',
    age: '35',
    era: '初平元年',
    event: '举义兵讨董卓，酸枣会盟',
    identity: '奋武将军（联军成员）',
    people: '袁绍联军；董卓',
    location: '酸枣、荥阳',
    impact: '独自西进遭徐荣大败；联军随后瓦解',
  },
  {
    ad: '191',
    age: '36',
    era: '初平二年',
    event: '发展地盘：入东郡',
    identity: '东郡太守',
    people: '黑山军、白绕等',
    location: '东郡、濮阳',
    impact: '开始真正拥有稳定军政地盘',
  },
  {
    ad: '192',
    age: '37',
    era: '初平三年',
    event: '青州黄巾入兖州，州内推曹操为主',
    identity: '兖州牧（实际掌握）',
    people: '黄巾军；州内官吏',
    location: '兖州',
    impact: '收编三十余万黄巾精锐，组建“青州兵”',
  },
  {
    ad: '193',
    age: '38',
    era: '初平四年',
    event: '匡亭之战：击退袁术北上',
    identity: '兖州军政首脑',
    people: '袁术',
    location: '匡亭、封丘',
    impact: '巩固兖州；与袁术矛盾加深',
  },
  {
    ad: '193-194',
    age: '38-39',
    era: '初平末',
    event: '父曹嵩在徐州遇害（史源歧异：陶谦/张闿等说）',
    identity: '—',
    people: '陶谦体系',
    location: '徐州',
    impact: '直接触发对徐州的报复性战争',
  },
  {
    ad: '194',
    age: '39',
    era: '兴平元年',
    event: '再伐徐州；兖州后院起火：陈宫、张邈迎吕布入兖州',
    identity: '兖州牧',
    people: '吕布、陈宫、张邈',
    location: '濮阳等',
    impact: '基地几近崩盘，只剩少数县城',
  },
  {
    ad: '194-195',
    age: '39-40',
    era: '兴平',
    event: '濮阳拉锯百余日；一度想投奔袁绍，被程昱劝止；向袁绍借兵回兖州',
    identity: '兖州军阀',
    people: '吕布；袁绍（借兵）',
    location: '濮阳',
    impact: '“兖州四年苦战”进入收尾阶段',
  },
  {
    ad: '195',
    age: '40',
    era: '兴平二年',
    event: '击破吕布，收复兖州；吕布逃徐州',
    identity: '兖州牧（朝廷承认）',
    people: '吕布',
    location: '定陶、雍丘等',
    impact: '站稳第一块核心根据地',
  },
  {
    ad: '196',
    age: '41',
    era: '建安元年',
    event: '奉迎汉献帝至许县（许都），开启“挟天子以令诸侯”格局',
    identity: '建德将军→镇东将军、费亭侯；后任司隶校尉、录尚书事等',
    people: '荀彧、毛玠等建议者；汉献帝',
    location: '洛阳→许县',
    impact: '政治杠杆拉满：从军阀跃迁为“中央权力实际操盘者”',
  },
  {
    ad: '196-197',
    age: '41-42',
    era: '建安',
    event: '任司空、行车骑将军；封武平侯；继续领兖州牧',
    identity: '司空、车骑将军、武平侯',
    people: '袁绍（表面盟友实则对立）',
    location: '许都',
    impact: '形成“名义汉廷—实权曹操”的结构',
  },
  {
    ad: '197',
    age: '42',
    era: '建安二年',
    event: '宛城之变：张绣降而复叛，曹昂、典韦等战死',
    identity: '朝廷重臣、军政领袖',
    people: '张绣、贾诩（后入曹）',
    location: '宛城/淯水',
    impact: '曹操重大挫折之一；也促成后来“纳贾诩、再收张绣”',
  },
  {
    ad: '198',
    age: '43',
    era: '建安三年',
    event: '下邳之战：水淹下邳擒吕布，处死吕布、陈宫，收张辽',
    identity: '实权丞相前夜的最高权臣',
    people: '吕布',
    location: '下邳（徐州）',
    impact: '东线大患解除，名将体系扩充',
  },
  {
    ad: '199',
    age: '44',
    era: '建安四年',
    event: '平定河内等地；袁术病死，其部众归附',
    identity: '司空等',
    people: '袁术余部',
    location: '淮南',
    impact: '中原局势进一步向曹操倾斜',
  },
  {
    ad: '200',
    age: '45',
    era: '建安五年',
    event: '“衣带诏”案清洗；官渡大战开打',
    identity: '汉廷军政实际最高掌权者',
    people: '袁绍；董承等',
    location: '官渡',
    impact: '先肃内，再决战袁绍集团',
  },
  {
    ad: '200（秋）',
    age: '45',
    era: '建安五年',
    event: '乌巢奇袭：许攸来投，曹操烧乌巢翻盘',
    identity: '统帅',
    people: '袁绍；许攸',
    location: '乌巢',
    impact: '官渡胜负手：北方统一进入倒计时',
  },
  {
    ad: '202',
    age: '47',
    era: '建安七年',
    event: '袁绍死，袁氏内斗',
    identity: '—',
    people: '袁谭、袁尚',
    location: '邺城体系',
    impact: '进入“收割北方”的阶段',
  },
  {
    ad: '204',
    age: '49',
    era: '建安九年',
    event: '攻克邺城；自领冀州牧，权力中枢北移邺城',
    identity: '冀州牧（兼）',
    people: '袁尚集团',
    location: '邺城',
    impact: '政令军令从邺出，许都留人监视献帝',
  },
  {
    ad: '205',
    age: '50',
    era: '建安十年',
    event: '诛袁谭、郭图等，基本扫清河北',
    identity: '—',
    people: '袁谭',
    location: '青州等',
    impact: '袁氏集团瓦解',
  },
  {
    ad: '207',
    age: '52',
    era: '建安十二年',
    event: '北征乌桓，斩蹋顿；郭嘉病死',
    identity: '—',
    people: '乌桓；郭嘉',
    location: '柳城一带',
    impact: '北方边患大减，但失去关键谋主',
  },
  {
    ad: '208（夏）',
    age: '53',
    era: '建安十三年',
    event: '恢复丞相制度，自任丞相',
    identity: '丞相',
    people: '汉献帝名义授',
    location: '许都',
    impact: '从“录尚书事/司空”等走向“制度化总揽”',
  },
  {
    ad: '208（秋冬）',
    age: '53',
    era: '建安十三年',
    event: '南征荆州：刘表死、刘琮降；长坂追击刘备',
    identity: '丞相、北方霸主',
    people: '刘备；刘琮',
    location: '荆州',
    impact: '看似顺利，实际进入孙刘联盟陷阱',
  },
  {
    ad: '208（冬）',
    age: '53',
    era: '建安十三年',
    event: '赤壁之战大败，退回北方',
    identity: '丞相',
    people: '孙权、刘备、周瑜',
    location: '赤壁/乌林',
    impact: '统一天下的窗口期关闭，三分格局成形',
  },
  {
    ad: '211',
    age: '56',
    era: '建安十六年',
    event: '潼关/渭南之战：破关中联军（离间马超韩遂）',
    identity: '丞相',
    people: '马超、韩遂等',
    location: '关中',
    impact: '西线稳住，为后续经营关中奠基',
  },
  {
    ad: '212',
    age: '57',
    era: '建安十七年',
    event: '获“参拜不名、入朝不趋、剑履上殿”等特权（类比萧何故事）',
    identity: '权力待遇接近“摄政”',
    people: '汉献帝（名义）',
    location: '许都',
    impact: '从“实权”再升级为“礼制确认”',
  },
  {
    ad: '213',
    age: '58',
    era: '建安十八年',
    event: '受封魏公、加九锡（正式册封）',
    identity: '魏公、仍为丞相',
    people: '董昭等推动；荀彧反对（后失势）',
    location: '许都',
    impact: '“曹—汉关系”进入公开的权力不对称',
  },
  {
    ad: '214',
    age: '59',
    era: '建安十九年',
    event: '宫廷清洗升级：伏皇后被幽死；宗族牵连',
    identity: '魏公/丞相',
    people: '伏皇后、华歆、郗虑',
    location: '许都',
    impact: '汉室象征被彻底掐死，合法性争议更尖锐',
  },
  {
    ad: '215',
    age: '60',
    era: '建安二十年',
    event: '取汉中，张鲁降',
    identity: '魏公/丞相',
    people: '张鲁；刘备潜在对手',
    location: '汉中',
    impact: '得战略要地，但未趁势攻蜀（刘晔曾劝）',
  },
  {
    ad: '216（春）',
    age: '61',
    era: '建安二十一年',
    event: '进爵魏王，立曹丕为世子',
    identity: '魏王（异姓王极限）',
    people: '—',
    location: '邺/许都',
    impact: '从“公”到“王”，几乎就是改朝前夜',
  },
  {
    ad: '216-217',
    age: '61-62',
    era: '建安',
    event: '再攻濡须口等对吴战争反复；疫病、胶着',
    identity: '魏王',
    people: '孙权',
    location: '江淮',
    impact: '东线难啃，耗兵耗粮，战略转向更谨慎',
  },
  {
    ad: '218',
    age: '63',
    era: '建安二十三年',
    event: '坐镇长安，支援汉中前线',
    identity: '魏王',
    people: '刘备',
    location: '长安',
    impact: '汉中成为新的主战场',
  },
  {
    ad: '219（正）',
    age: '64',
    era: '建安二十四年',
    event: '定军山：夏侯渊战死，汉中失守；“鸡肋”退兵',
    identity: '魏王',
    people: '刘备、黄忠',
    location: '汉中/定军山',
    impact: '西线挫折：汉中归蜀，战略纵深受损',
  },
  {
    ad: '219（夏秋）',
    age: '64',
    era: '建安二十四年',
    event: '襄樊之战：关羽北伐，水淹七军，于禁降',
    identity: '魏王',
    people: '关羽；于禁；曹仁',
    location: '樊城',
    impact: '一度“威震华夏”，曹操震动到考虑迁都',
  },
  {
    ad: '219（冬）',
    age: '64',
    era: '建安二十四年',
    event: '联动孙权袭后方，关羽败亡被杀；孙权送首级',
    identity: '魏王',
    people: '孙权、关羽、徐晃',
    location: '荆州/樊城',
    impact: '曹操度过最大危机之一，但也暴露三方博弈格局',
  },
  {
    ad: '220（初）',
    age: '65',
    era: '建安二十五年',
    event: '病重；留下《遗令》（薄葬、家务安排等）',
    identity: '魏王',
    people: '—',
    location: '洛阳',
    impact: '“政治巨兽”退场前的私人化文本很有反差感',
  },
  {
    ad: '220-03-15',
    age: '65',
    era: '建安二十五年正月庚子',
    event: '去世',
    identity: '魏王（死后追尊太祖武皇帝）',
    people: '曹丕继承',
    location: '洛阳',
    impact: '权力平稳交接给曹丕，制度化篡汉只差最后一步',
  },
  {
    ad: '220-04-11',
    age: '65',
    era: '建安二十五年二月丁卯',
    event: '安葬高陵（邺城西郊）',
    identity: '追谥“武王/武皇帝”体系',
    people: '—',
    location: '邺城西郊',
    impact: '“薄葬”形象固定；后世墓葬真伪争论不断',
  },
  {
    ad: '220-12-11',
    age: '—',
    era: '黄初元年十月',
    event: '曹丕代汉建魏（曹操死后发生，但与你梳时间线很关键）',
    identity: '曹魏奠基完成',
    people: '曹丕、汉献帝',
    location: '洛阳',
    impact: '曹操的路线在儿子手里完成“改朝换代”闭环',
  },
]

function ElbowConnector() {
  return (
    <div className="hidden sm:flex items-center text-[#ddd] dark:text-gray-700" aria-hidden="true">
      <svg width="56" height="26" viewBox="0 0 56 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 13 H16 V22 H40 V13 H56"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
export const metadata = {
  title: '三国史 · 历史调研',
  description: '涂阿燃（tuaran）的历史调研：以时间线梳理曹操的崛起、用人与争议。',
  keywords: ['涂阿燃', 'tuaran', '三国', '历史调研', '曹操', '三国史'],
  alternates: {
    canonical: '/history/three-kingdoms',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ThreeKingdomsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">三国史</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">历史调研：以时间线梳理曹操的崛起、用人与争议。</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/articles?tab=history" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回知识库
              </Link>
            </div>
          </div>
          <SharePageButton title="三国史 · 历史调研" text="以时间线梳理曹操的崛起、用人与争议。" url="/history/three-kingdoms" />
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden md:block md:w-52 shrink-0">
          <nav className="toc-scroll-panel">
            <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
              目录
            </div>
            <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
              <li>
                <a
                  href="#sanguo"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  三国史
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#cao-cao" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      曹操
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <h2 id="sanguo" className="text-[#444] text-lg scroll-mt-24">
          三国史
        </h2>

        <h3 id="cao-cao" className="mt-10 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
          曹操
        </h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {CAO_CAO_TIMELINE.map((item, index) => (
              <div key={`${item.ad}-${item.era}-${item.event}`} className="flex items-stretch">
                <div className="w-[300px] sm:w-[380px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-xs text-[#999] dark:text-gray-400">
                      {item.ad} · {item.era}
                    </div>
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.age}</div>
                  </div>

                  <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">{item.event}</div>

                  <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                    <p className="m-0">{item.identity}</p>
                    <p className="m-0">{item.people}</p>
                    <p className="m-0">{item.location}</p>
                    <p className="m-0">{item.impact}</p>
                  </div>
                </div>

                {index < CAO_CAO_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
