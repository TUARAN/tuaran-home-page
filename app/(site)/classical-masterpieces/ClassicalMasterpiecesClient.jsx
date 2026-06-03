'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'

function cleanTitle(title) {
  return title.replace(/[《》]/g, '').replace('将近酒', '将进酒')
}

function originalSearchUrl(title) {
  return `https://www.gushiwen.cn/search.aspx?value=${encodeURIComponent(cleanTitle(title))}`
}

const peakMeta = {
  短歌行: {
    era: '建安',
    form: '四言古诗',
    impact: 94,
    craft: 90,
    courage: 86,
    reach: 96,
    tags: ['建安风骨', '求贤', '人生短促'],
    line: '从人生短促写到求贤若渴，曹操的政治胸襟与诗性气质同在。',
    detail:
      '建安文学的代表篇章之一。它不只是“对酒当歌”的人生感慨，更把求贤、忧时、统一天下的抱负写进了短促有力的四言节奏里。',
  },
  洛神赋: {
    era: '曹魏',
    form: '辞赋',
    impact: 98,
    craft: 100,
    courage: 68,
    reach: 98,
    tags: ['辞赋巅峰', '人神之恋', '华美'],
    line: '以极致铺陈写人神相遇，赋体美学的高峰之一。',
    detail:
      '曹植赋作巅峰。它把洛水神女的体态、光彩、情感与不可抵达写到极致，既是辞赋名篇，也是中国审美想象中最稳定的神女形象之一。',
  },
  兰亭集序: {
    era: '东晋',
    form: '序',
    impact: 97,
    craft: 95,
    courage: 72,
    reach: 99,
    tags: ['生死之感', '雅集', '书法名篇'],
    line: '从春日雅集写到死生之痛，清朗中有深悲。',
    detail:
      '王羲之以兰亭雅集为起点，由山水、宴饮、群贤转入人生短促与死生大事。文章和书法共同成就了“天下第一行书”的文化现场。',
  },
  春江花月夜: {
    era: '初唐',
    form: '歌行',
    impact: 98,
    craft: 98,
    courage: 68,
    reach: 96,
    tags: ['孤篇横绝', '月夜宇宙感', '初唐歌行'],
    line: '孤篇横绝，竟为大家。',
    detail:
      '张若虚现存诗作极少，却凭这一篇在唐诗史上占据顶级席位。春、江、花、月、夜互相折射，个人相思被推到宇宙时间之中。',
  },
  滕王阁序: {
    era: '初唐',
    form: '骈文序',
    impact: 99,
    craft: 100,
    courage: 82,
    reach: 100,
    tags: ['骈文巅峰', '失路之悲', '少年才气'],
    line: '一篇写尽盛会、山川、才命与少年不甘。',
    detail:
      '王勃骈文代表作。它以洪州胜会为外壳，写景、用典、抒怀、赠别一气贯通，“落霞与孤鹜齐飞”之外，更有失路之人的命运感。',
  },
  将进酒: {
    era: '盛唐',
    form: '乐府歌行',
    impact: 97,
    craft: 94,
    courage: 86,
    reach: 100,
    tags: ['浪漫主义', '豪情', '诗仙风骨'],
    line: '一篇写尽李白的意气、豪情与生命烈度。',
    detail:
      '李白浪漫诗风的极致体现。全篇情绪起落迅猛，从人生短促写到及时行乐、从自信天才写到万古愁，朗诵性和传播力都极强。',
  },
  岳阳楼记: {
    era: '北宋',
    form: '记',
    impact: 100,
    craft: 96,
    courage: 88,
    reach: 100,
    tags: ['忧乐观', '写景抒情立论', '宋文名篇'],
    line: '写景、抒情、立论完美结合。',
    detail:
      '“先天下之忧而忧，后天下之乐而乐”震古烁今。文章从洞庭景象进入迁客骚人之情，再推出士大夫责任，是宋代散文第一梯队名篇。',
  },
  前赤壁赋: {
    era: '北宋',
    form: '文赋',
    impact: 97,
    craft: 98,
    courage: 78,
    reach: 99,
    tags: ['赤壁', '人生哲思', '苏轼'],
    line: '把江月清风写成对有限人生的安顿。',
    detail:
      '苏轼文赋代表作。它从泛舟赤壁写到历史兴亡、人生须臾与天地无尽，最终以“清风明月”完成精神上的自我开解。',
  },
  满江红: {
    era: '南宋',
    form: '词',
    impact: 94,
    craft: 88,
    courage: 96,
    reach: 99,
    tags: ['家国', '壮怀', '抗金'],
    line: '一阕词把家国之耻与壮士热血推到极高处。',
    detail:
      '传统上归于岳飞名下，千百年来作为家国情怀与忠义精神的代表文本流传。其传播力与情绪强度远超一般词作。',
  },
  沁园春雪: {
    era: '近现代',
    form: '词',
    impact: 93,
    craft: 90,
    courage: 92,
    reach: 99,
    tags: ['历史纵览', '风流人物', '近现代词'],
    line: '以北国雪景起笔，转入对历史人物与时代主体的判断。',
    detail:
      '近现代词作中传播度极高的一篇。上阕写江山壮阔，下阕纵评历史人物，最终落到“风流人物”的时代判断上。',
  },
}

