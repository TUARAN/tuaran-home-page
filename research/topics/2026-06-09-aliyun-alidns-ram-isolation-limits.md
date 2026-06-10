---
title: 阿里云域名 & DNS RAM 权限隔离的能力边界调研
category: topics
date: 2026-06-09
tags: [阿里云, RAM, 权限管理, DNS, 域名管理, 安全, 多账号, 踩坑]
summary: 在同一主账号下，用 RAM 策略实现"只能操作指定 6 个域名的 DNS、看不到其他域名"，技术上无法完整做到。本篇逐一复盘 7 个典型坑，并给出唯一真正可行的方案。
tldr: 阿里云 alidns 产品的 RAM 设计存在根本缺陷 —— 写操作 ARN 不统一（Add 用 domainName / Update / Delete 用 domainId）、不支持 Deny+NotResource、控制台辅助接口必须走全量、DescribeInvalidDomains 还会泄露全账号域名列表。结论：**同主账号下做不到完整隔离，唯一解是把目标域名迁到独立主账号。**
topic_type: tech
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

> 📌 **场景**：你有一个阿里云主账号下挂着几十个域名。
> 现在要给一个外部协作者一个 RAM 子账号，他**只能管这 6 个域名的 DNS，看不到其他**。
> 直觉上这是 RAM 最经典的场景。实际操作下来 —— 你会撞 7 堵墙。

---

## 一、TL;DR：一张图看完结论

```
┌──────────────────────────────────────────────────────────────┐
│  目标：RAM 子账号 → 只能管 6 个域名的 DNS  → 看不到其他       │
└──────────────────────────────────────────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
          同主账号 + RAM            独立主账号 + RAM
                  │                       │
        ┌─────────┴─────────┐             │
        ▼                   ▼             ▼
   写操作锁定？         列表隔离？     全部满足 ✅
        │                   │
        ❌                   ❌
   (ARN 不统一)        (控制台不过滤)
                            │
                            └─→ DescribeInvalidDomains
                                还会把全账号域名
                                写在请求参数里 🚨
```

**一句话**：阿里云 alidns 不支持「同账号 + 子集授权 + 视图隔离」三件套同时成立。要做到就只能 **拆主账号**。

---

## 二、为什么会以为"应该能做到"？

把直觉里 AWS IAM 的能力套到阿里云 RAM 上，绝大多数读者第一反应是这条路径：

```
✅ Allow alidns:*  on  domain/yxsv.net, domain/yxgf.net …
✅ Deny  alidns:*  on  NotResource [上面 6 个]
✅ 控制台自动按权限过滤列表
```

**但这三条在阿里云全部不成立** —— 下面逐条复盘踩坑。

---

## 三、7 个坑逐一复盘

### 🕳️ 坑 1：指定 domainName 的 ARN 锁不住 Update / Delete

直觉写法：

```json
"Resource": "acs:alidns:*:*:domain/yxsv.net"
```

**实际**：

```
┌──────────────────────┬──────────────────────────────┐
│ API                  │ 鉴权资源 ARN                  │
├──────────────────────┼──────────────────────────────┤
│ AddDomainRecord      │ domain/{domainName}  ✅       │
│ UpdateDomainRecord   │ domain/{domainId}    🚨       │
│ DeleteDomainRecord   │ domain/{domainId}    🚨       │
└──────────────────────┴──────────────────────────────┘
```

写 `domainName` 的 ARN 对 Update / Delete **完全无效**。这两个 API 看的是内部 `domainId`（一个数字串），跟你写的字符串 ARN 对不上 → 默认放行 → 子账号可以删任何域名的解析记录。

> 💀 这是 7 个坑里**最致命**的一个 —— 你以为写了限制，其实没限制。

---

### 🕳️ 坑 2：Deny + NotResource 反向封堵 → 阿里云不支持

直觉写法（AWS IAM 的标准操作）：

```json
{
  "Effect": "Deny",
  "Action": "alidns:Update*",
  "NotResource": [
    "acs:alidns:*:*:domain/yxsv.net",
    …
  ]
}
```

控制台直接报：

```
❌ "策略元素 NotResource 无效"
```

**结论**：阿里云 RAM 没有实现 `Deny + NotResource`。

---

### 🕳️ 坑 3：Condition + StringNotEquals 变通 → 没有可用条件键

```json
"Condition": {
  "StringNotEquals": {
    "acs:Resource": ["acs:alidns:*:*:domain/yxsv.net", …]
  }
}
```

**问题**：
- `acs:Resource` 不是阿里云 RAM 的通用条件关键字
- alidns 产品**没有定义任何自定义条件键**
- 条件不生效 + 控制台报通配符警告

---

### 🕳️ 坑 4：两条 Allow 叠加 ≠ 后者覆盖前者

