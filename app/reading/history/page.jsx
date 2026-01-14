import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

const ZHANG_JUZHENG_TIMELINE = [
  {
    time: '1525-05-26（嘉靖四年五月初五）',
    age: '0',
    milestone: '出生',
    summary: '湖广江陵（今湖北江陵县），秀才家庭',
    impact: '出身地方士绅阶层起点',
  },
  {
    time: '1537前后',
    age: '12',
    milestone: '入学取生员',
    summary: '12岁投考生员，荆州知府李士翱赏识',
    impact: '早慧成名，进入士途',
  },
  {
    time: '1538前后',
    age: '13',
    milestone: '早试受赏识',
    summary: '乡试主考顾璘赏识，改名“张居正”，称“国器”，但“强制落榜”（磨砺/忌才有争议）',
    impact: '少年得名望，同时留下“被压一压”的成长叙事',
  },
  {
    time: '1540（嘉靖十九年）',
    age: '16',
    milestone: '中举',
    summary: '湖广乡试举人',
    impact: '正式进入仕途通道',
  },
  {
    time: '1547（嘉靖二十六年）',
    age: '22',
    milestone: '中进士',
    summary: '丁未科进士，入翰林（庶吉士→编修）',
    impact: '站上清流/中枢候选序列',
  },
  {
    time: '1550s-1560s',
    age: '20s-40s',
    milestone: '官场结盟与积累',
    summary: '与高拱关系好；也能与严嵩、徐阶保持往来；与宦官、权臣保持联系',
    impact: '仕途顺滑，但埋下“身后祸”的结构性风险',
  },
  {
    time: '1567（隆庆元年）',
    age: '42',
    milestone: '入阁近枢',
    summary: '吏部左侍郎兼东阁大学士；上《陈六事疏》谈改革主张',
    impact: '从“能臣”进入“国政设计者”位置',
  },
  {
    time: '1570s前期',
    age: '40s',
    milestone: '宰辅成形',
    summary: '与高拱并为宰辅；推动俺答封贡（和解互市）；南方准许广州一年两次交易会',
    impact: '外部边防与贸易环境趋稳，为改革腾挪空间',
  },
  {
    time: '1572-1573（万历初）',
    age: '47-48',
    milestone: '权力上升到顶',
    summary: '与冯保合谋逐高拱（“近代有异议”）；获李太后信任，万历帝年幼，军政大事多由其裁决',
    impact: '实际最高决策者进入“十年当国”阶段',
  },
  {
    time: '1573（万历元年六月）',
    age: '48',
    milestone: '考成法',
    summary: '分置账簿“底册”，月稽岁考；逾期追责；言官体系被纳入可控范围',
    impact: '提升行政效率与财政征收能力，但也强化中枢集权、压缩言路',
  },
  {
    time: '1577（万历五年）',
    age: '52',
    milestone: '夺情事件',
    summary: '父亡按制应丁忧三年，提出“夺情”继续理政；反对者遭廷杖、贬谪（邹元标断腿）',
    impact: '政治道德口碑受损，树敌广泛，权力与名节彻底撕裂',
  },
  {
    time: '1578（万历六年）',
    age: '53',
    milestone: '清丈土地',
    summary: '清查隐瞒田亩，打击大地主隐田',
    impact: '增加可税土地、改善财税，但触动利益深',
  },
  {
    time: '1578-1581',
    age: '53-56',
    milestone: '一条鞭法推广',
    summary: '约三年后全国推行：合并税役，按亩折银征收（并非处处彻底）',
    impact: '财政可控性增强，税制趋简化；也带来基层执行差异',
  },
  {
    time: '1579（万历七年）',
    age: '54',
    milestone: '宫廷裂痕加深',
    summary: '因万历夜游失检被太后训斥，张代写罪己诏；又在经筵厉声纠正读音',
    impact: '皇帝心理怨结加深，为死后清算埋伏笔',
  },
  {
    time: '1580-1581（万历八-九年）',
    age: '55-56',
    milestone: '裁冗与整饬',
    summary: '遍查两京衙门裁冗；裁撤多地大员；官员总数显著下降',
    impact: '中枢动员能力上升，但官场怨气累积',
  },
  {
    time: '1582-07-09（万历十年六月二十）',
    age: '57',
    milestone: '病逝',
    summary: '正史称痔疮；现代推测直肠癌；死前加太师、上柱国',
    impact: '生前极致荣宠，死后迅速反转的“高峰-坠落”结构完成',
  },
  {
    time: '1582-12起',
    age: '—',
    milestone: '身后攻讦开闸',
    summary: '御史弹劾冯保，万历称“吾待此疏久矣”；随后群起攻讦张、冯',
    impact: '皇帝借机翻盘，政治清算启动',
  },
  {
    time: '1583（万历十一年）',
    age: '—',
    milestone: '抄家与族祸',
    summary: '籍没张家；家属被封闭饿死十七口；长子张敬修严刑后自缢；其余子弟戍边',
    impact: '“功臣型权相”的典型身后悲剧：政治报复 + 社会泄愤合流',
  },
  {
    time: '1580s后',
    age: '—',
    milestone: '牵连余波',
    summary: '戚继光调广东后不久去世；潘季驯因“党庇”被落职；朝臣感叹“今日争索其罪而不敢言其功”',
    impact: '政治风向翻转导致系统性寒蝉效应',
  },
  {
    time: '1622（天启二年）',
    age: '—',
    milestone: '平反开始',
    summary: '逐步恢复名誉、复官职（材料称“下诏复其官职”）',
    impact: '舆论与政治评价开始回摆',
  },
  {
    time: '崇祯时期',
    age: '—',
    milestone: '彻底平反/追思',
    summary: '出现“得庸相百，不若得救时相一”的追叹；定调“功在社稷，过在身家”',
    impact: '张居正的历史位置被重新确立为“救时相/改革相”',
  },
]

