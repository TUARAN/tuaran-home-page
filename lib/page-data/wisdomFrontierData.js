export const WISDOM_FRONTIER_UPDATED_AT = '2026-07-18'

export const WISDOM_CATEGORIES = [
  { id: 'natural-science', index: '01', name: '基础自然科学', short: '自然科学', color: '#315b6b', intro: '从物质、生命到人类社会的基础发现，原生诺贝尔奖体系构成现代知识版图的主干。' },
  { id: 'mathematics', index: '02', name: '数学', short: '数学', color: '#6b4f86', intro: '表彰年轻突破与终身级成就，补上诺贝尔奖没有数学奖的空白。' },
  { id: 'computing', index: '03', name: '计算机、人工智能与信息技术', short: '计算与 AI', color: '#31568c', intro: '计算机科学最高荣誉，持续标记算法、系统、网络与人工智能的关键跃迁。' },
  { id: 'engineering', index: '04', name: '工程与前沿技术发明', short: '工程技术', color: '#a05b36', intro: '关注真正改变世界运行方式、并已产生规模化影响的工程创新。' },
  { id: 'design', index: '05', name: '建筑与工业设计', short: '建筑设计', color: '#7c6542', intro: '从空间到器物，观察技术、功能、审美与公共生活如何被重新组织。' },
  { id: 'frontier-science', index: '06', name: '天文、纳米与神经科学', short: '前沿科学', color: '#4c6485', intro: '面向宇宙、微观材料与大脑三条不断拓展人类认知边界的前沿。' },
  { id: 'medicine', index: '07', name: '医学补充风向标', short: '医学', color: '#9b4658', intro: '诺贝尔奖之前的重要信号源，许多改变临床实践的发现由此率先被看见。' },
  { id: 'environment', index: '08', name: '环境、生态与水资源', short: '环境生态', color: '#397257', intro: '聚焦气候、生态系统与水安全，把科学发现连接到全球公共行动。' },
  { id: 'agriculture', index: '09', name: '农业与粮食科学', short: '农业粮食', color: '#76813a', intro: '回答如何让更多人稳定获得营养、如何让农业创新真正抵达田野。' },
  { id: 'arts', index: '10', name: '影视、舞台与音乐', short: '影视文娱', color: '#9a493e', intro: '以电影、电视、戏剧与音乐记录时代，也塑造全球共享的叙事语言。' },
  { id: 'journalism', index: '11', name: '新闻、纪实与文史创作', short: '新闻纪实', color: '#485b68', intro: '奖励公共记录、调查报道与写作，让事实和叙事共同进入历史。' },
  { id: 'humanities', index: '12', name: '哲学与人文思想', short: '人文思想', color: '#6e5268', intro: '关注观念如何解释世界，并让跨文化理解成为可累积的公共知识。' },
  { id: 'education', index: '13', name: '教育创新', short: '教育', color: '#a16d28', intro: '寻找能够扩大教育机会、改善学习质量并可持续复制的实践者。' },
  { id: 'aerospace', index: '14', name: '航天航空', short: '航天航空', color: '#3e5874', intro: '记录把人类活动边界推向天空和深空的组织者、工程师与任务。' },
  { id: 'interdisciplinary', index: '15', name: '综合跨学科大奖', short: '跨学科', color: '#745d36', intro: '跨越诺奖学科边界，长期奖励对文明、科学与技术产生深远影响的工作。' },
]

