import Link from 'next/link'

import SharePageButton from '../../components/SharePageButton'
import { CAO_CAO_TIMELINE } from './threeKingdomsData'

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

const ZHU_YUANZHANG_TIMELINE = [
  {
    ad: '1328-10-29',
    era: '元天历元年',
    age: '0',
    stage: '出生',
    event: '濠州钟离（今安徽凤阳一带）贫农家庭出生；原名朱重八/朱兴宗，后名元璋',
    nature: '身世',
    impact: '“底层出身”成为其统治合法性叙事之一（布衣天子）',
  },
  {
    ad: '1344',
    era: '至正四年',
    age: '16',
    stage: '断裂',
    event: '淮北大旱饥荒疫病，父兄母相继去世；入皇觉寺为行童，后寺散僧云游',
    nature: '生存危机',
    impact: '形成强烈的秩序感与“对乱世/贪腐的仇恨底色”',
  },
  {
    ad: '1344–1348',
    era: '—',
    age: '16–20',
    stage: '漂泊',
    event: '游方僧经历，化缘流浪；返寺后渐识字读书',
    nature: '个人积累',
    impact: '“从无到有”的社会阅历与基本文化补课',
  },
  {
    ad: '1352',
    era: '至正十二年',
    age: '24',
    stage: '起事',
    event: '汤和来信劝从军；投郭子兴红巾军；赐名“元璋”字国瑞；娶马氏（马皇后）',
    nature: '政治进入',
    impact: '从“个人求生”转为“军政集团成员”，完成身份跃迁',
  },
  {
    ad: '1353',
    era: '至正十三年',
    age: '25',
    stage: '建军',
    event: '请求回乡募兵，徐达等旧友随行；攻滁州成首个据点；李善长加入成为核心幕僚',
    nature: '组织建设',
    impact: '淮西集团雏形出现（后“淮西二十四将”等）',
  },
  {
    ad: '1354–1355',
    era: '至正十四–十五',
    age: '26–27',
    stage: '扩张',
    event: '援六合、取和州；郭子兴病故后，朱渐掌旧部',
    nature: '军事/权力',
    impact: '在红巾系统内由“部将”走向“实际掌兵者”',
  },
  {
    ad: '1356',
    era: '至正十六年',
    age: '28',
    stage: '定都基',
    event: '攻克集庆，改为应天府（南京），作为统一根据地',
    nature: '战略节点',
    impact: '“以应天为根”决定其后统一路径与政治中心',
  },
  {
    ad: '1356–1362',
    era: '至正十六–二十二',
    age: '28–34',
    stage: '一统江左',
    event: '徐达、常遇春等四出攻城：镇江、常州、徽州、池州、扬州等；控制江左浙右',
    nature: '扩张/治理',
    impact: '形成稳定腹地与财政粮源，为决战陈友谅、张士诚做准备',
  },
  {
    ad: '1360',
    era: '至正二十年',
    age: '32',
    stage: '对手成型',
    event: '陈友谅弑主称帝建“汉”，倾全军攻应天；朱元璋龙湾设伏大败之',
    nature: '军事决策',
    impact: '验证“先破强敌”的战略判断（为后续鄱阳湖决战铺垫）',
  },
  {
    ad: '1362',
    era: '至正二十二年',
    age: '34',
    stage: '制军',
    event: '改枢密院为大都督府，整军制；扩展对江西控制',
    nature: '制度/军政',
    impact: '组织化、官僚化的军事体系开始成形',
  },
  {
    ad: '1363',
    era: '至正二十三年',
    age: '35',
    stage: '天下转折',
    event: '先北上救安丰（救韩林儿）；后回援洪都，引发鄱阳湖之战，陈友谅中箭亡',
    nature: '决战',
    impact: '夺取决定性胜利：南方大势定，统一进入快车道',
  },
  {
    ad: '1364',
    era: '至正二十四年',
    age: '36',
    stage: '王号',
    event: '自立为吴王；立朱标为世子；进一步建百官体系',
    nature: '政权化',
    impact: '从“军阀割据”转为“准国家机器”',
  },
  {
    ad: '1365–1366',
    era: '至正二十五–二十六',
    age: '37–38',
    stage: '清场',
    event: '继续扫荡；命讨张士诚；平江之战前奏；韩林儿迎接途中覆舟遇难（史议）',
    nature: '统一前夜',
    impact: '清除“名义主君”后，称帝障碍被移除（亦留下道德争议）',
  },
  {
    ad: '1367',
    era: '吴元年',
    age: '39',
    stage: '北伐启动',
    event: '制定北伐路线；命徐达为征虏大将军、常遇春副将军北伐；同时南线收方国珍等',
    nature: '战略总攻',
    impact: '从“南方统一”转向“全国统一”',
  },
  {
    ad: '1368-01-23',
    era: '洪武元年',
    age: '39',
    stage: '建国',
    event: '应天登基：国号大明，年号洪武',
    nature: '建制',
    impact: '明朝正式建立；皇帝合法性完成“形式化落地”',
  },
  {
    ad: '1368-09-14',
    era: '洪武元年秋',
    age: '39',
    stage: '统一',
    event: '徐达克元大都，元顺帝北遁；朱成为全国皇帝',
    nature: '统一战争',
    impact: '元朝退出中原统治，明朝完成“全国政权”地位',
  },
  {
    ad: '1368–1376',
    era: '洪武初',
    age: '40s',
    stage: '恢复生产',
    event: '奖励垦荒、屯田军屯、水利、丈量土地清户口、减免赋税、解放奴婢等',
    nature: '经济/社会',
    impact: '战后修复：形成“洪武之治”叙事基础',
  },
  {
    ad: '1368–1370s',
    era: '洪武初',
    age: '40s',
    stage: '基层治理',
    event: '建立里甲制、黄册户籍、鱼鳞图册；限制迁徙（路引）',
    nature: '治理技术',
    impact: '强国家能力：税役可控、治安可控，但社会流动性被压缩',
  },
  {
    ad: '1370–1380',
    era: '洪武3–13',
    age: '42–52',
    stage: '集权升级',
    event: '以整肃为线索逐步收权，为“废相”做铺垫',
    nature: '权力结构',
    impact: '皇权直达六部的路径逐渐清晰',
  },
  {
    ad: '1380',
    era: '洪武13',
    age: '52',
    stage: '结构巨变',
    event: '胡惟庸案后罢中书省，权归六部，皇帝直领庶政',
    nature: '制度革命',
    impact: '宰相制度实质终结，君主专制进一步定型（后世影响深远）',
  },
  {
    ad: '1382',
    era: '洪武15',
    age: '54',
    stage: '特务国家',
    event: '设锦衣卫（后亦有废置变化）；加强侦缉、诏狱、廷杖等',
    nature: '控制工具',
    impact: '建立“皇权情报-抓捕-审判”的直控链条',
  },
  {
    ad: '1380s–1390s',
    era: '洪武中后期',
    age: '50s–60s',
    stage: '四大案肃清',
    event: '空印案、郭桓案、胡惟庸案、蓝玉案等连环整肃，株连极广',
    nature: '政治清洗',
    impact: '“反腐+清权”双目标：抑制功臣集团，但造成恐怖政治与人才萎缩',
  },
  {
    ad: '1370s–1390s',
    era: '洪武期',
    age: '40s–60s',
    stage: '分封藩王',
    event: '大封诸子为藩王，令守边/镇要地，藩屏皇室',
    nature: '安全设计',
    impact: '以宗室军权做“外部防火墙”，但埋下削藩与靖难的制度炸点',
  },
  {
    ad: '1370s–1397',
    era: '洪武期',
    age: '40s–60s',
    stage: '法治工程',
    event: '制《大明律》、编《明大诰》、重典治吏治民',
    nature: '法律/威慑',
    impact: '国家秩序快速成型，但以酷烈刑罚换服从，社会心理成本高',
  },
  {
    ad: '1370s–1390s',
    era: '洪武期',
    age: '40s–60s',
    stage: '军制定型',
    event: '五军都督府 + 卫所制，军户世袭；兵部调兵、都督府统兵制衡',
    nature: '军政制度',
    impact: '明代兵制基础确立：平时屯田、战时征调，长期亦致军户僵化',
  },
  {
    ad: '1370s–1390s',
    era: '洪武期',
    age: '40s–60s',
    stage: '对外与海禁',
    event: '对倭寇与海上势力采取高压；撤市舶司、严海禁；列“不征之国”入祖训',
    nature: '海疆策略',
    impact: '以安全优先压制贸易活力，成为明清海禁传统的开端之一',
  },
  {
    ad: '1392–1395',
    era: '洪武25–28',
    age: '64–67',
    stage: '东亚秩序',
    event: '高丽政权更替，明廷以册封/名号处理东亚朝贡秩序',
    nature: '外交体系',
    impact: '明朝东亚宗藩秩序的“规则输出”',
  },
  {
    ad: '1398-06-24',
    era: '洪武31闰五月',
    age: '69–71（记载有差）',
    stage: '去世',
    event: '崩于南京皇宫；遗诏：薄葬、哭临三日、诸王不得至京等；葬孝陵',
    nature: '终局',
    impact: '传位皇太孙朱允炆；遗诏意在防宗室军权集结，但未能阻止靖难走向',
  },
  {
    ad: '身后（建文/永乐/嘉靖）',
    era: '—',
    age: '—',
    stage: '追尊与再定谥号',
    event: '建文初谥，永乐加谥，嘉靖改谥；后世不断重塑其形象',
    nature: '叙事重写',
    impact: '开国皇帝成为后代合法性资源：既被敬畏，也被反思',
  },
]

