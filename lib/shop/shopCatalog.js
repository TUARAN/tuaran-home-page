/**
 * 甄选小店商品目录。
 *
 * 商品收敛在这里，新增商品只需要追加一条记录：
 * - status: 'available'（已开放，可点击跳转）| 'coming'（即将上线，占位展示）
 * - href 为 null 时页面渲染为占位卡，不输出链接。
 * 本文件会被站点页面与测试同时导入，保持纯数据、无副作用。
 */

export const SHOP_PATH = '/shop'

export const SHOP_ITEMS = [
  {
    id: 'gptplus',
    title: 'ChatGPT Plus / Pro 代充',
    titleEn: 'ChatGPT Plus / Pro recharge',
    desc: '套餐选择、订单进度查询与售后支持，适合个人订阅与企业采购。',
    descEn: 'Plan selection, order tracking and after-sales support for individuals and teams.',
    href: 'https://gptplus.2aran.com/',
    status: 'available',
    tags: ['ChatGPT', 'Plus / Pro', '代充'],
  },
  {
    id: 'claude-relay',
    title: 'Claude 中转',
    titleEn: 'Claude relay',
    desc: 'Claude API 中转服务，购买入口上线后在这里开放。',
    descEn: 'Claude API relay service; the purchase link will open here.',
    href: null,
    status: 'coming',
    tags: ['Claude', 'API', '中转'],
  },
]

export function listShopItems() {
  return SHOP_ITEMS
}

export function findShopItem(id) {
  return SHOP_ITEMS.find((item) => item.id === id)
}