const JIAJING_TIMELINE = [
  {
    ad: '1507',
    era: '正德2',
    age: '0',
    stage: '出生',
    event: '生于安陆，藩王之子',
    nature: '身世',
    impact: '非皇太子系统出身',
  },
  {
    ad: '1521',
    era: '正德16',
    age: '15',
    stage: '继位前夜',
    event: '正德帝去世，无子',
    nature: '继承危机',
    impact: '明朝再陷“旁支入继”',
  },
  {
    ad: '1522',
    era: '嘉靖元',
    age: '16',
    stage: '即位',
    event: '以藩王身份入继大统',
    nature: '皇权继承',
    impact: '皇权合法性存在结构性争议',
  },
  {
    ad: '1522–1524',
    era: '嘉靖1–3',
    age: '16–18',
    stage: '震荡期',
    event: '大礼议之争',
    nature: '制度冲突',
    impact: '皇权 vs 儒家礼法的正面冲突',
  },
  {
    ad: '1524',
    era: '嘉靖3',
    age: '18',
    stage: '定调',
    event: '杨廷和致仕',
    nature: '权力重组',
    impact: '皇帝首次全面压倒内阁',
  },
  {
    ad: '1525–1530',
    era: '嘉靖4–9',
    age: '19–24',
    stage: '集权期',
    event: '借张璁、方献夫改革',
    nature: '制度',
    impact: '削外戚、整庄田、裁冗官',
  },
  {
    ad: '1529',
    era: '嘉靖8',
    age: '23',
    stage: '思想节点',
    event: '王守仁去世',
    nature: '思想史',
    impact: '心学进入社会扩散阶段',
  },
  {
    ad: '1531–1537',
    era: '嘉靖10–16',
    age: '25–31',
    stage: '稳定期',
    event: '皇权高度集中',
    nature: '政治',
    impact: '“嘉靖中兴”完成',
  },
  {
    ad: '1540',
    era: '嘉靖19',
    age: '34',
    stage: '转折前',
    event: '张璁去世',
    nature: '政治',
    impact: '改革派中枢瓦解',
  },
  {
    ad: '1542',
    era: '嘉靖21',
    age: '36',
    stage: '巨变',
    event: '壬寅宫变',
    nature: '宫廷危机',
    impact: '皇帝对现实政治彻底失望',
  },
  {
    ad: '1542 以后',
    era: '嘉靖21+',
    age: '36+',
    stage: '退隐期',
    event: '沉迷修玄炼丹',
    nature: '统治方式',
    impact: '实际“在位而不在政”',
  },
  {
    ad: '1547',
    era: '嘉靖26',
    age: '41',
    stage: '人才节点',
    event: '张居正中进士',
    nature: '人事',
    impact: '明代最后一轮制度修补伏笔',
  },
  {
    ad: '1548',
    era: '嘉靖27',
    age: '42',
    stage: '权臣更替',
    event: '夏言被杀，严嵩专政',
    nature: '权臣政治',
    impact: '明代权相模式重现',
  },
  {
    ad: '1549',
    era: '嘉靖28',
    age: '43',
    stage: '思想社会',
    event: '海瑞中举',
    nature: '士人',
    impact: '清议与现实政治张力加剧',
  },
  {
    ad: '1550',
    era: '嘉靖29',
    age: '44',
    stage: '军事危机',
    event: '庚戌之变（俺答汗入侵）',
    nature: '边防',
    impact: '北防体系暴露致命缺陷',
  },
  {
    ad: '1551',
    era: '嘉靖30',
    age: '45',
    stage: '被迫妥协',
    event: '宣府、大同互市',
    nature: '外交',
    impact: '明朝由强硬转向现实主义',
  },
  {
    ad: '1555–1560',
    era: '嘉靖34–39',
    age: '49–54',
    stage: '灾难期',
    event: '嘉靖大地震、太湖水灾',
    nature: '社会',
    impact: '天灾叠加政治真空',
  },
  {
    ad: '1557',
    era: '嘉靖36',
    age: '51',
    stage: '海疆节点',
    event: '葡萄牙取得澳门居住权',
    nature: '对外',
    impact: '海禁政策开始实质松动',
  },
  {
    ad: '1557–1562',
    era: '嘉靖后期',
    age: '50s',
    stage: '军事修补',
    event: '戚继光、俞大猷抗倭',
    nature: '军事',
    impact: '明军战斗力短暂回升',
  },
  {
    ad: '1562',
    era: '嘉靖41',
    age: '56',
    stage: '权力回摆',
    event: '徐阶弹劾严嵩',
    nature: '政治',
    impact: '权臣政治结束',
  },
  {
    ad: '1564',
    era: '嘉靖43',
    age: '58',
    stage: '清议高潮',
    event: '海瑞任户部主事',
    nature: '思想政治',
    impact: '“直言型官僚”登场',
  },
  {
    ad: '1566',
    era: '嘉靖45',
    age: '60',
    stage: '终局',
    event: '海瑞上《治安疏》',
    nature: '政治伦理',
    impact: '皇权与士人彻底撕裂',
  },
  {
    ad: '1566',
    era: '嘉靖45',
    age: '60',
    stage: '去世',
    event: '崩于西苑',
    nature: '终结',
    impact: '明朝进入“技术性续命期”',
  },
  {
    ad: '1567',
    era: '—',
    age: '—',
    stage: '延续',
    event: '改元隆庆',
    nature: '传承',
    impact: '短暂修复，难挽大势',
  },
]

