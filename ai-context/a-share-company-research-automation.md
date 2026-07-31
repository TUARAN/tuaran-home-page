# A 股公司观察自动化设计

更新日期：2026-07-31

## 目标

维护一个可追溯的 A 股上市公司候选池。每天最多选择一家公司，按当前通用模板生成一篇待人工复核的公司观察文章。

## 数据流

1. `npm run a-share:sync` 从结构化行情列表取得沪市、深市和北交所公司，执行数量、代码和市场完整性校验。
2. 同步结果写入 `data/a-shares/companies.json`，同时重建 `research/companies/2026-07-31-a-share-company-list.md`。
3. `npm run a-share:pick` 优先返回尚未完成的选择；没有待完成项时，从未研究公司中随机选择一家。
4. 自动化读取 `research/templates/a-share-company-research.md` 和当前生效的 `lib/researchStyleTemplates.js`，检索一手资料并写文章。
5. 文章通过最小校验后，运行 `npm run a-share:complete -- --code <代码> --file <文章路径>` 标记完成。

## 文件职责

| 文件 | 职责 |
|---|---|
| `data/a-shares/companies.json` | 当前公司池快照、数据来源和市场统计 |
| `data/a-shares/research-state.json` | 抽取、重试和完成历史 |
| `research/companies/2026-07-31-a-share-company-list.md` | 面向读者的完整名单 |
| `research/templates/a-share-company-research.md` | 可持续升级的通用写作模板 |
| `scripts/manage-a-share-research.mjs` | 同步、抽取、完成和状态查询 |

## 幂等与失败处理

- 同一时间只保留一个 `selected` 状态。文章没有完成时，后续运行继续处理同一家公司。
- 已有文章通过 frontmatter 的 `stock_code` 识别，即使状态文件重建，也不会再次抽取。
- 同步数据少于 5000 家、多于 8000 家或缺少任一交易所时，拒绝覆盖旧快照。
- 自动生成文章固定使用 `review_ready: false` 和 `ad_eligible: false`。
- 自动化不提交、不推送、不发布文章；站长复核后按仓库发布规则处理。

## 模板升级

修改模板时递增 `template_version`，并同步修改输出 frontmatter 的 `research_template_version`。历史文章保留原版本号，便于回溯当时的结构和核验要求。

结构有重大变化时，先用一家公司人工演练，再恢复每日自动化。
