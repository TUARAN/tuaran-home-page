/**
 * 公开巨鲸地址目录与链上读数辅助。
 *
 * 目录只收录浏览器 / Arkham / 官方披露里带公开标签的地址。
 * 标签是公开归属，不是密钥控制权证明。交易所冷钱包是客户托管。
 */

export const BTC_UNIT = 1e8
export const DEFAULT_CHANGE_WINDOW_SEC = 24 * 60 * 60
export const MEMPOOL_TX_PAGE = 25

export const CATEGORY_META = {
  exchange: { label: '交易所托管', color: '#6b85a6' },
  government: { label: '政府扣押', color: '#86707a' },
  company: { label: '公司储备', color: '#838073' },
  individual: { label: '具名个人', color: '#7c917c' },
  hack: { label: '失窃 / 休眠', color: '#a05a3c' },
}

export const FOLK_STANCE_META = {
  named: { label: '公开具名', color: '#7c917c' },
  rumor: { label: '传闻', color: '#838073' },
  misread: { label: '常见误传', color: '#a05a3c' },
  seized: { label: '扣押来源', color: '#86707a' },
  institution: { label: '机构主体', color: '#6b85a6' },
}

export const SATOSHI_CLUSTER_NOTE =
  'Arkham 把 Patoshi 出块模式识别出的约 2.2 万个地址合计约 109.6 万 BTC 归到中本聪实体。这些地址多数各持 50 BTC 出块奖励，不会出现在单地址富豪榜头部。创世地址是公众最熟的那一个；1Feex、12ib7 是富豪榜上最常被写成中本聪的大额休眠地址。'

export const CHAIN_META = {
  bitcoin: { label: 'Bitcoin', asset: 'BTC', explorer: (address) => `https://mempool.space/address/${address}` },
  ethereum: { label: 'Ethereum', asset: 'ETH', explorer: (address) => `https://etherscan.io/address/${address}` },
}

export const DATA_CAPABILITIES = [
  {
    id: 'current-balance',
    need: '当前余额',
    free: '可以。Bitcoin 用 mempool.space 地址接口，Ethereum 用公共 JSON-RPC eth_getBalance。',
    paid: 'Arkham / Nansen 把同一主体的多地址聚合成实体余额。',
  },
  {
    id: 'usd-value',
    need: '折合法币',
    free: '可以。用公开行情接口把原生数量乘以现价。',
    paid: '专业终端提供盘中价、净值和多币种组合估值。',
  },
  {
    id: 'change-24h',
    need: '近 24 小时变动',
    free: '可以估算。从最近一页交易按时间加总流入流出；冷钱包通常完整，热钱包可能被截断。',
    paid: 'Whale Alert、Arkham、Bitquery 按完整流水和实体维度给出入金。',
  },
  {
    id: 'daily-series',
    need: '每天余额时间序列',
    free: '没有稳定的免费批量接口。Etherscan 历史余额、Bitquery 按日余额、Glassnode 都要密钥或付费档。',
    paid: '按日或按块取历史余额，适合回测和审计。',
  },
  {
    id: 'labels',
    need: '谁拥有这个地址',
    free: '没有权威免费名单 API。公开标签来自 BitInfoCharts、Etherscan Name Tag、Arkham 研究报告和当事人披露。',
    paid: 'Bitquery Labels、Arkham Intel 提供可查询的标签库。',
  },
]