const MING_16_EMPERORS = [
  {
    order: 1,
    emperor: '朱元璋',
    reign: '1368–1398',
    eraName: '洪武',
    succession: '开国',
    keywords: '重典治国、废相权',
    role: '制度奠基者',
  },
  {
    order: 2,
    emperor: '朱允炆',
    reign: '1398–1402',
    eraName: '建文',
    succession: '嫡继',
    keywords: '削藩',
    role: '理想主义失败者',
  },
  {
    order: 3,
    emperor: '朱棣',
    reign: '1402–1424',
    eraName: '永乐',
    succession: '靖难夺位',
    keywords: '迁都北京、下西洋',
    role: '扩张型强君',
  },
  {
    order: 4,
    emperor: '朱高炽',
    reign: '1424–1425',
    eraName: '洪熙',
    succession: '嫡继',
    keywords: '休养生息',
    role: '短暂修复者',
  },
  {
    order: 5,
    emperor: '朱瞻基',
    reign: '1425–1435',
    eraName: '宣德',
    succession: '嫡继',
    keywords: '文治武备平衡',
    role: '明代黄金期',
  },
  {
    order: 6,
    emperor: '朱祁镇',
    reign: '1435–1449',
    eraName: '正统',
    succession: '嫡继',
    keywords: '宦官专权',
    role: '土木之变当事人',
  },
  {
    order: 7,
    emperor: '朱祁钰',
    reign: '1449–1457',
    eraName: '景泰',
    succession: '代立',
    keywords: '守成',
    role: '危机托底者',
  },
  {
    order: 8,
    emperor: '朱祁镇',
    reign: '1457–1464',
    eraName: '天顺',
    succession: '复辟',
    keywords: '清算异己',
    role: '复辟型皇帝',
  },
  {
    order: 9,
    emperor: '朱见深',
    reign: '1464–1487',
    eraName: '成化',
    succession: '嫡继',
    keywords: '内廷膨胀',
    role: '内外失衡起点',
  },
  {
    order: 10,
    emperor: '朱祐樘',
    reign: '1487–1505',
    eraName: '弘治',
    succession: '嫡继',
    keywords: '勤政节俭',
    role: '明代最后清明君主',
  },
  {
    order: 11,
    emperor: '朱厚照',
    reign: '1505–1521',
    eraName: '正德',
    succession: '嫡继',
    keywords: '任性胡闹',
    role: '制度消耗者',
  },
  {
    order: 12,
    emperor: '朱厚熜',
    reign: '1522–1566',
    eraName: '嘉靖',
    succession: '旁支入继',
    keywords: '修玄避政',
    role: '由盛转衰枢轴',
  },
  {
    order: 13,
    emperor: '朱载垕',
    reign: '1567–1572',
    eraName: '隆庆',
    succession: '嫡继',
    keywords: '开关互市',
    role: '短暂修补者',
  },
  {
    order: 14,
    emperor: '朱翊钧',
    reign: '1573–1620',
    eraName: '万历',
    succession: '嫡继',
    keywords: '怠政三十年',
    role: '制度空转制造者',
  },
  {
    order: 15,
    emperor: '朱常洛',
    reign: '1620',
    eraName: '泰昌',
    succession: '嫡继',
    keywords: '红丸案',
    role: '一月天子',
  },
  {
    order: 16,
    emperor: '朱由检',
    reign: '1628–1644',
    eraName: '崇祯',
    succession: '旁支入继',
    keywords: '勤政无力',
    role: '系统崩溃背锅者',
  },
]