const POETRY_PEAK_CATEGORY_WORKS = [
  ['短歌行', '曹操'],
  ['洛神赋', '曹植'],
  ['兰亭集序', '王羲之'],
  ['滕王阁序', '王勃'],
  ['前赤壁赋', '苏轼'],
  ['满江红', '岳飞'],
  ['沁园春雪', '毛泽东'],
].map(([title, author]) => ({
  title: `《${title}》`,
  author,
  ...peakMeta[title],
}))

const CATEGORIES = [
  {
    id: 'peak',
    label: '诗词巅峰',
    short: '巅峰',
    benchmark: '先读原文，再谈高下',
    thesis: '这些作品适合反复诵读：先进入文本的节奏、声气与情感，再看它们为什么能被反复记住。',
    color: 'amber',
    works: POETRY_PEAK_CATEGORY_WORKS,
  },
  {
    id: 'fu',
    label: '辞赋类',
    short: '辞赋',
    benchmark: '对标《滕王阁序》《洛神赋》',
    thesis: '以铺陈、气势、声律与寄托取胜，最适合看一篇文章如何把身世、家国与文采压到同一个平面上。',
    color: 'amber',
    works: [
      {
        title: '《登楼赋》',
        author: '王粲',
        era: '建安',
        form: '短赋',
        impact: 92,
        craft: 88,
        courage: 78,
        reach: 84,
        tags: ['怀才不遇', '家国愁思', '建安文学'],
        line: '凭一篇短赋写尽乱世士人的漂泊、委屈与家国之痛。',
        detail:
          '建安文学代表作。王粲凭此赋位列“建安七子”之首，篇幅不长，却把登楼所见、羁旅之苦、报国无门压缩成沉郁的精神切片，辞短意深。',
      },
      {
        title: '《别赋》',
        author: '江淹',
        era: '南朝梁',
        form: '骈赋',
        impact: 90,
        craft: 95,
        courage: 62,
        reach: 88,
        tags: ['离别母题', '骈文华采', '巅峰绝唱'],
        line: '以“黯然销魂者，唯别而已矣”统摄人间离别百态。',
        detail:
          '开篇即成千古名句。全篇写仕宦、游子、从军、情侣等离别场景，情绪层层推开。后世“江郎才尽”之说，反而衬出这一篇的高度。',
      },
      {
        title: '《阿房宫赋》',
        author: '杜牧',
        era: '晚唐',
        form: '赋文',
        impact: 96,
        craft: 93,
        courage: 86,
        reach: 94,
        tags: ['借古讽今', '晚唐', '兴亡之叹'],
        line: '把宫殿、欲望、灭亡写成一篇锋利的政治寓言。',
        detail:
          '晚唐赋文高峰。文辞凌厉，铺排与议论转换极快，借秦亡讽唐弊，说理与文采兼备，仅凭此篇足以让杜牧在辞赋史上留名。',
      },
      {
        title: '《二京赋》',
        author: '张衡',
        era: '东汉',
        form: '汉大赋',
        impact: 94,
        craft: 97,
        courage: 72,
        reach: 80,
        tags: ['汉大赋', '京都书写', '规模宏大'],
        line: '以巨幅文字工程展示汉代京都赋的最高规格。',
        detail:
          '汉大赋巅峰之作，规模宏大、辞藻瑰丽，以长安、洛阳为对象铺陈制度、物产、礼乐与都会气象，是汉代京都赋的集大成。',
      },
    ],
  },
  {
    id: 'poetry',
    label: '诗歌类',
    short: '诗歌',
    benchmark: '对标《春江花月夜》',
    thesis: '诗歌的单篇封神，往往不是只靠名句，而是格律、情绪、意象、叙事或人格在一篇中同时抵达高点。',
    color: 'blue',
    works: [
      {
        title: '《春江花月夜》',
        author: '张若虚',
        era: '初唐',
        form: '歌行',
        impact: 98,
        craft: 98,
        courage: 68,
        reach: 96,
        tags: ['孤篇横绝', '月夜宇宙感', '初唐歌行'],
        line: '孤篇横绝，竟为大家。',
        detail:
          '张若虚现存诗作极少，却凭这一篇在唐诗史上占据顶级席位。春、江、花、月、夜互相折射，个人相思被推到宇宙时间之中。',
      },
      {
        title: '《登高》',
        author: '杜甫',
        era: '盛唐',
        form: '七律',
        impact: 99,
        craft: 100,
        courage: 75,
        reach: 95,
        tags: ['七律第一', '沉郁顿挫', '晚年悲秋'],
        line: '格律、意境、情感、格局几乎无一短板。',
        detail:
          '历代多评为七律第一。前四句写景开阔而精密，后四句由身世入时代，杜甫晚年漂泊、疾病、贫困与家国之痛都收束在八句之内。',
      },
      {
        title: '《长恨歌》',
        author: '白居易',
        era: '中唐',
        form: '长篇叙事诗',
        impact: 96,
        craft: 92,
        courage: 70,
        reach: 99,
        tags: ['叙事诗', '唐玄宗杨贵妃', '传播度极高'],
        line: '长篇叙事诗天花板，流传千年。',
        detail:
          '白居易名篇众多，但此篇在传播度、故事性、文学地位上独一档。它把宫廷爱情、历史兴亡和民间传唱性融合成稳定的文化记忆。',
      },
      {
        title: '《将进酒》',
        author: '李白',
        era: '盛唐',
        form: '乐府歌行',
        impact: 97,
        craft: 94,
        courage: 86,
        reach: 100,
        tags: ['浪漫主义', '豪情', '诗仙风骨'],
        line: '一篇写尽李白的意气、豪情与生命烈度。',
        detail:
          '李白浪漫诗风的极致体现。全篇情绪起落迅猛，从人生短促写到及时行乐、从自信天才写到万古愁，朗诵性和传播力都极强。',
      },
    ],
  },
  {
    id: 'politics',
    label: '政论 / 奏疏类',
    short: '政论',
    benchmark: '对标海瑞《治安疏》、张居正《陈六事疏》',
    thesis: '这类文章不靠文采封神，靠胆识、格局、政见与现实影响力。好的奏疏，是把时代病灶说到朝堂上。',
    color: 'red',
    works: [
      {
        title: '《治安疏》',
        author: '海瑞',
        era: '明嘉靖',
        form: '奏疏',
        impact: 98,
        craft: 78,
        courage: 100,
        reach: 93,
        tags: ['以死进谏', '直指弊政', '人格象征'],
        line: '“骂皇帝疏”的代表，文骨刚硬。',
        detail:
          '直言嘉靖帝弊政，以死进谏，既是千古名疏，也是人格与勇气的象征。它的力量不只在论证，更在说话者愿意承担后果。',
      },
      {
        title: '《陈六事疏》',
        author: '张居正',
        era: '明万历',
        form: '奏疏',
        impact: 96,
        craft: 82,
        courage: 88,
        reach: 86,
        tags: ['万历新政', '改革纲领', '经世致用'],
        line: '一代名臣的施政总纲。',
        detail:
          '万历改革的纲领性文件，六条国策直指明朝积弊。它不是文学表演，而是可落地的治理方案，拉开万历新政序幕。',
      },
      {
        title: '《谏逐客书》',
        author: '李斯',
        era: '战国秦',
        form: '上书',
        impact: 99,
        craft: 94,
        courage: 90,
        reach: 92,
        tags: ['先秦政论', '人才战略', '逻辑雄辩'],
        line: '凭一篇上书说服秦王收回逐客令。',
        detail:
          '秦朝第一政论短文。文章以秦国历史证明“客卿”之利，逻辑缜密、气势磅礴，实际挽救秦国人才格局，影响统一进程。',
      },
      {
        title: '《出师表》（前后）',
        author: '诸葛亮',
        era: '蜀汉',
        form: '表',
        impact: 97,
        craft: 88,
        courage: 92,
        reach: 98,
        tags: ['忠义', '北伐', '臣子文书'],
        line: '忠义、恳切、谋略兼具的臣子文书标杆。',
        detail:
          '以前出师表最经典。“鞠躬尽瘁，死而后已”流传千古。文字不以华丽取胜，而以恳切、责任与战略判断形成持续感染力。',
      },
      {
        title: '《论积贮疏》',
        author: '贾谊',
        era: '西汉',
        form: '奏疏',
        impact: 90,
        craft: 86,
        courage: 82,
        reach: 82,
        tags: ['储粮强国', '汉初政论', '危机预判'],
        line: '从粮食储备预判国家安危。',
        detail:
          '西汉政论名篇。贾谊以积贮论国家安全，建言储粮强国，眼光超前、文笔犀利，是汉初经世政论的代表。',
      },
    ],
  },
  {
    id: 'prose',
    label: '古文 / 散文类',
    short: '古文',
    benchmark: '唐宋古文运动巅峰，单篇封神',
    thesis: '散文名篇的高处，在于能把景、情、理压成稳定结构：读者记住的不只是一句名言，而是一套精神姿态。',
    color: 'green',
    works: [
      {
        title: '《桃花源记》',
        author: '陶渊明',
        era: '东晋',
        form: '记',
        impact: 99,
        craft: 90,
        courage: 72,
        reach: 99,
        tags: ['乌托邦', '隐逸', '理想社会'],
        line: '原是诗序，却构筑了中国人两千年的理想乡。',
        detail:
          '本为《桃花源诗》序，结果序文比诗更出名。它以极简叙事创造出“桃花源”这个文化原型，成为中国人想象理想社会的固定坐标。',
      },
      {
        title: '《岳阳楼记》',
        author: '范仲淹',
        era: '北宋',
        form: '记',
        impact: 100,
        craft: 96,
        courage: 88,
        reach: 100,
        tags: ['忧乐观', '写景抒情立论', '宋文名篇'],
        line: '写景、抒情、立论完美结合。',
        detail:
          '“先天下之忧而忧，后天下之乐而乐”震古烁今。文章从洞庭景象进入迁客骚人之情，再推出士大夫责任，是宋代散文第一梯队名篇。',
      },
      {
        title: '《醉翁亭记》',
        author: '欧阳修',
        era: '北宋',
        form: '记',
        impact: 92,
        craft: 95,
        courage: 70,
        reach: 94,
        tags: ['山水散文', '闲适', '太守与民同乐'],
        line: '一篇写尽山水意趣与文人情怀。',
        detail:
          '山水散文极致。文字灵动，层层回环，以“醉翁之意不在酒”写山水、宴游与政治人格，闲适中有深厚的公共情怀。',
      },
      {
        title: '《师说》',
        author: '韩愈',
        era: '中唐',
        form: '议论文',
        impact: 95,
        craft: 90,
        courage: 84,
        reach: 96,
        tags: ['古文运动', '师道', '议论文典范'],
        line: '颠覆世俗偏见，说理透彻。',
        detail:
          '唐宋古文运动核心名篇。韩愈以强硬逻辑重申从师之道，反击士大夫耻于从师的风气，是古代议论文的典范。',
      },
      {
        title: '《陋室铭》',
        author: '刘禹锡',
        era: '中唐',
        form: '铭',
        impact: 96,
        craft: 94,
        courage: 78,
        reach: 99,
        tags: ['托物言志', '短文', '人格自守'],
        line: '短短八十一字，字字珠玑。',
        detail:
          '短小古文的天花板。以陋室托人格，以极少文字完成环境、交游、志趣与精神自证，千古传诵。',
      },
    ],
  },
  {
    id: 'letters',
    label: '祭文 / 书信 / 杂文体',
    short: '杂体',
    benchmark: '小众但单篇封神',
    thesis: '这些体裁不一定占据考试主干，却常在情感强度、沟通策略或文体突破上达到极高辨识度。',
    color: 'violet',
    works: [
      {
        title: '《祭十二郎文》',
        author: '韩愈',
        era: '中唐',
        form: '祭文',
        impact: 94,
        craft: 92,
        courage: 76,
        reach: 92,
        tags: ['至亲之痛', '祭文第一', '家常语'],
        line: '以家常话语写至亲离世，至情至悲。',
        detail:
          '古代祭文第一梯队。一改传统祭文套语，以近乎家常的口吻写失亲之痛，情绪真切，被称作祭文中的千年绝调。',
      },
      {
        title: '《与陈伯之书》',
        author: '丘迟',
        era: '南朝梁',
        form: '书信',
        impact: 88,
        craft: 93,
        courage: 80,
        reach: 86,
        tags: ['劝降书', '攻心', '江南名句'],
        line: '一封劝降书信，文采与攻心兼备。',
        detail:
          '“暮春三月，江南草长”成为千古名句。文章一面铺陈江南春色，一面劝陈伯之回归梁朝，情感、文采与政治沟通策略兼备。',
      },
    ],
  },
]