```json
[
  { "Effect": "Allow", "Action": "alidns:*", "Resource": "*" },         ← 这条已经放过一切
  { "Effect": "Allow", "Action": "alidns:*", "Resource": [6 个域名] }   ← 这条毫无收紧作用
]
```

**RAM 的匹配逻辑**：

```
       请求 ──► 命中任意一条 Allow ──► 放行
                   ▲
                   │
              不存在「更具体覆盖更宽泛」这种规则
```

→ 写完两条，子账号拿到的是**全账号 DNS 写权限**。

---

### 🕳️ 坑 5：误以为「跨账号委托」= 视图隔离

期待的画面：

```
账号 A（全部 50 个域名）
     │ 委托其中 6 个 ─► 账号 B 的 RAM 用户
                              │
                              └─► 登录看到的列表：6 个 ✅
```

**实际**：

```
账号 B 的 RAM 用户 ──► 扮演角色进入账号 A
                              │
                              └─► 控制台还是显示账号 A 的全部 50 个域名
                                  (RAM 角色扮演 ≠ 视图过滤)
```

跨账号 RAM 角色扮演解决的是"**身份**"问题，不是"**视图**"问题。

---

### 🕳️ 坑 6：把 InternalError 当权限问题

```
InternalError  ≠  权限不足
InternalError  =  服务端临时异常 (已经过了权限校验)
```

去翻 RAM 策略找半天，结果换个浏览器就好了。

---

### 🕳️ 坑 7：控制台辅助接口的"全家桶税"

DNS 控制台**渲染一个页面会一次性调用一打接口**，少一个就空白 / 报错弹窗：

```
┌───────────────────────────────────────────────────────┐
│ 进入 DNS 控制台首页时，至少会调用这些：                  │
├───────────────────────────────────────────────────────┤
│  📋 DescribeDomains              ─► 域名列表           │
│  📋 DescribeDomainGroups         ─► 分组筛选器         │
│  📋 DescribeDomainNs             ─► NS 信息            │
│  📋 DescribeSupportLines         ─► 解析线路选择器     │
│  📋 DescribeInvalidDomains       ─► 自动检查异常域名   │
│  📋 DescribeSubDomainRecords     ─► 记录列表           │
│  📋 DescribeDomainStatisticsSummary ─► 统计           │
│  📋 DescribeRecordLogs           ─► 操作日志           │
│  📋 DescribeDnsProductInstances  ─► 套餐信息           │
└───────────────────────────────────────────────────────┘
        ▲
        │
        └── 任何一个没授权 → Forbidden.RAM 弹窗
```

**而且这些只支持 `Resource: "*"`** —— 无法限定到 6 个域名。

#### 🚨 最致命的副作用

`DescribeInvalidDomains` 的**请求参数里直接带着全账号域名列表**（`DomainNames` 字段）。

```
                  RAM 子账号
                      │
                      ▼ 打开控制台
              DescribeInvalidDomains
                      │
              请求参数 DomainNames=[
                "yxsv.net", "yxgf.net",
                "abc.com", "def.com",     ← 不该看到的全在这
                "secret-project.cn",      ← 跟着一起暴露
                …全账号所有域名…
              ]
                      │
                      ▼ F12 一看
                  机密泄露
```

→ **即使你不授权 `DescribeDomains`，账号下的域名清单也会随请求参数被这条接口顺手抖出来。**

---

## 四、根本性设计缺陷总表

