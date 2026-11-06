export const RESOURCE_BOOKS = [
  { href: '/resources/big-interaction-whitepaper', title: '大互动理论', kind: '实践读本', ownership: 'self', source: 'TUARAN', description: '从主动交流、认真倾听到接收反馈与守住边界。' },
  { href: '/resources/cz-memoirs', title: '币安人生', kind: '逐章阅读', ownership: 'external', source: '赵长鹏', sourceLabel: '原作者', cover: '/images/cz-memoirs/cover.jpg', description: '赵长鹏自传中文章节，支持前后章切换与阅读字号调整。' },
  { href: '/resources/jianguo-fanglye', title: '建国方略', kind: '历史原著', ownership: 'external', source: '孙文', sourceLabel: '原作者', description: '孙文学说、实业计划与民权初步的简体全文。' },
  { href: '/resources/ethereum-whitepaper', title: '以太坊白皮书', kind: '协议原文', ownership: 'external', source: 'Vitalik Buterin', sourceLabel: '原作者', description: '2014 年以太坊白皮书中文全文与原始版本资料。' },
  { href: '/resources/workbuddy-opc-whitepaper', title: 'WorkBuddy OPC 白皮书', kind: '技术白皮书', ownership: 'external', source: 'WorkBuddy', sourceLabel: '来源机构', description: 'AI 时代一人公司的商业模式与工作流。' },
  { href: '/resources/workbuddy-smart-hardware-whitepaper', title: '智能硬件接入 WorkBuddy 白皮书', kind: '技术白皮书', ownership: 'external', source: 'WorkBuddy', sourceLabel: '来源机构', description: '硬件接入、授权、API 调用与合作模式。' },
  { href: '/resources/x-reply-clipboard-extension/docs', title: 'X 高频互动助手文档中心', kind: '使用手册', ownership: 'self', source: 'TUARAN', description: '按篇章查阅安装、互动、定时发帖和常见问题。' },
  { href: '/tools/syncblog-publisher/docs', title: 'AI 分发大师文档中心', kind: '使用手册', ownership: 'self', source: 'TUARAN', description: '按目录查阅安装、授权、分发流程和排障。' },
]

export const RESOURCE_BOOK_HREFS = new Set(RESOURCE_BOOKS.map((book) => book.href))
export const RESOURCE_BOOK_BY_HREF = new Map(RESOURCE_BOOKS.map((book) => [book.href, book]))