const colorClass = {
  amber: {
    text: 'text-[#8b5a1f] dark:text-[#f0c776]',
    bg: 'bg-[#fff4df] dark:bg-[#2b2214]',
    border: 'border-[#ead7b5] dark:border-[#43341d]',
    soft: 'bg-[#f8ead0] dark:bg-[#372817]',
    ring: 'ring-[#d8a84b]/35',
  },
  blue: {
    text: 'text-[#275f8f] dark:text-[#9cc8ef]',
    bg: 'bg-[#eaf4fb] dark:bg-[#132433]',
    border: 'border-[#c6ddeb] dark:border-[#263c50]',
    soft: 'bg-[#dbeef8] dark:bg-[#193047]',
    ring: 'ring-[#4b9ed8]/35',
  },
  red: {
    text: 'text-[#9a3e35] dark:text-[#f1aaa2]',
    bg: 'bg-[#fff0ec] dark:bg-[#301916]',
    border: 'border-[#efc8bf] dark:border-[#552d28]',
    soft: 'bg-[#f7d8d0] dark:bg-[#44231f]',
    ring: 'ring-[#d66354]/35',
  },
  green: {
    text: 'text-[#356b54] dark:text-[#9fd0b7]',
    bg: 'bg-[#edf7f0] dark:bg-[#14251d]',
    border: 'border-[#cfe5d8] dark:border-[#2b4739]',
    soft: 'bg-[#dceee3] dark:bg-[#1b3528]',
    ring: 'ring-[#5aa477]/35',
  },
  violet: {
    text: 'text-[#70529a] dark:text-[#c7b5f2]',
    bg: 'bg-[#f3effb] dark:bg-[#211934]',
    border: 'border-[#ddd3f0] dark:border-[#3c3158]',
    soft: 'bg-[#e8dff7] dark:bg-[#2b2143]',
    ring: 'ring-[#8b6ad1]/35',
  },
}

