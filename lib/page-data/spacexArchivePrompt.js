export const SPACEX_GROK_ARCHIVE_PROMPT = `你正在读取我当前打开的 X 帖子及其中的 SpaceX 视频。请把这次任务整理成可导入 2aran.com SpaceX 时间线的发射档案。

核验规则：
1. 优先读取 SpaceX 官方帖子、任务直播和任务页；再用至少一个可靠发射数据库或航天媒体交叉核对。
2. 区分“帖子文字明确写出”“视频画面可直接确认”“第三方来源补充”三类证据。
3. 不要根据火箭涂装、画面或相似任务猜测任务名称、助推器编号、复用次数、载荷数量或纪录。
4. 无法确认的字段写 null，并放进 needsVerification；时间必须同时给出 UTC ISO 8601 和发射地当地时间。
5. “首次”“纪录”“第 N 次”等亮点必须附支持该说法的来源；找不到可靠来源时不要写进 timelineDraft。
6. 保留当前 X 帖子 URL、发帖账号、视频内容描述和适合归档的视频时间段。

只输出一个 JSON 代码块，不要在代码块前后解释。严格使用下面结构：
{
  "schemaVersion": 1,
  "missionName": "",
  "launchedAtUtc": "YYYY-MM-DDTHH:mm:ssZ",
  "launchedAtLocal": {
    "value": "YYYY-MM-DD HH:mm:ss",
    "timezone": "IANA 时区",
    "utcOffset": "±HH:mm"
  },
  "launchSite": {
    "name": "",
    "pad": ""
  },
  "rocket": {
    "family": "",
    "booster": "",
    "flightNumber": null
  },
  "payload": {
    "name": "",
    "count": null,
    "type": "",
    "destination": ""
  },
  "outcome": {
    "launch": "success | failure | partial | unknown",
    "boosterLanding": "success | failure | not-attempted | unknown",
    "landingSite": ""
  },
  "highlights": [
    {
      "claim": "",
      "sourceUrl": "",
      "confidence": "high | medium | low"
    }
  ],
  "video": {
    "postUrl": "",
    "account": "",
    "descriptionZh": "",
    "recommendedClip": "例如 T+02:55–T+03:15",
    "credit": ""
  },
  "sources": [
    {
      "label": "",
      "url": "",
      "supports": [""]
    }
  ],
  "needsVerification": [""],
  "timelineDraft": {
    "id": "spacex-英文任务短名-YYYY-MM-DD",
    "publishedAt": "与 launchedAtUtc 相同",
    "topic": "Starlink | Starship | Dragon | Falcon",
    "titleZh": "",
    "summaryZh": "用 1–2 句话写清火箭、地点、载荷、结果与可靠亮点",
    "noteZh": "发射结果 · 发射地当地时间"
  }
}`