const KANGXI_TIMELINE = [
  {
    ad: '1654',
    era: '—',
    age: '0',
    stage: '出生',
    event: '生于北京紫禁城',
    nature: '身世',
    impact: '清入关后第二代皇帝',
  },
  {
    ad: '1661',
    era: '顺治18',
    age: '8',
    stage: '即位',
    event: '顺治帝去世，玄烨即位',
    nature: '皇权继承',
    impact: '幼主登基，权力实由辅政大臣掌握',
  },
  {
    ad: '1662',
    era: '康熙元',
    age: '9',
    stage: '改元',
    event: '改元“康熙”',
    nature: '制度',
    impact: '年号寓意“太平”，开启一世一元',
  },
  {
    ad: '1662–1669',
    era: '康熙1–8',
    age: '9–16',
    stage: '摄政期',
    event: '鳌拜专权，四辅臣共治',
    nature: '权力博弈',
    impact: '皇权被架空，奠定日后反弹基础',
  },
  {
    ad: '1669',
    era: '康熙8',
    age: '16',
    stage: '亲政',
    event: '设计擒鳌拜',
    nature: '政变',
    impact: '皇权真正收回，少年天子完成成人礼',
  },
  {
    ad: '1673',
    era: '康熙12',
    age: '20',
    stage: '动荡',
    event: '吴三桂、尚可喜、耿精忠反叛',
    nature: '军事',
    impact: '三藩之乱爆发，清政权生死考验',
  },
  {
    ad: '1673–1681',
    era: '康熙12–20',
    age: '20–28',
    stage: '战争',
    event: '平定三藩之乱',
    nature: '军政',
    impact: '彻底粉碎汉藩割据，中央集权完成',
  },
  {
    ad: '1681',
    era: '康熙20',
    age: '28',
    stage: '转折',
    event: '三藩平定',
    nature: '政权稳固',
    impact: '清朝由“征服政权”转入“治理政权”',
  },
  {
    ad: '1683',
    era: '康熙22',
    age: '30',
    stage: '统一',
    event: '施琅收复台湾',
    nature: '军事',
    impact: '完成全国统一，台湾正式纳入版图',
  },
  {
    ad: '1684',
    era: '康熙23',
    age: '31',
    stage: '治理',
    event: '设台湾府，开海禁',
    nature: '制度',
    impact: '海疆治理与对外贸易恢复',
  },
  {
    ad: '1689',
    era: '康熙28',
    age: '36',
    stage: '外交',
    event: '签订《尼布楚条约》',
    nature: '外交',
    impact: '中国首个近代意义国际条约',
  },
  {
    ad: '1690',
    era: '康熙29',
    age: '37',
    stage: '边防',
    event: '第一次亲征噶尔丹',
    nature: '军事',
    impact: '皇帝亲征，确立威信',
  },
  {
    ad: '1696',
    era: '康熙35',
    age: '43',
    stage: '边疆',
    event: '第二次亲征噶尔丹',
    nature: '军事',
    impact: '彻底解决漠北威胁',
  },
  {
    ad: '1697',
    era: '康熙36',
    age: '44',
    stage: '稳定',
    event: '噶尔丹败亡',
    nature: '战略',
    impact: '西北边疆长期稳定',
  },
  {
    ad: '1700前后',
    era: '—',
    age: '40+',
    stage: '治理',
    event: '编修《康熙字典》',
    nature: '文化',
    impact: '清代文化整合工程核心',
  },
  {
    ad: '1705',
    era: '康熙44',
    age: '52',
    stage: '政治',
    event: '废太子胤礽',
    nature: '宫廷政治',
    impact: '继承危机公开化',
  },
  {
    ad: '1708',
    era: '康熙47',
    age: '55',
    stage: '反复',
    event: '复立胤礽为太子',
    nature: '权力调和',
    impact: '试图修补皇权与宗室关系',
  },
  {
    ad: '1712',
    era: '康熙51',
    age: '59',
    stage: '决断',
    event: '再废太子，永不再立',
    nature: '制度',
    impact: '皇位继承彻底悬空',
  },
  {
    ad: '1713',
    era: '康熙52',
    age: '60',
    stage: '盛典',
    event: '六十寿辰，大赦天下',
    nature: '象征',
    impact: '“盛世君主”形象达到顶点',
  },
  {
    ad: '1717',
    era: '康熙56',
    age: '64',
    stage: '边疆',
    event: '驱逐准噶尔势力出西藏',
    nature: '军事',
    impact: '中央对西藏主权进一步强化',
  },
  {
    ad: '1720',
    era: '康熙59',
    age: '67',
    stage: '制度',
    event: '设驻藏大臣',
    nature: '治理',
    impact: '清朝边疆治理制度化',
  },
  {
    ad: '1722',
    era: '康熙61',
    age: '69',
    stage: '终局',
    event: '病逝于畅春园',
    nature: '终结',
    impact: '清代最长在位皇帝',
  },
  {
    ad: '1723',
    era: '—',
    age: '—',
    stage: '延续',
    event: '改元雍正',
    nature: '传承',
    impact: '进入高压整饬阶段',
  },
]

