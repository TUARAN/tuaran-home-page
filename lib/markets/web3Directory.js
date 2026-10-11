/**
 * Web3 入口页的稳定分类与外部工具清单。
 * 这里只存导航元数据，市场数字和排名不落盘，避免把快照写成长期事实。
 */

export const WEB3_CATEGORY_META = [
  {
    id: 'cex',
    label: 'CEX',
    eyebrow: '中心化交易',
    description: '平台托管资产并维护订单簿，常用于法币入金、现货交易与机构服务。',
    checks: ['运营地区与合规资质', '提币是否可用', '储备与托管风险'],
  },
  {
    id: 'dex',
    label: 'DEX',
    eyebrow: '链上交易',
    description: '通过智能合约或链上订单簿交易，用户自行管理钱包、授权与签名。',
    checks: ['合约地址与官网', '滑点与流动性', '授权、MEV 与跨链风险'],
  },
  {
    id: 'defi',
    label: 'DeFi',
    eyebrow: '开放金融协议',
    description: '包括借贷、质押、稳定币、衍生品、收益聚合与链上保险。',
    checks: ['TVL 口径与资产构成', '清算与预言机机制', '审计不等于零风险'],
  },
  {
    id: 'stablecoins',
    label: '稳定币',
    eyebrow: '链上计价与结算',
    description: '按储备资产、超额抵押或算法机制维持目标价格，不同机制的风险不同。',
    checks: ['储备披露与赎回条件', '脱锚历史', '发行方与合约权限'],
  },
  {
    id: 'chains',
    label: 'L1 / L2',
    eyebrow: '公链与扩容',
    description: '关注执行、结算、数据可用性和跨链边界，不只比较 TPS 与费用。',
    checks: ['验证与排序机制', '数据可用性', '桥、升级与管理权限'],
  },
  {
    id: 'wallets',
    label: '钱包与安全',
    eyebrow: '自托管入口',
    description: '包括浏览器钱包、硬件钱包、多签、账户抽象与授权管理。',
    checks: ['私钥与助记词备份', '签名内容与域名', '大额资产的隔离与多签'],
  },
  {
    id: 'data',
    label: '数据与查询',
    eyebrow: '链上可验证信息',
    description: '用行情站、区块浏览器、协议数据和查询平台交叉核对。',
    checks: ['数据源与时区', '合约和代币地址', '指标口径与重复计算'],
  },
  {
    id: 'nft-gaming',
    label: 'NFT / 游戏 / Social',
    eyebrow: '链上应用',
    description: '数字收藏、游戏资产、创作者经济与去中心化社交的应用层。',
    checks: ['资产存储与版权', '团队与代币激励', '用户活动与投机交易的区别'],
  },
]

export const WEB3_RESOURCE_GROUPS = [
  {
    id: 'exchanges',
    title: '交易入口',
    description: '中心化平台与链上交易协议分开列出，便于识别资产托管边界。',
    items: [
      { name: 'Binance', type: 'CEX', href: 'https://www.binance.com/', note: '现货、衍生品与链上生态入口' },
      { name: 'OKX', type: 'CEX', href: 'https://www.okx.com/', note: '交易平台与 Web3 钱包' },
      { name: 'Coinbase', type: 'CEX', href: 'https://www.coinbase.com/', note: '法币入金、托管与机构服务' },
      { name: 'Kraken', type: 'CEX', href: 'https://www.kraken.com/', note: '现货与法币交易入口' },
      { name: 'Uniswap', type: 'DEX', href: 'https://app.uniswap.org/', note: 'EVM 生态自动做市协议' },
      { name: 'Jupiter', type: 'DEX', href: 'https://jup.ag/', note: 'Solana 生态交易聚合器' },
      { name: 'Curve', type: 'DEX', href: 'https://curve.fi/', note: '稳定资产与相关流动性市场' },
      { name: 'PancakeSwap', type: 'DEX', href: 'https://pancakeswap.finance/', note: '多链自动做市与交易工具' },
    ],
  },
  {
    id: 'market-data',
    title: '行情与协议数据',
    description: '查价格、市值、TVL、费用、收入和多链活动，需要同时看指标口径。',
    items: [
      { name: 'CoinGecko', type: '行情', href: 'https://www.coingecko.com/', note: '代币价格、市值、交易市场与分类' },
      { name: 'CoinMarketCap', type: '行情', href: 'https://coinmarketcap.com/', note: '代币与交易平台市场数据' },
      { name: 'DefiLlama', type: 'DeFi', href: 'https://defillama.com/', note: 'TVL、稳定币、费用、收益与桥数据' },
      { name: 'Token Terminal', type: '协议', href: 'https://tokenterminal.com/', note: '协议费用、收入与财务化指标' },
      { name: 'L2BEAT', type: 'L2', href: 'https://l2beat.com/', note: '以太坊 L2 规模、阶段与风险分析' },
      { name: 'Dune', type: '查询', href: 'https://dune.com/', note: '链上 SQL 查询与社区仪表盘' },
    ],
  },
  {
    id: 'explorers',
    title: '区块浏览器',
    description: '按地址、交易哈希、区块高度或合约查原始链上记录。',
    items: [
      { name: 'Etherscan', type: 'Ethereum', href: 'https://etherscan.io/', note: '以太坊交易、地址、合约与 Gas' },
      { name: 'Solscan', type: 'Solana', href: 'https://solscan.io/', note: 'Solana 交易、账户、代币与程序' },
      { name: 'BscScan', type: 'BNB Chain', href: 'https://bscscan.com/', note: 'BNB Smart Chain 区块与合约' },
      { name: 'Tronscan', type: 'TRON', href: 'https://tronscan.org/', note: 'TRON 交易、账户与代币' },
      { name: 'Blockchair', type: '多链', href: 'https://blockchair.com/', note: '比特币、以太坊等多链浏览器' },
    ],
  },
  {
    id: 'safety',
    title: '安全与授权',
    description: '检查合约、钱包授权、攻击记录和项目官方入口。',
    items: [
      { name: 'Revoke.cash', type: '授权', href: 'https://revoke.cash/', note: '检查并撤销 EVM 链上代币授权' },
      { name: 'De.Fi Scanner', type: '合约', href: 'https://de.fi/scanner', note: '合约风险扫描与钱包工具' },
      { name: 'Chainabuse', type: '举报', href: 'https://www.chainabuse.com/', note: '查询与举报加密诈骗地址' },
      { name: 'DefiLlama Search', type: '导航', href: 'https://search.defillama.com/', note: '核对加密项目的官方链接' },
    ],
  },
]
