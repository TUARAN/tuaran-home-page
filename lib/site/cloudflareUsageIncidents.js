/**
 * 用量监控页「最近几次事故时间线」。
 * 详细口径、未完成项和数据来源在 docs/context/cloudflare-usage-incidents.md。
 */

export const CLOUDFLARE_USAGE_INCIDENT_CALLOUT = {
  title: '先稳住，再改插件',
  body: '触顶主因是心跳和上报过密，加上全表扫描。已有 80% / 95% 站长通知。改插件默认不要增加心跳频率。',
}

export const CLOUDFLARE_USAGE_INCIDENTS = [
  {
    date: '10-25',
    iso: '2026-10-25',
    symptom: 'D1 写约 13.5 万行，超过参考额度',
    cause: '插件报告高频，重复心跳写库',
    done: '设备心跳约 3 分钟条件写；runtime 去重',
  },
  {
    date: '10-26',
    iso: '2026-10-26',
    symptom: 'Workers 约 11.9 万次；登录/鉴权 404',
    cause: 'X 面板每秒刷新驱动远端心跳，report 入口暴增',
    done: '遥测分钟上限、心跳去重；用量页与归档上线',
  },
  {
    date: '10-27',
    iso: '2026-10-27',
    symptom: '限流已部署，额度未重置时仍 404',
    cause: '旧插件未重载；当日额度未回',
    done: '记录待验证项；依赖次日 UTC 重置',
  },
  {
    date: '10-28',
    iso: '2026-10-28',
    symptom: '读行仍偏贵；触顶后才发现失败',
    cause: '历史 LIMIT 过大、缺索引、全表 SUM(LENGTH)',
    done: '历史窗口收紧、补索引；表详情默认不算文本量；80% 预警和 3 小时采样',
  },
  {
    date: '11-02',
    iso: '2026-11-02',
    symptom: 'D1 读到约 86% Free',
    cause: '调研目录反复整表列、非 X 回执全表扫、账号趋势扫明细',
    done: '公开目录 5 分钟缓存、按平台等值查、监控汇总 2 分钟缓存；大头汇总表改造未做完',
  },
]