function WorkCard({ work, onRead }) {
  const colors = colorClass[work.categoryColor]
  return (
    <article
      className={`flex h-full min-h-[210px] flex-col rounded-lg border bg-white p-4 shadow-[0_12px_30px_rgba(83,70,45,0.06)] dark:bg-[#101820] dark:shadow-none ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`mb-2 text-xs font-medium ${colors.text}`}>{work.categoryLabel} · {work.form}</p>
          <h3 className="mb-1 border-b-0 pb-0 font-serif text-xl font-semibold tracking-normal text-[#231f18] dark:text-gray-100">
            {work.title}
          </h3>
          <p className="mb-0 text-sm text-[#756b5d] dark:text-gray-400">{work.author} · {work.era}</p>
        </div>
      </div>

      <p className="mt-4 mb-0 text-[15px] leading-relaxed text-[#3f382e] dark:text-gray-200">{work.line}</p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <span className="rounded-full bg-[#2f2a22] px-2 py-1 text-[11px] text-white dark:bg-white dark:text-[#0b1016]">
          按需加载
        </span>
        {work.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-[#f5efe5] px-2 py-1 text-[11px] text-[#736653] dark:bg-[#17212d] dark:text-gray-300">
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onRead(work)}
        className="mt-4 inline-flex w-fit rounded-md bg-[#2f2a22] px-3 py-2 text-sm text-white transition-colors hover:bg-[#4a3d30] dark:bg-white dark:text-[#0b1016] dark:hover:bg-gray-200"
      >
        读原文
      </button>
    </article>
  )
}

function OriginalModal({ work, onClose }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!work) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#e5d8c7] bg-[#fdfaf3] shadow-[0_30px_90px_rgba(34,27,18,0.28)] dark:border-[#303b4c] dark:bg-[#0f1722]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] px-5 py-4 dark:border-[#263241]">
          <div>
            <p className="mb-1 text-xs text-[#7a6d5a] dark:text-gray-400">
              {work.categoryLabel} · {work.form} · {work.author}
            </p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#241f18] dark:text-gray-100">
              {work.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-[#dfd3c2] px-3 py-1 text-sm text-[#5b5146] hover:bg-[#f3eadc] dark:border-[#334052] dark:text-gray-200 dark:hover:bg-[#17212d]"
            aria-label="关闭原文弹窗"
          >
            关闭
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {work.isLoading ? (
            <div className="rounded-md border border-[#eadfce] bg-white p-5 text-sm leading-7 text-[#584f42] dark:border-[#2b3746] dark:bg-[#121a24] dark:text-gray-300">
              正在加载原文……
            </div>
          ) : work.originalText ? (
            <div className="whitespace-pre-wrap font-serif text-[16px] leading-9 text-[#342d24] dark:text-gray-200">
              {work.originalText}
            </div>
          ) : (
            <div className="rounded-md border border-[#eadfce] bg-white p-5 text-sm leading-7 text-[#584f42] dark:border-[#2b3746] dark:bg-[#121a24] dark:text-gray-300">
              <p className="mb-3">此篇原文暂未内置，可先查看校订来源。</p>
              <a href={work.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                打开原文来源
              </a>
            </div>
          )}
        </div>

        {work.sourceUrl ? (
          <div className="border-t border-[#eadfce] px-5 py-3 text-right dark:border-[#263241]">
            <a href={work.sourceUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
              原文来源
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ClassicalMasterpiecesClient() {
  const categorizedWorks = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        works: category.works.map((work, index) => {
          return {
            ...work,
            key: `${category.id}-${cleanTitle(work.title)}-${work.author}-${index}`,
            categoryId: category.id,
            categoryLabel: category.short,
            categoryColor: category.color,
            sourceUrl: work.sourceUrl || originalSearchUrl(work.title),
          }
        }),
      })),
    []
  )
  const [activeCategory, setActiveCategory] = useState('all')
  const [readingWork, setReadingWork] = useState(null)

  async function openOriginal(work) {
    setReadingWork({ ...work, isLoading: true })

    try {
      const { getClassicalOriginal } = await import('./classicalOriginals')
      const original = getClassicalOriginal(work.title)
      setReadingWork({
        ...work,
        ...original,
        sourceUrl: original.sourceUrl || work.sourceUrl,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to load classical original', error)
      setReadingWork({
        ...work,
        isLoading: false,
      })
    }
  }

  const visibleCategories = useMemo(() => {
    return activeCategory === 'all'
      ? categorizedWorks
      : categorizedWorks.filter((category) => category.id === activeCategory)
  }, [activeCategory, categorizedWorks])

  const featuredWork = categorizedWorks[0]?.works[0]

  return (
    <main className="min-h-screen bg-[#f8f5f0] text-[#2f2a22] dark:bg-[#0b1016] dark:text-gray-100">
      <section className="relative overflow-hidden border-b border-[#e6dccb] bg-[#f4ecdf] dark:border-[#202a37] dark:bg-[#0f151d]">
        <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.14]">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(111,78,38,.16)_1px,transparent_1px),linear-gradient(180deg,rgba(111,78,38,.13)_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-14">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#766958] dark:text-gray-400">
              <Link href="/articles" className="underline-offset-4 hover:underline">
                文章与调研
              </Link>
              <span>/</span>
              <span>古典文学资料库</span>
            </div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#f0c776]">
              Classical Chinese Masterpieces
            </p>
            <h1 className="mb-5 max-w-3xl font-serif text-[2.3rem] font-semibold leading-tight tracking-normal text-[#1f1b16] dark:text-gray-100 md:text-[4.2rem]">
              单篇封神的中国古典名篇
            </h1>
            <p className="mb-6 max-w-2xl text-base leading-8 text-[#51483b] dark:text-gray-300 md:text-lg">
              不按“作者全集”排位，只看一篇作品能否独立撑起文学史记忆：辞赋看气象，诗歌看完成度，奏疏看胆识，古文看结构，杂体看情感与沟通的穿透力。
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className={`rounded-full border px-3 py-1.5 text-sm no-underline ${colorClass[category.color].border} ${colorClass[category.color].bg} ${colorClass[category.color].text}`}
                >
                  {category.short}
                </a>
              ))}
            </div>
          </div>

          {featuredWork ? (
          <div className="self-end rounded-lg border border-[#e2d5c1] bg-white/78 p-4 shadow-[0_24px_70px_rgba(83,64,33,0.14)] backdrop-blur dark:border-[#293545] dark:bg-[#111923]/80 dark:shadow-none">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs text-[#827664] dark:text-gray-400">快速阅读</p>
                <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#241f18] dark:text-gray-100">
                  {featuredWork.title}
                </h2>
              </div>
              <SharePageButton
                title="单篇封神的中国古典名篇"
                text="辞赋、诗歌、政论奏疏、古文散文、祭文书信杂文体的古典文学资料库。"
                url="/classical-masterpieces"
              />
            </div>
            <p className="mb-4 text-sm leading-7 text-[#51483b] dark:text-gray-300">{featuredWork.detail}</p>
            <button
              type="button"
              onClick={() => openOriginal(featuredWork)}
              className="inline-flex rounded-md bg-[#2f2a22] px-3 py-2 text-sm text-white transition-colors hover:bg-[#4a3d30] dark:bg-white dark:text-[#0b1016] dark:hover:bg-gray-200"
            >
              打开原文
            </button>
          </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const colors = colorClass[category.color]
            return (
              <article key={category.id} id={category.id} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                <p className={`mb-2 text-xs font-medium ${colors.text}`}>{category.benchmark}</p>
                <h2 className="mb-3 border-b-0 pb-0 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                  {category.label}
                </h2>
                <p className="mb-0 text-sm leading-6 text-[#584f42] dark:text-gray-300">{category.thesis}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="sticky top-[73px] z-20 border-y border-[#e8dfd0] bg-[#f8f5f0]/95 backdrop-blur dark:border-[#202938] dark:bg-[#0b1016]/95">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#2f2a22] text-white dark:bg-white dark:text-[#0b1016]'
                  : 'bg-white text-[#554b3d] dark:bg-[#121a24] dark:text-gray-300'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  activeCategory === category.id
                    ? 'bg-[#2f2a22] text-white dark:bg-white dark:text-[#0b1016]'
                    : 'bg-white text-[#554b3d] dark:bg-[#121a24] dark:text-gray-300'
                }`}
              >
                {category.short}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-8">
          {visibleCategories.map((category) => {
            const colors = colorClass[category.color]
            return (
              <section key={category.id} id={`works-${category.id}`} className="scroll-mt-32">
                <div className="mb-4 flex flex-col gap-2 border-b border-[#e8dfd0] pb-3 dark:border-[#202938] sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className={`mb-2 text-xs font-medium ${colors.text}`}>{category.benchmark}</p>
                    <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#231f18] dark:text-gray-100">
                      {category.label}
                    </h2>
                  </div>
                  <p className="mb-0 max-w-2xl text-sm leading-6 text-[#6b6256] dark:text-gray-400">
                    {category.thesis}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {category.works.map((work) => (
                    <WorkCard key={work.key} work={work} onRead={openOriginal} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>
      <OriginalModal work={readingWork} onClose={() => setReadingWork(null)} />
    </main>
  )
}