export const WHALE_WALLETS = [
  {
    id: 'binance-cold-1',
    nameZh: 'Binance 冷钱包 1',
    nameEn: 'Binance Cold 1',
    chain: 'bitcoin',
    address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
    category: 'exchange',
    verified: true,
    latestSignal: '2026-09 BitInfoCharts 仍标为最大单地址，约 24.9 万 BTC。',
    note: '币安客户资产冷存储，不是交易所自有金库。',
    folk: {
      stance: 'misread',
      label: '赵长鹏金库（误读）',
      person: '赵长鹏',
      detail: '中文圈常把币安冷钱包余额当成赵长鹏个人仓。公开标签是交易所客户托管。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'binance-cold-2',
    nameZh: 'Binance 冷钱包 2',
    nameEn: 'Binance Cold 2',
    chain: 'bitcoin',
    address: '3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6',
    category: 'exchange',
    verified: true,
    latestSignal: '2026-09 BitInfoCharts 记录近 30 日仍有大额转入。',
    note: '币安另一只公开冷钱包，余额会随充提调度变化。',
    folk: {
      stance: 'misread',
      label: '赵长鹏金库（误读）',
      person: '赵长鹏',
      detail: '余额随充提调度变化。公开标签仍是币安客户冷存储。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'robinhood-btc',
    nameZh: 'Robinhood 冷钱包',
    nameEn: 'Robinhood Cold',
    chain: 'bitcoin',
    address: 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
    category: 'exchange',
    verified: true,
    latestSignal: '2026-09 单地址约 14.1 万 BTC，公开标签为 Robinhood 冷钱包。',
    note: '经纪商客户托管地址。',
    folk: {
      stance: 'institution',
      label: 'Robinhood 客户托管',
      person: '',
      detail: '美国零售经纪商的比特币托管地址，对应客户资产，不是单一名人钱包。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'bitfinex-cold',
    nameZh: 'Bitfinex 冷钱包',
    nameEn: 'Bitfinex Cold',
    chain: 'bitcoin',
    address: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97',
    category: 'exchange',
    verified: true,
    latestSignal: '2019 年起使用的 Bitfinex 冷存储，约 13.0 万 BTC。',
    note: '交易所客户托管。',
    folk: {
      stance: 'institution',
      label: 'Bitfinex 客户托管',
      person: '',
      detail: 'Bitfinex 长期冷存储。与 Tether 同属 iFinex 体系，仍是客户托管地址。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'tether-btc',
    nameZh: 'Tether BTC 储备',
    nameEn: 'Tether BTC Reserve',
    chain: 'bitcoin',
    address: 'bc1qjasf9z3h7w3jspkhtgatgpyvvzgpa2wwd2lr0eh5tx44reyn2k7sfc27a4',
    category: 'company',
    verified: true,
    latestSignal: 'Tether CEO Paolo Ardoino 公开确认这是公司主要比特币持仓地址。',
    note: '稳定币发行商的储备地址，与 Bitfinex 同属 iFinex 体系。',
    folk: {
      stance: 'named',
      label: 'Paolo Ardoino 确认的 Tether 储备',
      person: 'Paolo Ardoino',
      detail: 'Tether CEO 公开点名这是公司主要比特币储备地址，属于发行商库存，不是个人钱包。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/bitcoin/address/bc1qjasf9z3h7w3jspkhtgatgpyvvzgpa2wwd2lr0eh5tx44reyn2k7sfc27a4' },
      { label: 'WEEX 对 Ardoino 披露的报道', href: 'https://www.weex.com/news/detail/tether-ceo-reveals-companys-main-bitcoin-holding-address-160646' },
    ],
  },
  {
    id: 'us-gov-bitfinex',
    nameZh: '美国政府 · Bitfinex 追回',
    nameEn: 'US Gov Bitfinex Recovery',
    chain: 'bitcoin',
    address: 'bc1qazcm763858nkj2dj986etajv6wquslv8uxwczt',
    category: 'government',
    verified: true,
    latestSignal: '2022 年起归集 2016 年 Bitfinex 被盗追回币，公开标签为 FBI / 美国政府。',
    note: '执法扣押地址。2026 年 7 月美国政府曾向 Coinbase Prime 划转部分扣押资产。',
    folk: {
      stance: 'seized',
      label: '美国政府 / FBI 追回',
      person: '',
      detail: '2016 年 Bitfinex 被盗后由美国执法部门追回并归集。公众把它看成美国战略比特币储备的一部分。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'mtgox-hack',
    nameZh: 'Mt. Gox 被盗地址',
    nameEn: 'Mt. Gox Hack',
    chain: 'bitcoin',
    address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF',
    category: 'hack',
    verified: true,
    latestSignal: '2011 年以来几乎只进不出，仍在公开富豪榜前列。',
    note: '长期休眠的被盗币地址，控制人未公开。',
    folk: {
      stance: 'misread',
      label: '中本聪（误传）',
      person: '中本聪',
      detail: '中文圈富豪榜常把这只 2011 年休眠地址当成中本聪仓。BitInfoCharts / WizSec 标签是 Mt.Gox 被盗接收地址。Craig Wright 曾主张所有权，未被采信。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'WizSec 2011 盗窃复盘', href: 'https://blog.wizsec.jp/2020/06/mtgox-march-2011-theft.html' },
    ],
  },
  {
    id: 'early-12ib7',
    nameZh: '早期地址 12ib7',
    nameEn: 'Early Whale 12ib7',
    chain: 'bitcoin',
    address: '12ib7dApVFvg82TXKycWBNpN8kFyiAN1dr',
    category: 'hack',
    verified: false,
    latestSignal: 'BitInfoCharts 标为第 967 号地址；2010 年 7 月后未再转出，约 3.1 万 BTC。',
    note: '2010 年早期巨鲸，控制人未公开。',
    folk: {
      stance: 'rumor',
      label: '中本聪传闻 / Craig Wright 主张',
      person: '中本聪',
      detail: '中文圈和英文鲸观察常把它说成中本聪相关仓。Coinbase 的 Conor Grogan 指出曾有 Patoshi 地址向这里转入。Craig Wright / Tulip Trading 主张所有权并称密钥被盗，未被法院采信。公开控制人仍未知。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Blockworks 对 12ib7 的复盘', href: 'https://blockworks.co/news/bitcoin-whale-watching-mystery-12ib7-wallet' },
    ],
  },
  {
    id: 'us-gov-silkroad',
    nameZh: '美国政府 · 丝绸之路',
    nameEn: 'US Gov Silk Road',
    chain: 'bitcoin',
    address: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6',
    category: 'government',
    verified: true,
    latestSignal: '公开标签为 FBI 扣押的 Silk Road 比特币。',
    note: '执法扣押地址，余额随拍卖或战略储备政策变化。',
    folk: {
      stance: 'seized',
      label: '罗斯·乌布利希特 / 丝绸之路',
      person: '罗斯·乌布利希特',
      detail: '公众把它和丝绸之路站长罗斯·乌布利希特联系起来。链上现状是美国政府扣押地址，余额会随拍卖或战略储备政策变化。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'binance-btcb',
    nameZh: 'Binance BTCB 储备',
    nameEn: 'Binance BTCB Reserve',
    chain: 'bitcoin',
    address: '3LYJfcfHPXYJreMsASk2jkn69LWEYKzexb',
    category: 'exchange',
    verified: true,
    latestSignal: 'BitInfoCharts 标为 Binance BTCB 储备，用于 BNB Chain 上的 BTC 锚定。',
    note: '跨链锚定储备，对应 BNB Chain 上的 BTCB。',
    folk: {
      stance: 'institution',
      label: '币安 BTCB 锚定储备',
      person: '赵长鹏',
      detail: '对应 BNB Chain 上的 BTCB，属于跨链锚定库存。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
    ],
  },
  {
    id: 'okx-btc',
    nameZh: 'OKX 冷钱包',
    nameEn: 'OKX Cold',
    chain: 'bitcoin',
    address: '3MgEAFWu1HKSnZ5ZsC8qf61ZW18xrP5pgd',
    category: 'exchange',
    verified: true,
    latestSignal: 'BitInfoCharts 标为 OKEx / OKX。',
    note: '交易所客户托管。',
    folk: {
      stance: 'misread',
      label: '徐明星金库（误读）',
      person: '徐明星',
      detail: '中文圈常把 OKX 冷钱包当成徐明星个人仓。公开标签是交易所客户托管。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
    ],
  },
  {
    id: 'upbit-mr100',
    nameZh: 'Upbit 冷钱包（Mr.100）',
    nameEn: 'Upbit Cold / Mr.100',
    chain: 'bitcoin',
    address: '1Ay8vMC7R1UbyCCZRVULMV7iQpHSAbguJP',
    category: 'exchange',
    verified: true,
    latestSignal: 'BitInfoCharts 绰号 Mr.100；Arkham / OXT 标为 Upbit 冷钱包，约 7.4 万 BTC。',
    note: '韩国交易所客户托管。绰号来自反复转入约 100 BTC 的节奏。',
    folk: {
      stance: 'misread',
      label: '神秘巨鲸 / 小国（误传）',
      person: '',
      detail: '2023–2024 年因每次大约转入 100 BTC，被猜成神秘个人、基金或小国储备。Arkham 根据与 Upbit 热钱包的往来，把它标成 Upbit 冷存储。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 对 Mr.100 的说明', href: 'https://news.bitcoin.com/while-some-think-bitcoins-12th-largest-wallet-hides-a-nation-state-onchain-data-shows-an-exchange/' },
    ],
  },
  {
    id: 'uk-gov',
    nameZh: '英国政府扣押',
    nameEn: 'UK Government',
    chain: 'bitcoin',
    address: 'bc1q7ydrtdn8z62xhslqyqtyt38mm4e2c4h3mxjkug',
    category: 'government',
    verified: true,
    latestSignal: '公开标签为英国政府扣押地址，约 3.6 万 BTC。',
    note: '与 Jian Wen / Zhimin Qian 案件相关的扣押币。',
    folk: {
      stance: 'seized',
      label: '钱志敏 / 文俭案',
      person: '钱志敏',
      detail: '英国警方从钱志敏、文俭相关案件中扣押。公众常把它说成英国政府的比特币储备。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
      { label: 'Arkham 2026 持仓研究', href: 'https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026' },
    ],
  },
  {
    id: 'binance-cold-3',
    nameZh: 'Binance 冷钱包 3',
    nameEn: 'Binance Cold 3',
    chain: 'bitcoin',
    address: '3LQUu4v9z6KNch71j7kbj8GPeAGUo1FW6a',
    category: 'exchange',
    verified: true,
    latestSignal: 'BitInfoCharts 标为 Binance 冷钱包，近年只进不出。',
    note: '币安客户资产冷存储。',
    folk: {
      stance: 'misread',
      label: '赵长鹏金库（误读）',
      person: '赵长鹏',
      detail: '近年只进不出，更容易被看成个人囤币地址。公开标签仍是币安冷存储。',
    },
    sources: [
      { label: 'BitInfoCharts', href: 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html' },
    ],
  },
  {
    id: 'binance-7-eth',
    nameZh: 'Binance 7',
    nameEn: 'Binance 7',
    chain: 'ethereum',
    address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
    category: 'exchange',
    verified: true,
    latestSignal: 'Etherscan Name Tag：Binance 7，ETH 富豪榜前列。',
    note: '币安以太坊托管地址。',
    folk: {
      stance: 'misread',
      label: '赵长鹏金库（误读）',
      person: '赵长鹏',
      detail: 'Etherscan 标签是 Binance 7。ETH 富豪榜前列多数是交易所托管。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8' },
      { label: 'Etherscan 富豪榜', href: 'https://etherscan.io/accounts' },
    ],
  },
  {
    id: 'robinhood-eth',
    nameZh: 'Robinhood ETH',
    nameEn: 'Robinhood ETH',
    chain: 'ethereum',
    address: '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489',
    category: 'exchange',
    verified: true,
    latestSignal: 'Etherscan Name Tag：Robinhood，约 122 万 ETH。',
    note: '经纪商以太坊托管地址。',
    folk: {
      stance: 'institution',
      label: 'Robinhood 客户托管',
      person: '',
      detail: '经纪商以太坊托管。单地址余额很大，对应客户资产。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489' },
      { label: 'Etherscan 富豪榜', href: 'https://etherscan.io/accounts' },
    ],
  },
  {
    id: 'binance-hot-20',
    nameZh: 'Binance 热钱包 20',
    nameEn: 'Binance Hot Wallet 20',
    chain: 'ethereum',
    address: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
    category: 'exchange',
    verified: true,
    latestSignal: 'Etherscan Name Tag：Binance: Hot Wallet 20，交易频繁。',
    note: '热钱包进出金很快，近 24 小时变动更容易被交易分页截断。',
    folk: {
      stance: 'institution',
      label: '币安热钱包',
      person: '赵长鹏',
      detail: '进出金很快的热钱包。公众刷到大额转账时，常当成有人在出货。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0xF977814e90dA44bFA03b6295A0616a897441aceC' },
      { label: 'Etherscan 富豪榜', href: 'https://etherscan.io/accounts' },
    ],
  },
  {
    id: 'bitfinex-2-eth',
    nameZh: 'Bitfinex 2',
    nameEn: 'Bitfinex 2',
    chain: 'ethereum',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    category: 'exchange',
    verified: true,
    latestSignal: 'Etherscan Name Tag：Bitfinex 2。',
    note: 'Bitfinex 长期使用的以太坊地址。',
    folk: {
      stance: 'institution',
      label: 'Bitfinex 托管',
      person: '',
      detail: 'Bitfinex 长期使用的以太坊地址，属于交易所运营地址。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
      { label: 'Etherscan 富豪榜', href: 'https://etherscan.io/accounts' },
    ],
  },
  {
    id: 'vitalik',
    nameZh: 'vitalik.eth',
    nameEn: 'Vitalik Buterin',
    chain: 'ethereum',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    category: 'individual',
    verified: true,
    latestSignal: 'ENS vitalik.eth 指向该地址；持仓会随捐赠和转账变化，不是 ETH 富豪榜头部。',
    note: '具名个人地址。余额远小于交易所托管地址。',
    folk: {
      stance: 'named',
      label: 'Vitalik Buterin',
      person: 'Vitalik Buterin',
      detail: 'vitalik.eth 指向这里，是少数能对上真人的巨鲸地址。余额会随捐赠和转账变化，远小于交易所托管地址。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
    ],
  },
  {
    id: 'satoshi-genesis',
    nameZh: '创世块地址',
    nameEn: 'Genesis Block',
    chain: 'bitcoin',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    category: 'individual',
    verified: true,
    latestSignal: '比特币第一笔 coinbase 的公钥哈希地址。创世块奖励本身无法花费；后来有人转入纪念币，余额约数十到一百枚量级。',
    note: '公众最熟悉的中本聪象征地址。中本聪实体持仓来自约 2.2 万个 Patoshi 出块地址的合计。',
    folk: {
      stance: 'named',
      label: '中本聪（创世地址）',
      person: '中本聪',
      detail: '公众把创世地址当成中本聪钱包。它确实对应中本聪挖出的第一块，但单地址余额很小。Arkham 统计的约 109.6 万 BTC 中本聪实体，来自 Patoshi 模式识别出的约 2.2 万个早期出块地址。',
    },
    sources: [
      { label: 'mempool.space', href: 'https://mempool.space/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
      { label: 'Arkham 中本聪地址研究', href: 'https://info.arkm.com/research/satoshi-nakamoto-owns-22-000-addresses' },
    ],
  },
  {
    id: 'ethereum-foundation',
    nameZh: '以太坊基金会',
    nameEn: 'Ethereum Foundation',
    chain: 'ethereum',
    address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    category: 'company',
    verified: true,
    latestSignal: 'Etherscan 长期标签为 Ethereum Foundation 开发钱包。',
    note: '基金会运营地址之一，不是全部金库。',
    folk: {
      stance: 'institution',
      label: '以太坊基金会',
      person: '',
      detail: 'Etherscan 长期标为基金会开发钱包。基金会金库分散在多个地址，这一只是运营地址之一。',
    },
    sources: [
      { label: 'Etherscan', href: 'https://etherscan.io/address/0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe' },
    ],
  },
]

export function whaleAsset(wallet) {
  return CHAIN_META[wallet.chain]?.asset || ''
}

export function whaleExplorerUrl(wallet) {
  return CHAIN_META[wallet.chain]?.explorer(wallet.address) || ''
}

export function parseMempoolAddress(payload) {
  const chain = payload?.chain_stats || {}
  const mempool = payload?.mempool_stats || {}
  const funded = Number(chain.funded_txo_sum || 0) + Number(mempool.funded_txo_sum || 0)
  const spent = Number(chain.spent_txo_sum || 0) + Number(mempool.spent_txo_sum || 0)
  return {
    amount: (funded - spent) / BTC_UNIT,
    txCount: Number(chain.tx_count || 0) + Number(mempool.tx_count || 0),
  }
}

export function weiHexToEth(hex) {
  const wei = BigInt(hex)
  const whole = wei / 1000000000000000000n
  const frac = wei % 1000000000000000000n
  return Number(whole) + Number(frac) / 1e18
}

function txTimeSec(tx, fallbackSec = 0) {
  if (tx?.status?.block_time) return Number(tx.status.block_time)
  if (tx?.status && tx.status.confirmed === false) return fallbackSec
  return 0
}

export function netFlowFromMempoolTxs(address, txs, sinceSec, nowSec = Math.floor(Date.now() / 1000)) {
  const list = Array.isArray(txs) ? txs : []
  let inflow = 0
  let outflow = 0
  let txInWindow = 0
  let oldestFetched = Infinity

  for (const tx of list) {
    const time = txTimeSec(tx, nowSec)
    if (time) oldestFetched = Math.min(oldestFetched, time)
    if (!time || time < sinceSec) continue
    txInWindow += 1
    for (const output of tx.vout || []) {
      if (output.scriptpubkey_address === address) inflow += Number(output.value || 0)
    }
    for (const input of tx.vin || []) {
      if (input.prevout?.scriptpubkey_address === address) outflow += Number(input.prevout.value || 0)
    }
  }

  const coveredWindow = list.length === 0 || oldestFetched <= sinceSec
  return {
    changeNative: (inflow - outflow) / BTC_UNIT,
    inflowNative: inflow / BTC_UNIT,
    outflowNative: outflow / BTC_UNIT,
    txInWindow,
    complete: coveredWindow,
  }
}

export function dailyNetFromMempoolTxs(address, txs, days = 7, nowSec = Math.floor(Date.now() / 1000)) {
  const buckets = []
  const today = Math.floor(nowSec / 86400)
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    buckets.push({ day: today - offset, net: 0, txCount: 0 })
  }
  const index = new Map(buckets.map((bucket, i) => [bucket.day, i]))

  for (const tx of txs || []) {
    const time = txTimeSec(tx, nowSec)
    if (!time) continue
    const day = Math.floor(time / 86400)
    const slot = index.get(day)
    if (slot == null) continue
    let inflow = 0
    let outflow = 0
    for (const output of tx.vout || []) {
      if (output.scriptpubkey_address === address) inflow += Number(output.value || 0)
    }
    for (const input of tx.vin || []) {
      if (input.prevout?.scriptpubkey_address === address) outflow += Number(input.prevout.value || 0)
    }
    buckets[slot].net += (inflow - outflow) / BTC_UNIT
    buckets[slot].txCount += 1
  }

  return buckets.map((bucket) => ({
    date: new Date(bucket.day * 86400 * 1000).toISOString().slice(0, 10),
    net: bucket.net,
    txCount: bucket.txCount,
  }))
}

export function attachLiveSnapshot(wallets, liveById = {}, prices = {}) {
  return wallets.map((wallet) => {
    const live = liveById[wallet.id] || {}
    const asset = whaleAsset(wallet)
    const price = Number(prices[asset] || 0)
    const amount = live.amount == null ? null : Number(live.amount)
    const changeNative = live.changeNative == null ? null : Number(live.changeNative)
    const usd = amount != null && price ? amount * price : null
    const changeUsd = changeNative != null && price ? changeNative * price : null
    const changePct = amount && amount !== 0 && changeNative != null ? (changeNative / amount) * 100 : changeNative === 0 ? 0 : null
    return {
      ...wallet,
      asset,
      explorerUrl: whaleExplorerUrl(wallet),
      amount,
      usd,
      price,
      txCount: live.txCount ?? null,
      changeNative,
      changeUsd,
      changePct,
      changeComplete: live.changeComplete ?? null,
      changeWindow: live.changeWindow || '24h',
      daily: Array.isArray(live.daily) ? live.daily : [],
      liveError: live.error || '',
      liveStatus: amount == null ? (live.error ? 'error' : 'pending') : 'ok',
    }
  })
}

export function formatUsd(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}k`
  return `${sign}$${abs.toFixed(digits)}`
}

export function formatNative(value, asset, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1000) return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${asset}`
  if (abs >= 1) return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: digits })} ${asset}`
  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${asset}`
}

export function formatPct(value) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function shortAddress(address) {
  if (!address) return ''
  if (address.length <= 18) return address
  return `${address.slice(0, 8)}…${address.slice(-6)}`
}

export function folkHaystack(wallet) {
  const folk = wallet?.folk || {}
  return `${folk.label || ''} ${folk.person || ''} ${folk.detail || ''}`.trim()
}

export function isBitcoinAddress(address) {
  return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{24,87}$/.test(address)
}

export function isEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