export const WISDOM_AWARDS = [
  { id: 'nobel-physics', category: 'natural-science', title: '诺贝尔物理学奖', en: 'Nobel Prize in Physics', since: '1901', scope: '物理学中的重大发现与发明', representative: '阿尔伯特·爱因斯坦', achievement: '因发现光电效应定律获 1921 年奖，为量子理论提供关键证据。', official: 'https://www.nobelprize.org/prizes/physics/' },
  { id: 'nobel-chemistry', category: 'natural-science', title: '诺贝尔化学奖', en: 'Nobel Prize in Chemistry', since: '1901', scope: '化学发现、方法与物质世界', representative: '玛丽·居里', achievement: '因发现镭和钋、分离镭并研究其性质获 1911 年奖。', official: 'https://www.nobelprize.org/prizes/chemistry/' },
  { id: 'nobel-medicine', category: 'natural-science', title: '诺贝尔生理学或医学奖', en: 'Nobel Prize in Physiology or Medicine', since: '1901', scope: '生命机制与医学突破', representative: '屠呦呦', achievement: '因发现青蒿素治疗疟疾的新疗法获 2015 年奖，挽救了全球数百万生命。', official: 'https://www.nobelprize.org/prizes/medicine/' },
  { id: 'nobel-literature', category: 'natural-science', title: '诺贝尔文学奖', en: 'Nobel Prize in Literature', since: '1901', scope: '具有持久文学价值的创作', representative: '莫言', achievement: '以融合民间故事、历史与当代经验的“幻觉现实主义”获 2012 年奖。', official: 'https://www.nobelprize.org/prizes/literature/' },
  { id: 'nobel-peace', category: 'natural-science', title: '诺贝尔和平奖', en: 'Nobel Peace Prize', since: '1901', scope: '和平、人权与国际合作', representative: '纳尔逊·曼德拉', achievement: '与德克勒克因和平结束种族隔离、奠定民主南非基础获 1993 年奖。', official: 'https://www.nobelprize.org/prizes/peace/' },
  { id: 'nobel-economics', category: 'natural-science', title: '诺贝尔经济学奖', en: 'Economic Sciences Prize', since: '1969', scope: '经济学理论、方法与实证', representative: '埃莉诺·奥斯特罗姆', achievement: '以公共资源治理研究获 2009 年奖，证明共同体能够设计可持续的自治制度。', official: 'https://www.nobelprize.org/prizes/economic-sciences/' },
  { id: 'fields', category: 'mathematics', title: '菲尔兹奖', en: 'Fields Medal', since: '1936', scope: '40 岁以下数学家的卓越成就与潜力', representative: '玛丽安·米尔扎哈尼', achievement: '因黎曼曲面及其模空间动力学研究获 2014 年奖，成为首位女性得主。', official: 'https://www.mathunion.org/imu-awards/fields-medal' },
  { id: 'abel', category: 'mathematics', title: '阿贝尔奖', en: 'Abel Prize', since: '2003', scope: '数学领域的终身级突破', representative: '安德鲁·怀尔斯', achievement: '因借助半稳定椭圆曲线的模性证明费马大定理获 2016 年奖。', official: 'https://abelprize.no/' },
  { id: 'turing', category: 'computing', title: '图灵奖', en: 'ACM A.M. Turing Award', since: '1966', scope: '计算机科学最具持久影响的贡献', representative: '杰弗里·辛顿、约书亚·本吉奥、杨立昆', achievement: '因深度神经网络的概念与工程突破共同获 2018 年奖，推动现代 AI 浪潮。', official: 'https://awards.acm.org/turing' },
  { id: 'qeprize', category: 'engineering', title: '伊丽莎白女王工程奖', en: 'Queen Elizabeth Prize for Engineering', since: '2013', scope: '给人类带来全球影响的工程创新', representative: '蒂姆·伯纳斯-李等五位互联网先驱', achievement: '首届奖表彰互联网与万维网的奠基工作，它们重塑了全球通信和知识共享。', official: 'https://qeprize.org/' },
  { id: 'millennium', category: 'engineering', title: '千禧年技术奖', en: 'Millennium Technology Prize', since: '2004', scope: '改善生活与可持续发展的技术创新', representative: '蒂姆·伯纳斯-李', achievement: '因发明万维网并坚持开放标准获首届奖，让网络成为人人可参与的公共基础设施。', official: 'https://millenniumprize.org/' },
  { id: 'pritzker', category: 'design', title: '普利兹克建筑奖', en: 'Pritzker Architecture Prize', since: '1979', scope: '对人类与建成环境作出持续贡献', representative: '扎哈·哈迪德', achievement: '以突破性的空间语言获 2004 年奖，成为首位女性得主。', official: 'https://www.pritzkerprize.com/' },
  { id: 'compasso', category: 'design', title: '金圆规奖', en: "Compasso d'Oro", since: '1954', scope: '工业设计的品质、创新与文化影响', representative: '马尔切洛·尼佐利', achievement: '为 Olivetti 设计的 Lettera 22 便携打字机获 1954 年首届奖，成为现代工业设计经典。', official: 'https://www.adi-design.org/compasso-d-oro.html' },
  { id: 'kavli', category: 'frontier-science', title: '卡夫利奖', en: 'Kavli Prize', since: '2008', scope: '天体物理、纳米科学与神经科学', representative: '约翰·奥基夫、梅-布里特·莫泽、爱德华·莫泽', achievement: '因发现大脑定位与导航系统获 2014 年神经科学奖。', official: 'https://www.kavliprize.org/' },
  { id: 'lasker', category: 'medicine', title: '拉斯克医学奖', en: 'Lasker Awards', since: '1945', scope: '基础医学、临床医学与公共服务', representative: '卡塔琳·考里科、德鲁·韦斯曼', achievement: '因核苷修饰 mRNA 技术推动新冠疫苗发展获 2021 年临床医学奖。', official: 'https://laskerfoundation.org/awards/' },
  { id: 'volvo-environment', category: 'environment', title: '沃尔沃环境奖', en: 'Volvo Environment Prize', since: '1990', scope: '环境与可持续发展的科学贡献', representative: '苏珊·所罗门', achievement: '以极地臭氧化学研究解释南极臭氧洞机制，并推动全球环境行动。', official: 'https://www.environment-prize.com/' },
  { id: 'stockholm-water', category: 'environment', title: '斯德哥尔摩水奖', en: 'Stockholm Water Prize', since: '1991', scope: '水资源保护、研究与治理', representative: '王加世·马塔伊', achievement: '以绿带运动连接植树、社区赋权与水土保护，获 2015 年奖。', official: 'https://siwi.org/stockholm-water-prize/' },
  { id: 'world-food', category: 'agriculture', title: '世界粮食奖', en: 'World Food Prize', since: '1987', scope: '提升全球粮食质量、数量与可获得性', representative: '袁隆平', achievement: '因杂交水稻研究显著提高粮食产量，与蒙蒂·琼斯共同获 2004 年奖。', official: 'https://www.worldfoodprize.org/' },
  { id: 'oscars', category: 'arts', title: '奥斯卡金像奖', en: 'Academy Awards', since: '1929', scope: '电影艺术与技术成就', representative: '奉俊昊', achievement: '《寄生虫》在 2020 年成为首部获得最佳影片的非英语电影，并获得最佳导演等荣誉。', official: 'https://www.oscars.org/' },
  { id: 'cannes', category: 'arts', title: '戛纳金棕榈', en: "Palme d'Or", since: '1955', scope: '戛纳电影节主竞赛最高奖', representative: '奉俊昊', achievement: '《寄生虫》获 2019 年金棕榈，以类型叙事呈现阶层、空间与家庭困境。', official: 'https://www.festival-cannes.com/en/' },
  { id: 'venice', category: 'arts', title: '威尼斯金狮奖', en: 'Golden Lion', since: '1949', scope: '威尼斯电影节主竞赛最高奖', representative: '李安', achievement: '《断背山》获 2005 年金狮奖，以克制影像拓展主流电影对亲密关系的表达。', official: 'https://www.labiennale.org/en/cinema' },
  { id: 'berlin', category: 'arts', title: '柏林金熊奖', en: 'Golden Bear', since: '1951', scope: '柏林电影节主竞赛最高奖', representative: '张艺谋', achievement: '《红高粱》获 1988 年金熊奖，成为中国电影走向国际的重要坐标。', official: 'https://www.berlinale.de/en/home.html' },
  { id: 'emmy', category: 'arts', title: '艾美奖', en: 'Emmy Awards', since: '1949', scope: '电视与剧集的创作和制作成就', representative: '菲比·沃勒-布里奇', achievement: '《伦敦生活》在 2019 年以精确写作、表演和打破第四面墙的叙事赢得多项喜剧类大奖。', official: 'https://www.televisionacademy.com/awards' },
  { id: 'tony', category: 'arts', title: '托尼奖', en: 'Tony Awards', since: '1947', scope: '百老汇戏剧与音乐剧成就', representative: '林-曼努尔·米兰达', achievement: '《汉密尔顿》以嘻哈重述美国建国史，在 2016 年获得包括最佳音乐剧在内的 11 项奖。', official: 'https://www.tonyawards.com/' },
  { id: 'grammy', category: 'arts', title: '格莱美奖', en: 'Grammy Awards', since: '1959', scope: '录音艺术、创作、表演与制作', representative: '碧昂丝', achievement: '以跨越 R&B、流行、舞曲与乡村的持续创作，成为格莱美历史上最具代表性的获奖音乐人之一。', official: 'https://www.grammy.com/awards' },
  { id: 'pulitzer', category: 'journalism', title: '普利策奖', en: 'Pulitzer Prizes', since: '1917', scope: '新闻、文学、戏剧与音乐', representative: '欧内斯特·海明威', achievement: '《老人与海》获 1953 年小说奖，以极简语言书写尊严、失败与人的韧性。', official: 'https://www.pulitzer.org/' },
  { id: 'berggruen', category: 'humanities', title: '伯格鲁恩哲学与文化奖', en: 'Berggruen Prize', since: '2016', scope: '塑造人类自我理解的思想贡献', representative: '玛莎·努斯鲍姆', achievement: '因能力方法、情感哲学与全球正义研究获 2018 年奖，把哲学连接到真实公共生活。', official: 'https://www.berggruen.org/prize/' },
  { id: 'stanislas-julien', category: 'humanities', title: '儒莲奖', en: 'Prix Stanislas Julien', since: '1875', scope: '汉学研究与重要著作', representative: '斯坦尼斯拉斯·儒莲所代表的翻译传统', achievement: '以系统翻译中国文学、哲学与历史典籍奠定法国专业汉学基础；奖项持续追踪国际汉学成果。', official: 'https://aibl.fr/prix-et-fondations/' },
  { id: 'wise', category: 'education', title: 'WISE 世界教育创新奖', en: 'WISE Prize for Education', since: '2011', scope: '具有世界级影响的教育实践', representative: '萨基娜·雅库比', achievement: '因创办阿富汗学习研究所、长期扩大女性与弱势群体教育机会获 2015 年奖。', official: 'https://www.wise-qatar.org/wise-prize-for-education/' },
  { id: 'goddard', category: 'aerospace', title: '罗伯特·戈达德纪念奖', en: 'Robert H. Goddard Memorial Trophy', since: '1958', scope: '对美国航天事业具有重大影响的领导与成就', representative: '以任务团队与航天领导者为主要坐标', achievement: '它强调的不只是单项发明，也包括把复杂科学、工程和组织协作送入太空的系统能力。', official: 'https://www.spaceclub.org/awards/' },
  { id: 'shaw', category: 'interdisciplinary', title: '邵逸夫奖', en: 'Shaw Prize', since: '2004', scope: '天文学、生命科学与医学、数学', representative: '丘成桐', achievement: '因数学物理、几何分析与卡拉比–丘流形等深远贡献获 2023 年数学科学奖。', official: 'https://www.shawprize.org/' },
  { id: 'kyoto', category: 'interdisciplinary', title: '京都奖', en: 'Kyoto Prize', since: '1985', scope: '先进技术、基础科学、思想与艺术', representative: '高德纳', achievement: '因算法分析、程序设计与《计算机程序设计艺术》获 1996 年先进技术奖。', official: 'https://www.kyotoprize.org/en/' },
  { id: 'breakthrough', category: 'interdisciplinary', title: '科学突破奖', en: 'Breakthrough Prize', since: '2012', scope: '基础物理、生命科学与数学', representative: '德米斯·哈萨比斯、约翰·江珀', achievement: '因 AlphaFold 预测蛋白质结构的深度学习方法获 2023 年生命科学突破奖。', official: 'https://breakthroughprize.org/' },
]

export const WISDOM_LEARNING_PATHS = [
  { level: '入门', time: '30 分钟', title: '先看全景，而不是背名单', description: '从 15 个领域浏览奖项卡片，理解不同学科如何定义“重要贡献”。', action: '浏览全部奖项', href: '#atlas' },
  { level: '进阶', time: '每周 1 人', title: '沿着人物回到原始问题', description: '任选一位代表人物，追问他解决了什么、用了什么方法、改变了谁的生活。', action: '查看人物坐标', href: '#people' },
  { level: '长期', time: '持续更新', title: '建立自己的智慧追踪清单', description: '关注新一届获奖者、获奖理由、原始论文或作品，以及十年后的真实影响。', action: '查看追踪方法', href: '#tracking' },
]

export const WISDOM_TRACKING = [
  { cadence: '每年', title: '获奖名单与官方理由', description: '同步各奖项年度结果，保留官方原文入口，并把新得主接入人物档案。' },
  { cadence: '每月', title: '一位人物 / 一项成果', description: '从“获奖”继续向下追：问题、方法、关键作品、争议、影响与延伸学习。' },
  { cadence: '持续', title: '线索与更正', description: '接受读者补充遗漏奖项、重要人物、官方来源和事实更正，让目录保持可维护。' },
]