```
┌─────────────────────────────────┬────────────────────────────────────────────┐
│ 缺陷                             │ 影响                                        │
├─────────────────────────────────┼────────────────────────────────────────────┤
│ 写操作 ARN 不统一                │ Add 类锁得住，Update/Delete 锁不住          │
│ 控制台列表强制全量               │ RAM 策略无法影响列表展示                    │
│ 不支持 Deny + NotResource        │ 无法用反向黑名单兜底                        │
│ 没有可用条件关键字               │ Condition 路线整条死掉                      │
│ 辅助接口只支持 Resource: *       │ 想隔离就报错，不报错就开全量                 │
│ DescribeInvalidDomains 泄露域名  │ 不给读权限也能从请求参数里看到完整域名清单   │
└─────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 五、方案对比矩阵

| 方案 | 写操作锁定 | 控制台无报错 | 域名列表隔离 | 实施成本 | 推荐度 |
|---|:---:|:---:|:---:|---|:---:|
| **A. 6 个域名迁到独立主账号** | ✅ | ✅ | ✅ | 中（迁移 + 新账号） | ⭐⭐⭐⭐⭐ |
| **B. 跨账号 RAM 角色扮演** | ❌ Update/Delete 漏 | ✅ | ❌ 仍全显示 | 高 | ⭐⭐ |
| **C. 同账号 RAM 策略最大收紧** | ❌ 根本锁不住 | △ 需补全辅助接口 | ❌ | 低 | ⭐ |
| **D. 直达链接 + 君子约定** | ❌ 无技术约束 | ✅ | △ 视觉规避 | 极低 | 🚫 |
| **E. 全量 Allow + ActionTrail 审计** | ❌ 事前不拦 | ✅ | ❌ | 低 | 🚫 |

```
强弱排序：A ≫ B ≈ C(+审计) ≫ D ≈ E
```

---

## 六、同主账号下能做到的最优策略（诚实版）

如果**就是不迁账号**，下面这套是「不报错 + Add 类限定 + 引导用直达链接」的天花板：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Sid": "DNS-Write-6Domains-Only",
      "Effect": "Allow",
      "Action": "alidns:*",
      "Resource": [
        "acs:alidns:*:*:domain/yxsv.net",
        "acs:alidns:*:*:domain/yxgf.net",
        "acs:alidns:*:*:domain/yxas.net",
        "acs:alidns:*:*:domain/yxnl.net",
        "acs:alidns:*:*:domain/yxtp.net",
        "acs:alidns:*:*:domain/yxdl.net"
      ]
    },
    {
      "Sid": "DNS-Console-ReadOnly-Global",
      "Effect": "Allow",
      "Action": [
        "alidns:DescribeDomainGroups",
        "alidns:DescribeDomainNs",
        "alidns:DescribeSupportLines",
        "alidns:DescribeDnsProductInstances",
        "alidns:DescribeDomainStatisticsSummary",
        "alidns:DescribeRecordLogs",
        "alidns:DescribeSubDomainRecords",
        "alidns:DescribeInvalidDomains"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Domain-List-ReadOnly",
      "Effect": "Allow",
      "Action": [
        "domain:QueryDomainList",
        "domain:QueryRegistrantProfiles"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Console-Infrastructure",
      "Effect": "Allow",
      "Action": [
        "resourcemanager:ListResourceGroups",
        "resourcemanager:GetResourceGroup",
        "account:DescribeAccountAlias"
      ],
      "Resource": "*"
    }
  ]
}
```

**配套诚实声明（必须给协作者看）**：

```
✅ 控制台不会弹错
✅ AddDomainRecord 被限定在 6 个域名 (按 domainName 鉴权命中 ARN)
❌ UpdateDomainRecord / DeleteDomainRecord 鉴权用 domainId
   → 协作者技术上仍可操作其他域名的记录
❌ 登录后能看到账号下全部域名列表
❌ DescribeInvalidDomains 请求参数里会带全账号域名

这是约定 + 审计 + 信任的方案，不是技术强制方案。
配套必须开 ActionTrail 全量审计 + 关键操作告警。
```

---

## 七、决策树：你到底该走哪条路？

```
                    需要给协作者管 6 个域名的 DNS
                                │
                                ▼
                  这些域名的操作必须强约束（防误删/防恶意）？
                       ┌────────┴────────┐
                      是                   否
                       │                   │
                       ▼                   ▼
              迁到独立主账号 (A)   只要能看 + 能加记录就行？
                                       ┌──┴──┐
                                      是      否
                                       │      │
                                       ▼      ▼
                                  策略 C   再确认一遍需求
                                  + 审计
                                  + 君子协定
```

---

## 八、个人结论

- **一句话定性**：阿里云 alidns 在 RAM 设计上**没有做"同账号 + 子集授权"这条路**；这不是 bug，是产品没投入。
- **是否跟进**：✅ 必须知道 —— 凡是用阿里云做多主体 DNS 托管的，迟早撞这堵墙。
- **下一步行动**：
  1. **首选方案**：把强约束的域名（这 6 个）迁到独立主账号，新账号下开 RAM 子用户即可，**不写一行复杂策略**
  2. 实在不能迁，就用第六节策略 + ActionTrail 审计 + 跟协作者书面约定
  3. 给阿里云提工单建议：① alidns 写操作 ARN 统一为 domainName；② 支持 Deny + NotResource；③ 给 alidns 定义产品条件键 `alidns:DomainName`
- **对其他云的横向参考**：
  - **AWS Route 53**：用 `HostedZoneId` 做 ARN 锁，Deny + NotResource 都支持，是这套场景的 reference
  - **腾讯云 DNSPod**：CAM 的资源级权限也只到分组级别，不到记录级别；好处是有"项目"概念，可以把域名扔进项目里实现视图过滤
  - **Cloudflare**：Account-level + Zone-level 双层，Zone 粒度授权天生干净

---

## 九、信息来源

- [阿里云 RAM 策略语法和结构（官方文档）](https://help.aliyun.com/document_detail/93739.html)
- [阿里云 alidns API 鉴权资源说明](https://help.aliyun.com/document_detail/440263.html)
- [阿里云 ActionTrail 操作审计](https://help.aliyun.com/product/28802.html)
- [AWS IAM NotResource 元素（对照参考）](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_notresource.html)
- [AWS Route 53 资源级权限模型](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/UsingWithIAM.html)
- 用户亲历的踩坑日志（坑 1–7 全部为实操记录）
