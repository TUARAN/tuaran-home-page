---
title: 万人群聊的已读与未读怎么做
category: topics
topic_type: tech
tech_type: architecture
subjects: [web_cloud]
entity_type: technology
date: 2026-09-22
time: "09:20"
updated: "2026-09-22T09:25:00+08:00"
tags: [即时通信, 群聊, 已读回执, 未读计数, Discord, Slack, Matrix, Telegram, 企业微信]
summary: 会话列表红点用水位线就能撑到万人；「谁读了这条消息」的明细在公开产品和云 IM 里普遍卡在一两百到两千人。
tldr: 万人群默认做会话水位线加 @ 计数即可。Discord、Slack、Matrix 都是 up-to 游标；Telegram 群读回执阈值约 100 人、保留 7 天；腾讯云 IM 上限 200；企微全员群超过 2000 不显示阅读状态。
content_type: analysis
assistance: cursor
model: composer
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **适用范围：**依据截至 2026-09-22 可核对的公开 API、规格与厂商文档，讨论即时通信里未读角标与消息已读回执的常见做法。不构成某家产品内部实现断言，也不构成选型采购建议。

## 一、先给结论

万人群聊里，稳定能做的是「我这个会话读到哪了」；难默认做成的是「每一条消息、每一个人是否已读」。两个意思共用「已读」这个词，写库和推送的成本差几个数量级。

会话未读只要给每个用户、每个会话存一条水位线（`last_read` / `last_acked_id`）：频道最新消息 ID 大于水位线，就有未读。Discord 的 Read State、Slack 的 `conversations.mark`、Matrix 的 `m.read` / `m.fully_read` 都走这条路。

消息级已读回执要回答「谁读了这条」，存储和推送大致按消息数乘成员数涨。Telegram 只在成员数不超过 `chat_read_mark_size_threshold`（公开配置示例为 100）时提供 `messages.getMessageReadParticipants`，回执只保留 `chat_read_mark_expire_period`（示例 604800 秒，即 7 天）。腾讯云 IM 文档写明群已读回执「群内最大人数为 200」。企业微信帮助中心写明全员群超过 2000 人不再显示阅读状态。

万人广播更常见的是近似浏览量。Telegram 频道 FAQ 写明帖子带眼睛图标，浏览量是近似值，大约四天后会忘掉「你看过」，再看可能再计一次。个人微信公开口径长期不做已读回执；企业微信才把阅读状态当办公辅助，并对外部会话和超大全员群设限。

水位线管角标，单独计数管 @ 和关键词，消息级回执只开在小群或「回执消息」开关上。万人群用已送达、概览计数或抽查，替代全员已读名单。

## 二、公开系统实际怎么做

会话未读、提及未读、消息已读回执是三件事。会话列表红点对应「用户在这个会话读到的位置」；@ 角标对应命中规则、尚未确认的通知；「已读  deleg人 / 谁未读」对应每条消息乘每个成员的关系。后一种按第一种去扩，会在万人群里同时打爆写放大、扇出推送和历史表。

Discord 频道对象带 `last_message_id`，和用户 Read State 里的 `last_message_id` 比较，更大就表示未读；Bot API 并不提供完整未读条数接口，客户端侧另有 mention / badge 字段。面向大型服务器频道的是会话态，不是每条消息的全员名单。

Slack 用 `conversations.mark` 把读游标设到某条消息的 `ts`，官方建议客户端大约 5 秒合并一次 mark，忙频道或翻历史时不要每条都打服务端。会话对象可以带 `last_read`、`unread_count`、`unread_count_display`（后者排除进出群一类噪音）。水位线按用户保存，并广播给该用户所有在线连接。

Matrix 规格里的 `m.read`、`m.read.private`、`m.fully_read` 都是 up-to 标记，明确要求不要为每条事件单独发回执。`m.read` 对其他人可见；`m.read.private`（MSC2285，自 v1.4）只清通知，不联邦、不广播给他人。游标设计本身就是为了压流量。

Telegram 群和超级群用 `readHistory` / `channels.readHistory` 更新服务端未读；查「谁读了某条」走 `getMessageReadParticipants`，群过大返回 `CHAT_TOO_BIG`，过期返回 `MSG_TOO_OLD`。公开客户端配置示例：人数阈值 100、保留 7 天。频道浏览量另算，不提供「谁看了」的人名列表，眼睛计数含转发副本。

腾讯云 IM 把会话已读和消息回执分开。群消息已读回执要旗舰版或企业版，并在控制台开启；群内最大 200 人；社群和直播群不支持。拉取已读或未读成员列表可分页，单次 Count 上限 200。

企业微信在内部群、上下游群、互联群可开阅读状态，外部聊天不支持；全员群超过 2000 不显示；未读催读在群超过 200 时不可用。个人微信无公开已读回执，官方多次表态会增加社交压力、不做。

WhatsApp 帮助中心写明：一对一可以关掉读回执，群聊关不掉；群里第二条灰勾表示所有人已送达，两条蓝勾表示所有人已读。这是小群问责模型，没有公开说明万人广播群如何截断。