const YONGZHENG_TIMELINE = [
  {
    ad: '1678',
    era: '康熙17',
    age: '0',
    stage: '出生',
    event: '生于北京，康熙第四子',
    nature: '身世',
    impact: '皇子出身，但非显性继承人',
  },
  {
    ad: '1698前后',
    era: '康熙37',
    age: '20',
    stage: '封爵',
    event: '封贝勒，后封雍亲王',
    nature: '宗室政治',
    impact: '“雍”成为其政治符号',
  },
  {
    ad: '1700s',
    era: '康熙40s',
    age: '20s-40s',
    stage: '辅政历练',
    event: '办理户部、理藩、地方事务',
    nature: '行政',
    impact: '熟悉财政、边政、官僚体系',
  },
  {
    ad: '1708',
    era: '康熙47',
    age: '30',
    stage: '宫廷震荡',
    event: '太子胤礽首次被废',
    nature: '继承危机',
    impact: '皇位继承进入不确定状态',
  },
  {
    ad: '1712',
    era: '康熙51',
    age: '34',
    stage: '关键转折',
    event: '太子再次被废，永不再立',
    nature: '制度真空',
    impact: '九子夺嫡格局形成',
  },
  {
    ad: '1710s',
    era: '康熙后期',
    age: '30s-40s',
    stage: '潜伏期',
    event: '低调行事，外示谨慎',
    nature: '权谋',
    impact: '为最终继位保留空间',
  },
  {
    ad: '1722-11',
    era: '康熙61',
    age: '44',
    stage: '即位',
    event: '康熙去世，胤禛即位',
    nature: '皇权继承',
    impact: '登基合法性长期受质疑',
  },
  {
    ad: '1723',
    era: '雍正元',
    age: '45',
    stage: '改元',
    event: '改元“雍正”',
    nature: '政治象征',
    impact: '强调“正统”“名正”',
  },
  {
    ad: '1723',
    era: '雍正元',
    age: '45',
    stage: '清算',
    event: '整肃宗室与八爷党',
    nature: '宫廷政治',
    impact: '快速消除潜在继承威胁',
  },
  {
    ad: '1723–1724',
    era: '雍正1–2',
    age: '45–46',
    stage: '财政改革',
    event: '推行“摊丁入亩”',
    nature: '制度改革',
    impact: '人头税并入田赋，减轻流民压力',
  },
  {
    ad: '1724',
    era: '雍正2',
    age: '46',
    stage: '官僚治理',
    event: '强化密折制度',
    nature: '信息制度',
    impact: '皇帝直接掌握地方真实信息',
  },
  {
    ad: '1724–1726',
    era: '雍正2–4',
    age: '46–48',
    stage: '财政重构',
    event: '整顿亏空，严查贪腐',
    nature: '高压治理',
    impact: '国库迅速回升，为乾隆奠基',
  },
  {
    ad: '1726',
    era: '雍正4',
    age: '48',
    stage: '用人改革',
    event: '推行“养廉银”',
    nature: '官制',
    impact: '合法高薪反腐，改变官僚激励结构',
  },
  {
    ad: '1726–1730',
    era: '雍正4–8',
    age: '48–52',
    stage: '思想控制',
    event: '禁朋党，压制异议',
    nature: '政治',
    impact: '官僚服从性显著提高',
  },
  {
    ad: '1727',
    era: '雍正5',
    age: '49',
    stage: '边疆治理',
    event: '设军机处雏形（军机房）',
    nature: '制度',
    impact: '决策中枢高度内收',
  },
  {
    ad: '1728',
    era: '雍正6',
    age: '50',
    stage: '边政',
    event: '调整西北军政体制',
    nature: '军政',
    impact: '强化中央对边疆的控制',
  },
  {
    ad: '1730',
    era: '雍正8',
    age: '52',
    stage: '宗教政策',
    event: '对西藏事务强化干预',
    nature: '边疆治理',
    impact: '延续并加强康熙既定路线',
  },
  {
    ad: '1732',
    era: '雍正10',
    age: '54',
    stage: '高强度理政',
    event: '皇帝日批奏折至深夜',
    nature: '治理风格',
    impact: '“以命换制度”的典型',
  },
  {
    ad: '1733',
    era: '雍正11',
    age: '55',
    stage: '权力集中',
    event: '军机处运作成熟',
    nature: '中枢',
    impact: '清代最高决策机制成型',
  },
  {
    ad: '1734',
    era: '雍正12',
    age: '56',
    stage: '继承准备',
    event: '密立弘历为储君',
    nature: '继承制度',
    impact: '避免重演夺嫡',
  },
  {
    ad: '1735-08',
    era: '雍正13',
    age: '56',
    stage: '去世',
    event: '病逝',
    nature: '终结',
    impact: '在位仅13年',
  },
  {
    ad: '1736',
    era: '—',
    age: '—',
    stage: '延续',
    event: '改元乾隆',
    nature: '传承',
    impact: '进入“成果释放期”',
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

export default function HistoryReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">读无用书 · 历史</h1>
            <p className="text-sm text-[#666] mt-2">这里会整理历史类的阅读记录。</p>
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
                  href="#mingqing"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  明清史
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#mingqing-summary" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      综述
                    </a>
                  </li>
                  <li>
                    <a href="#ming16" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      明16帝
                    </a>
                  </li>
                  <li>
                    <a href="#jiajing" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      嘉靖
                    </a>
                  </li>
                  <li>
                    <a href="#zhangjuzheng" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      张居正
                    </a>
                  </li>
                  <li>
                    <a href="#kangxi" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      康熙
                    </a>
                  </li>
                  <li>
                    <a href="#yongzheng" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      雍正
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  href="#sanguo"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  三国史
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <section className="border border-[#eee] bg-white p-5">
            <h2 id="mingqing" className="text-[#444] text-lg scroll-mt-24">
              明清史
            </h2>

            <h3 id="mingqing-summary" className="mt-10 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              综述
            </h3>
        <div className="text-sm text-[#666] space-y-4 mt-4 dark:text-gray-300">
          <p className="m-0">
            这些年我看了很多明清史。明朝是封建时代最后一个汉人王朝，而清朝则是中国历史上最后一个封建王朝，这两个朝代本身就像一条漫长而复杂的尾声，既辉煌，又沉重。我对它们的兴趣，最初其实并不来自史书，而是来自几部电视剧——《康熙王朝》《雍正王朝》《大明1566》。—— 权力的张力、人性的挣扎、制度与个人之间的冲突。
          </p>
          <p className="m-0">
            我开始顺着这些故事往下挖。比如康熙，表面上是“千古一帝”，但真正让我着迷的，是他一生中几个关键节点：少年时设计除掉鳌拜、壮年时期力排众议平定三藩、晚年收复台湾、完成帝国版图的定型。再到雍正，他的“夺嫡之争”常被写成权谋巅峰，在我看来，更像是一场制度缺位之下的必然悲剧——没有明确规则，只能用最残酷的方式筛选继承人。
          </p>
          <p className="m-0">
            《大明1566》是另一个层面。它不再只是讲皇帝或权臣，而是把目光放在财政、官僚体系、制度惯性这些“看不见但决定一切”的东西上。我也是在那之后，开始真正去读《明朝那些事》。当年明月几乎可以说是我写作上的偶像——历史不是冰冷的编年表，而是可以被写成有血有肉、有节奏、有观点的叙事——“人情味”。
          </p>
          <p className="m-0">
            正因如此，我一直有一个隐约但坚定的愿望：有一天，能写一本属于自己的历史书。它不只是复述史实，也不是简单评判成败，而是试着把制度、人物、时代情绪串在一起，写清楚一个问题：人在时代洪流里，到底能做什么，又能改变什么。
          </p>
          <p className="m-0">
            言而总之，我对“权力如何塑造人、制度如何吞没个人”这件事，始终保持着一种无法放下的好奇与敬畏。
          </p>
        </div>

            <h3 id="ming16" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">明16帝</h3>
            <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

            <div className="mt-4 overflow-x-auto">
              <div className="flex items-stretch gap-4 min-w-max pb-2">
                {MING_16_EMPERORS.map((item, index) => (
                  <div key={`${item.order}-${item.emperor}-${item.eraName}`} className="flex items-stretch">
                    <div className="w-[260px] sm:w-[320px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs text-[#999] dark:text-gray-400">
                          {item.order}. {item.emperor}
                        </div>
                        <div className="text-xs text-[#999] dark:text-gray-400">{item.reign}</div>
                      </div>

                      <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">{item.eraName}</div>

                      <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                        <p className="m-0">{item.succession}</p>
                        <p className="m-0">{item.keywords}</p>
                        <p className="m-0">{item.role}</p>
                      </div>
                    </div>

                    {index < MING_16_EMPERORS.length - 1 ? <ElbowConnector /> : null}
                  </div>
                ))}
              </div>
            </div>

        <h3 id="jiajing" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">嘉靖</h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {JIAJING_TIMELINE.map((item, index) => (
              <div key={`${item.ad}-${item.stage}-${item.event}`} className="flex items-stretch">
                <div className="w-[260px] sm:w-[320px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-xs text-[#999] dark:text-gray-400">
                      {item.ad} · {item.era}
                    </div>
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.age}</div>
                  </div>

                  <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">
                    {item.stage}：{item.event}
                  </div>

                  <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                    <p className="m-0">{item.nature}</p>
                    <p className="m-0">{item.impact}</p>
                  </div>
                </div>

                {index < JIAJING_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

        <h3 id="zhangjuzheng" className="mt-10 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">张居正</h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {ZHANG_JUZHENG_TIMELINE.map((item, index) => (
              <div key={`${item.time}-${item.milestone}`} className="flex items-stretch">
                <div className="w-[260px] sm:w-[320px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.time}</div>
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.age}</div>
                  </div>

                  <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">{item.milestone}</div>

                  <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                    <p className="m-0">{item.summary}</p>
                    <p className="m-0">{item.impact}</p>
                  </div>
                </div>

                {index < ZHANG_JUZHENG_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

        <h3 id="kangxi" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">康熙</h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {KANGXI_TIMELINE.map((item, index) => (
              <div key={`${item.ad}-${item.stage}-${item.event}`} className="flex items-stretch">
                <div className="w-[260px] sm:w-[320px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-xs text-[#999] dark:text-gray-400">
                      {item.ad} · {item.era}
                    </div>
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.age}</div>
                  </div>

                  <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">
                    {item.stage}：{item.event}
                  </div>

                  <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                    <p className="m-0">{item.nature}</p>
                    <p className="m-0">{item.impact}</p>
                  </div>
                </div>

                {index < KANGXI_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

        <h3 id="yongzheng" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">雍正</h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {YONGZHENG_TIMELINE.map((item, index) => (
              <div key={`${item.ad}-${item.stage}-${item.event}`} className="flex items-stretch">
                <div className="w-[260px] sm:w-[320px] border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-xs text-[#999] dark:text-gray-400">
                      {item.ad} · {item.era}
                    </div>
                    <div className="text-xs text-[#999] dark:text-gray-400">{item.age}</div>
                  </div>

                  <div className="mt-2 text-sm text-[#444] font-bold dark:text-gray-200">
                    {item.stage}：{item.event}
                  </div>

                  <div className="mt-3 text-sm text-[#666] space-y-2 dark:text-gray-300">
                    <p className="m-0">{item.nature}</p>
                    <p className="m-0">{item.impact}</p>
                  </div>
                </div>

                {index < YONGZHENG_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

        <h2 id="sanguo" className="mt-12 text-[#444] text-lg scroll-mt-24">
          三国史
        </h2>
        <p className="text-sm text-[#666] mt-4 mb-0 dark:text-gray-300">（待更新）</p>
          </section>
        </main>
      </div>
    </div>
  )
}