const ZHU_DI_TIMELINE = [
  {
    ad: '1360-05-02',
    era: '元至正二十年',
    age: '0',
    stage: '出生',
    event: '生于应天府（南京）',
    nature: '身世',
    impact: '洪武集团“开国二代”',
  },
  {
    ad: '1370',
    era: '洪武三年',
    age: '10',
    stage: '封王',
    event: '受封燕王',
    nature: '宗藩布局',
    impact: '成为北方关键藩王（幽燕重地）',
  },
  {
    ad: '1380',
    era: '洪武十三年',
    age: '20',
    stage: '就藩北平',
    event: '就藩北平府，长期经营北方',
    nature: '军政历练',
    impact: '与北方军队绑定，形成军事影响力',
  },
  {
    ad: '1380s–1390s',
    era: '洪武中后期',
    age: '20s–30s',
    stage: '北方军功',
    event: '参与北方军事活动；招降乃儿不花；生擒索林帖木儿等',
    nature: '军事',
    impact: '燕王集团坐实“北方强藩”',
  },
  {
    ad: '1392前后',
    era: '洪武末',
    age: '30s',
    stage: '太子之议',
    event: '朱标死后，太祖一度欲立燕王为太子，群臣反对作罢',
    nature: '继承格局',
    impact: '埋下“皇位想象空间”，也强化建文戒心',
  },
  {
    ad: '1398',
    era: '洪武三十一年',
    age: '38',
    stage: '结构变化',
    event: '朱元璋崩，建文即位；朱棣在军力与宗室排序上成诸王之首',
    nature: '权力结构',
    impact: '“藩王—中央”矛盾进入倒计时',
  },
  {
    ad: '1399',
    era: '建文元年',
    age: '39',
    stage: '危机',
    event: '建文削藩；燕王装病/装疯以脱钩；朝廷准备逮捕燕王',
    nature: '政治对抗',
    impact: '走向开战的不可逆拐点',
  },
  {
    ad: '1399-07',
    era: '建文元年七月',
    age: '39',
    stage: '起兵',
    event: '北平王府设伏：擒杀张昺、谢贵等；夺北平九门',
    nature: '政变/动员',
    impact: '燕军掌控北平，战争正式启动',
  },
  {
    ad: '1399–1402',
    era: '靖难之役',
    age: '39–42',
    stage: '内战',
    event: '以“清君侧”名义起兵；先后击败耿炳文、李景隆等；多次关键会战',
    nature: '军事',
    impact: '用机动、奇袭、心理战打穿“倾国之兵”',
  },
  {
    ad: '1399-10',
    era: '建文元年',
    age: '39',
    stage: '扩军',
    event: '夺取大宁、收编朵颜三卫等精锐',
    nature: '战略资源',
    impact: '兵源结构升级：燕军战力跃迁',
  },
  {
    ad: '1402-06',
    era: '建文四年六月',
    age: '42',
    stage: '夺京',
    event: '燕军渡江，南京金川门开门；宫城大火，建文帝下落成谜',
    nature: '政权更替',
    impact: '合法性与史叙从此撕裂（“清君侧”→“篡位”）',
  },
  {
    ad: '1402-07-17',
    era: '建文四年七月十七',
    age: '42',
    stage: '登基',
    event: '在孝陵谒陵后登基，改元永乐',
    nature: '合法化工程',
    impact: '通过“谒陵—劝进—改纪年”构建正当性',
  },
  {
    ad: '1402–1403',
    era: '永乐初',
    age: '42–43',
    stage: '清算',
    event: '大规模诛杀建文旧臣（方孝孺等），牵连极广',
    nature: '高压统治',
    impact: '以恐惧完成“新秩序上线”，但社会裂痕长期化',
  },
  {
    ad: '1402起',
    era: '永乐初',
    age: '42+',
    stage: '政策回拨',
    event: '否认建文年号，回到洪武法统；建文改革多被废',
    nature: '制度路线',
    impact: '宣示“我继承太祖”，同时切断建文合法性',
  },
  {
    ad: '1404–1408',
    era: '永乐2–6',
    age: '44–48',
    stage: '文化工程',
    event: '编修《永乐大典》：扩编到两千余人，1407定稿，1408成书',
    nature: '国家项目',
    impact: '“知识总库”式权力象征（但只抄一部、不刊刻）',
  },
  {
    ad: '1405起',
    era: '永乐3起',
    age: '45+',
    stage: '海洋扩张',
    event: '郑和下西洋（永乐年间多次）',
    nature: '外交/贸易',
    impact: '扩大朝贡网络与海上影响力，提升帝国声望',
  },
  {
    ad: '1406–1407',
    era: '永乐4–5',
    age: '46–47',
    stage: '南征安南',
    event: '以“复陈讨胡”为名出兵，设交趾等机构直接管辖',
    nature: '扩张/殖民',
    impact: '短期得地，长期陷入反抗与高成本泥潭',
  },
  {
    ad: '1409',
    era: '永乐7',
    age: '49',
    stage: '东北经营',
    event: '设奴儿干都司，经营黑龙江下游与库页岛方向（亦失哈等）',
    nature: '边疆治理',
    impact: '北东疆治理外推，形成羁縻—卫所体系',
  },
  {
    ad: '1410–1424',
    era: '永乐8–22',
    age: '50–64',
    stage: '亲征漠北',
    event: '五次亲率大军北征鞑靼/瓦剌等',
    nature: '军事/财政',
    impact: '边防威慑并存，但军费与民力消耗巨大',
  },
  {
    ad: '1407–1421',
    era: '永乐中期',
    age: '47–61',
    stage: '迁都工程',
    event: '营建北京宫殿（紫禁城）与北京体系；1421正式迁都北京',
    nature: '国家重构',
    impact: '北京成为明清两朝政治中心，战略重心北移',
  },
  {
    ad: '1411–1415',
    era: '永乐9–13',
    age: '51–55',
    stage: '漕运与水利',
    event: '疏浚会通河、凿清江浦，确立漕运体系；逐步终止海运',
    nature: '基建/财政',
    impact: '解决“迁都后的供给链”，维持北方大都运转',
  },
  {
    ad: '1420',
    era: '永乐18',
    age: '60',
    stage: '厂卫升级',
    event: '设立东厂（与锦衣卫形成厂卫体系）',
    nature: '统治工具',
    impact: '专制监控体系完成形态化，对后世宦官政治影响深',
  },
  {
    ad: '1424-08-12',
    era: '永乐22',
    age: '64',
    stage: '终局',
    event: '北征回师途中榆木川病逝；秘不发丧，传位朱高炽',
    nature: '终结/交接',
    impact: '永乐强人周期结束，帝国进入“修复型”洪熙短政',
  },
  {
    ad: '身后（1538）',
    era: '嘉靖十七',
    age: '—',
    stage: '名号重写',
    event: '嘉靖改庙号“成祖”，改谥',
    nature: '叙事再造',
    impact: '后世为“合法性与祖统”再次塑形',
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

const WANLI_TIMELINE = [
  {
    ad: '1563-09-04',
    era: '嘉靖四十二',
    age: '0',
    stage: '出生',
    event: '生于顺天府；穆宗三子，母李氏（后李太后）',
    nature: '身世',
    impact: '“非嫡而实长”的身份结构，为后续国本之争埋伏笔',
  },
  {
    ad: '1567',
    era: '隆庆元',
    age: '3–4',
    stage: '立名与早慧',
    event: '裕王登基后赐名“翊钧”，寓“制驭天下如转钧”；幼年聪敏',
    nature: '教育/形象',
    impact: '被塑造成“可成圣君”的继承者',
  },
  {
    ad: '1568',
    era: '隆庆二',
    age: '4–5',
    stage: '立储',
    event: '立为皇太子',
    nature: '继承',
    impact: '正式进入国家权力序列',
  },
  {
    ad: '1572-07-05',
    era: '隆庆六',
    age: '9',
    stage: '登基',
    event: '穆宗崩，九岁即位；改元万历',
    nature: '皇权交接',
    impact: '幼主登基，政权实际落到太后+辅臣体系',
  },
  {
    ad: '1572–1582',
    era: '万历前十年',
    age: '9–19',
    stage: '摄政/中兴起点',
    event: '李太后听政；冯保掌内廷；张居正独揽军政，推改革（考成、清丈、一条鞭等）',
    nature: '改革治理',
    impact: '财政充盈、行政效率上升，形成“万历中兴”框架',
  },
  {
    ad: '1580',
    era: '万历八',
    age: '17',
    stage: '宫廷裂痕',
    event: '出游轻浮被太后训斥；张居正代写罪己诏；经筵被严厉纠错',
    nature: '心理转折',
    impact: '皇帝尊严受损，“对相权/师道的屈辱记忆”加深',
  },
  {
    ad: '1582',
    era: '万历十',
    age: '19',
    stage: '权力转折',
    event: '张居正去世',
    nature: '结构变化',
    impact: '皇权从“被塑造”转向“自我意志释放”',
  },
  {
    ad: '1582–1584',
    era: '万历初亲政',
    age: '19–21',
    stage: '亲政良好期',
    event: '史料称曾励精图治、蠲赋赈灾、节俭自持；步行祈雨等',
    nature: '治理风格',
    impact: '证明并非天生怠政，“亲政有过短暂上升段”',
  },
  {
    ad: '1582（或此前后）',
    era: '万历九左右',
    age: '19–20',
    stage: '继承隐患',
    event: '与宫女生长子朱常洛（出身低，帝不喜）',
    nature: '宫廷/继承',
    impact: '“长子不合意”导致国本之争成为核心冲突',
  },
  {
    ad: '1588起',
    era: '万历十七',
    age: '25',
    stage: '怠政启动',
    event: '自称“奏对数多，不耐劳剧”；不再频繁接见群臣；官缺难补、政务滞留',
    nature: '体制失灵',
    impact: '国家机器开始“空转化”，文官系统失去皇帝接口',
  },
  {
    ad: '1590s–1600s',
    era: '万历中后期',
    age: '30s–40s',
    stage: '国本之争',
    event: '长期拖延立太子；欲立郑妃子朱常洵；最终1601（万历二十九）立朱常洛为太子',
    nature: '政治消耗',
    impact: '皇帝与文官集团彻底对立，怠政演化为制度性对抗',
  },
  {
    ad: '1592–1600',
    era: '万历中期',
    age: '29–37',
    stage: '万历三大征',
    event: '宁夏哱拜之乱、播州杨应龙之乱、援朝抗倭（对日战争）',
    nature: '军事动员',
    impact: '维护藩属与边疆秩序，但军费巨大，财政压力上升',
  },
  {
    ad: '1590s–1610s',
    era: '万历中后期',
    age: '30s–40s',
    stage: '矿税之弊',
    event: '征矿税、增织造烧造等，充内库；民怨与官场冲突加剧',
    nature: '财政/社会',
    impact: '在“怠政”背景下变成压榨工具，成为晚明乱源之一',
  },
  {
    ad: '1601',
    era: '万历二十九',
    age: '37–38',
    stage: '西学东渐',
    event: '利玛窦觐见，呈《万国图志》、自鸣钟等；西学传播与徐光启等互动',
    nature: '文化/技术',
    impact: '西学进入中枢叙事，但未转化为系统性制度变革',
  },
  {
    ad: '1618',
    era: '万历四十六',
    age: '54–55',
    stage: '女真崛起',
    event: '努尔哈赤“七大恨”，后金起兵；抚顺等失陷',
    nature: '战略危机',
    impact: '明朝东北防线崩解，进入“亡国链条”的前段',
  },
  {
    ad: '1618–1619',
    era: '万历末',
    age: '55–56',
    stage: '三饷开端',
    event: '为辽东战事加派“辽饷”（后成明末三饷之始）；颁旨禁革火耗加剥',
    nature: '财政—社会',
    impact: '以战争财政撬动全国税负结构，基层承压上升',
  },
  {
    ad: '1619',
    era: '万历四十七',
    age: '55–56',
    stage: '萨尔浒大败',
    event: '杨镐四路出兵失利；明军折损惨重，开原铁岭等失陷',
    nature: '军事崩塌',
    impact: '明朝在东北由攻转守，燕京震动',
  },
  {
    ad: '1619–1620',
    era: '万历末',
    age: '56',
    stage: '局部补救',
    event: '拨内帑、任熊廷弼经略辽东、屯兵筑城，局势略有扭转',
    nature: '危机管理',
    impact: '说明“深宫不朝≠完全不决策”，但窗口已很窄',
  },
  {
    ad: '1620-08-18',
    era: '万历四十八',
    age: '56（材料亦称58）',
    stage: '去世',
    event: '弘德殿崩；遗诏反省怠政、命停矿税、起用被废官员、强调发帑助辽等',
    nature: '终局/自我否定',
    impact: '临终试图“改辙维新”，但制度修复窗口已关闭',
  },
  {
    ad: '1620-09',
    era: '泰昌元',
    age: '—',
    stage: '余波',
    event: '光宗即位不足一月死（红丸案），朝局进入“三案”漩涡',
    nature: '政治崩坏',
    impact: '继承短促动荡，加速党争与宦官问题',
  },
  {
    ad: '1956–1959（后世）',
    era: '—',
    age: '—',
    stage: '定陵发掘',
    event: '定陵发掘出土大量文物；后因技术与政治原因造成重大损失',
    nature: '史料命运',
    impact: '万历在现代史中又一次成为“权力与叙事”的样本',
  },
]

const WANLI_GUOBEN_TABLE = [
  {
    stage: '前置阶段',
    time: '万历初年（1573–1582）',
    feature: '皇帝尚配合制度',
    scholarType: '制度设计派',
    scholarTypeEmph: true,
    representative: '张居正',
    representativeEmph: true,
    identity: '内阁首辅',
    stance: '稳定继承秩序',
    method: '政策推进、制度收束',
    role: '为“争国本”奠定制度前提',
  },
  {
    stage: '过渡阶段',
    time: '万历十年前后（1582–1586）',
    feature: '张居正死后权力松动',
    scholarType: '缓冲型文官',
    scholarTypeEmph: true,
    representative: '申时行',
    representativeEmph: true,
    identity: '内阁首辅',
    stance: '立嫡立长，但不激化',
    method: '温和劝谏、内部协调',
    role: '尝试避免皇权正面冲突',
  },
  {
    stage: '爆发阶段',
    time: '万历十四年（1586）',
    feature: '郑贵妃生子',
    scholarType: '原则宣示派',
    scholarTypeEmph: true,
    representative: '邹元标',
    representativeEmph: true,
    identity: '给事中',
    stance: '必须立长子',
    method: '上疏直言',
    role: '首次将“国本”推至公开议题',
  },
  {
    stage: '拉锯初期',
    time: '万历十五—十八年（1587–1590）',
    feature: '皇帝长期留中',
    scholarType: '制度死磕派',
    scholarTypeEmph: true,
    representative: '赵用贤',
    representativeEmph: true,
    identity: '御史',
    stance: '祖制不可破',
    method: '反复上疏',
    role: '把“立太子”制度化为底线',
  },
  {
    stage: '拉锯中期',
    time: '万历中期（1591–1597）',
    feature: '皇帝明显对抗',
    scholarType: '牺牲型言官',
    scholarTypeEmph: true,
    representative: '王之寀',
    representativeEmph: true,
    identity: '给事中',
    stance: '立储即国安',
    method: '不计贬谪',
    role: '用个人代价维持制度压力',
  },
  {
    stage: '拉锯后期',
    time: '万历后期（1598–1601）',
    feature: '皇帝被迫妥协',
    scholarType: '集体意志派',
    scholarTypeEmph: true,
    representative: '内阁群臣',
    representativeEmph: false,
    identity: '内阁',
    stance: '制度必须落地',
    method: '集体进谏',
    role: '逼出立太子的制度结果',
  },
  {
    stage: '立储后',
    time: '万历二十九年后（1601–1610）',
    feature: '太子被冷处理',
    scholarType: '清议转向派',
    scholarTypeEmph: true,
    representative: '顾宪成',
    representativeEmph: true,
    identity: '士林领袖',
    stance: '皇权需受道德约束',
    method: '书院讲学',
    role: '从“制度”转向“道德政治”',
  },
  {
    stage: '余波阶段',
    time: '万历晚年',
    feature: '皇权彻底疏离',
    scholarType: '殉道型文官',
    scholarTypeEmph: true,
    representative: '高攀龙',
    representativeEmph: true,
    identity: '东林党人',
    stance: '名节高于仕途',
    method: '以身殉道',
    role: '文官从治理者退化为道德象征',
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
export const metadata = {
  title: '历史调研 · 明清与三国',
  description: '涂阿燃（tuaran）的历史调研：以时间线梳理三国、明清的制度、权力与人物命运。',
  keywords: ['涂阿燃', 'tuaran', '历史调研', '三国史', '曹操', '明清史', '明朝', '朱元璋', '康熙'],
  alternates: {
    canonical: '/history/ming-qing',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MingQingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">历史调研</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">以时间线梳理三国、明清的制度、权力与人物命运。</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/articles?tab=history" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回知识库
              </Link>
            </div>
          </div>
          <SharePageButton title="历史调研 · 明清与三国" text="以时间线梳理三国、明清的制度、权力与人物命运。" url="/history/ming-qing" />
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
                  href="#mingqing"
                  className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  历史调研
                </a>
                <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                  <li>
                    <a href="#mingqing-summary" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      综述
                    </a>
                  </li>
                  <li>
                    <a href="#sanguo" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      三国史
                    </a>
                  </li>
                  <li>
                    <a href="#cao-cao" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      曹操
                    </a>
                  </li>
                  <li>
                    <a href="#ming16" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      明16帝
                    </a>
                  </li>
                  <li>
                    <a href="#zhuyuanzhang" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      朱元璋
                    </a>
                  </li>
                  <li>
                    <a href="#zhudi" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      朱棣
                    </a>
                  </li>
                  <li>
                    <a href="#jiajing" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      朱厚熜（嘉靖）
                    </a>
                  </li>
                  <li>
                    <a href="#zhangjuzheng" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      张居正
                    </a>
                  </li>
                  <li>
                    <a href="#wanli" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                      朱翊钧（万历）
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
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="prose-tuaran">
          <section className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
            <h2 id="mingqing" className="text-[#444] text-lg scroll-mt-24">
              历史调研
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
            《大明1566》是另一个层面。它把目光放在财政、官僚体系、制度惯性这些“看不见但决定一切”的东西上，而不只是讲皇帝或权臣。我也是在那之后，开始真正去读《明朝那些事》。当年明月几乎可以说是我写作上的偶像——历史完全可以被写成有血有肉、有节奏、有观点的叙事，有“人情味”。
          </p>
          <p className="m-0">
            正因如此，我一直有一个隐约但坚定的愿望：有一天，能写一本属于自己的历史书。它既复述史实，也把制度、人物、时代情绪串在一起，试着写清楚一个问题：人在时代洪流里，到底能做什么，又能改变什么。
          </p>
          <p className="m-0">
            言而总之，我对“权力如何塑造人、制度如何吞没个人”这件事，始终保持着一种无法放下的好奇与敬畏。
          </p>
        </div>

            <h3 id="sanguo" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              三国史
            </h3>
            <div className="text-sm text-[#666] space-y-4 mt-4 dark:text-gray-300">
              <p className="m-0">
                三国部分先收敛为曹操时间线：从汉末入仕、讨董、兖州立足，到奉迎天子、官渡翻盘、赤壁受挫、魏国奠基。它和明清部分放在同一页，是为了连续观察一个问题：乱世中的个人能力，如何被制度、军政组织与合法性叙事放大或反噬。
              </p>
            </div>

            <h3 id="cao-cao" className="mt-10 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">
              曹操
            </h3>
            <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

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

            <h3 id="zhuyuanzhang" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">朱元璋</h3>
            <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

            <div className="mt-4 overflow-x-auto">
              <div className="flex items-stretch gap-4 min-w-max pb-2">
                {ZHU_YUANZHANG_TIMELINE.map((item, index) => (
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

                    {index < ZHU_YUANZHANG_TIMELINE.length - 1 ? <ElbowConnector /> : null}
                  </div>
                ))}
              </div>
            </div>

            <h3 id="zhudi" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">朱棣</h3>
            <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

            <div className="mt-4 overflow-x-auto">
              <div className="flex items-stretch gap-4 min-w-max pb-2">
                {ZHU_DI_TIMELINE.map((item, index) => (
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

                    {index < ZHU_DI_TIMELINE.length - 1 ? <ElbowConnector /> : null}
                  </div>
                ))}
              </div>
            </div>

        <h3 id="jiajing" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">朱厚熜（嘉靖）</h3>
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

        <h3 id="wanli" className="mt-12 text-[#444] text-base font-bold dark:text-gray-200 scroll-mt-24">朱翊钧（万历）</h3>
        <p className="text-sm text-[#666] mt-2 mb-0 dark:text-gray-300">横向时间线（可左右滑动）。</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex items-stretch gap-4 min-w-max pb-2">
            {WANLI_TIMELINE.map((item, index) => (
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

                {index < WANLI_TIMELINE.length - 1 ? <ElbowConnector /> : null}
              </div>
            ))}
          </div>
        </div>

        <details open className="mt-8 border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <summary className="text-sm font-bold text-[#444] dark:text-gray-200 cursor-pointer select-none">
            争国本事件
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm text-[#666] dark:text-gray-300 border border-[#eee] dark:border-gray-800">
              <thead className="bg-white dark:bg-gray-900">
                <tr className="text-xs text-[#999] dark:text-gray-400">
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">阶段</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">时间</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">阶段特征</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">文官群体类型</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">代表人物</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">官职 / 身份</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">核心立场</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">行动方式</th>
                  <th className="text-left font-bold p-2 border-b border-[#eee] dark:border-gray-800">这一阶段文官的历史角色</th>
                </tr>
              </thead>
              <tbody>
                {WANLI_GUOBEN_TABLE.map((row) => (
                  <tr key={`${row.stage}-${row.time}`} className="align-top">
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{row.stage}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{row.time}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.feature}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800">
                      <span className={row.scholarTypeEmph ? 'font-bold text-[#444] dark:text-gray-200' : undefined}>
                        {row.scholarType}
                      </span>
                    </td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">
                      <span className={row.representativeEmph ? 'font-bold text-[#444] dark:text-gray-200' : undefined}>
                        {row.representative}
                      </span>
                    </td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800 whitespace-nowrap">{row.identity}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.stance}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.method}</td>
                    <td className="p-2 border-b border-[#eee] dark:border-gray-800">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

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

          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