粗算一下量级。1 万成员、每天 1000 条消息：会话水位线按活跃用户偶发写游标，列表用 `latest_id > last_read` 判断，写量大致跟活跃度线性。若每条消息都记全员是否已读，每天最多约 \(1000 \times 10000 = 10^7\) 条关系，再乘在线推送给发送方。接收方批量 ack 能少打请求，明细表若仍按消息保留，存储照样降不下来。腾讯云开发者社区一篇群回执专题用「200 人群、20% 在线」估算过风暴系数：每条消息一批下行、一批回执上行。同一模型放到万人群，产品侧通常先砍明细需求。

## 三、会话水位线与回执明细

会话未读主路径一张表就够：`conversation_id`、`user_id`、单调递增的 `last_read_id`（或时间戳）、可选的 `mention_count`、`updated_at`。有未读当且仅当 `conversation.last_message_id > user.last_read_id`。未读条数可选：对水位线之后的可见消息计数或做近似；Slack 用两套 count 区分「全量」和「对用户有意义」。

写入跟 Slack 建议对齐：客户端 debounce，例如 5 秒合并一次 mark。Matrix 同样要求 up-to marker。服务端保存权威水位线，某端 mark 成功后推给该用户其它连接；水位线只前进或取较大 ID，避免旧端把已读拖回去。Matrix 对 public / private 两种回执也规定：通知计数取更靠前的那个。

万人群真正要打扰人的，多半是 @我、关键词、回复线程。发消息时按规则写入 notification / highlight 计数，用户打开会话或点开通知时再减。Discord Read State 里的 `mention_count`、`badge_count` 和「有没有更新的消息」是分开的。Matrix 用 push rules 加 read receipt 清通知；`m.read.private` 用来消角标却不让别人看见读到哪。列表可以只亮「有更新」或「有提及」，不必精确到「还剩 3847 条」。

必须做「谁未读」时，公开产品已经给出边界：人数超过阈值就关明细（Telegram 约 100，腾讯云 IM 200，企微全员群 2000）；回执设 TTL（Telegram 7 天）；只有发送方勾选的消息才收明细（企微「回执消息」）；中等群可以只存 `read_count`，名单分页懒加载；万人频道用近似 views，不露身份。

不要默认给每条消息常驻一张全员位图。成员进出、读后离群是否仍算已读（企微明确：读后离群仍显示已读）、关闭读状态的用户怎么展示，都会把位图语义弄脏。水位线管「我自己读到哪」；明细只在开启回执的消息上按 `(msg_id, user_id)` 追加；发送方拉详情分页（腾讯云 IM Count ≤ 200），进会话不要推全员名单。

万人群下行本身已经贵。每人已读立刻推给发送方，等于二次风暴。接收方攒一批再 ack；发送方订阅或轮询「已读人数 + 增量」，不默认实时每人一条；过期回执删除或归档，只留计数或什么都不留。

送达和已读也要分开。送达是到达设备或任一端；已读是进入可视区域或用户明确打开。WhatsApp 用灰双勾和蓝双勾区分；Telegram API 把 `readHistory` 和频道 `views` 分开，前者不自动加浏览量。混在一个状态机里，分不清是推送失败还是用户没点开。

会话未读和消息已读回执用两套表、两套开关。万人群先上水位线和 @；回执放进小群或付费档。办公问责可以按企微：小群可开、全员群关掉或改成回执消息、外部联系人关闭。频道和公告用浏览量或阅读率，不露读者名单。

## 四、信息来源与持续验证

资料截至 2026-09-22。

- Discord 频道 `last_message_id`：[Channel Resource](https://docs.discord.com/developers/resources/channel)；社区整理的 Read State：[discord.food](https://docs.discord.food/topics/read-state)
- Slack：[`conversations.mark`](https://docs.slack.dev/reference/methods/conversations.mark)、[Conversation object](https://docs.slack.dev/reference/objects/conversation-object)
- Matrix：[Receipts](https://spec.matrix.org/v1.19/client-server-api/#receipts)；[MSC2285](https://github.com/matrix-org/matrix-spec-proposals/blob/main/proposals/2285-hidden-read-receipts.md)
- Telegram：[`getMessageReadParticipants`](https://core.telegram.org/method/messages.getMessageReadParticipants)、[Client configuration](https://core.telegram.org/api/config)、[Channels FAQ](https://telegram.org/faq_channels)、[Views and read metrics](https://core.telegram.org/api/views)
- 腾讯云 IM：[群消息已读回执](https://cloud.tencent.com/document/product/269/107478)、[拉取回执详情](https://cloud.tencent.com/document/product/269/77693)
- 企业微信：[Read receipt help](https://open.work.weixin.qq.com/help2/pc/15444)
- WhatsApp：[How to check read receipts](https://faq.whatsapp.com/665923838265756/)
- 个人微信不做已读：公开报道中的腾讯口径；企微内部可读、外部不可读的员工说明

持续验证：Telegram 与各厂商的人数阈值、TTL 会改版，上线前以当时配置 / 控制台为准。Discord Bot API 对未读条数暴露有限，Read State 细节来自社区文档，服务端内部表结构仍缺一手材料。WhatsApp 帮助中心未给出类似 Telegram 的超大群截断阈值，不能从蓝勾文案反推万人实现。
