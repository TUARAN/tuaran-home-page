---
title: X 新上的 Calls 是视频会议，不打电话，也不发短信
category: topics
date: 2026-10-10
time: 15:45
updated: 2026-10-10T16:32:00+08:00
tags: [X, Twitter, X Calls, X Chat, 视频会议, 产品]
summary: X 在 2026-10-02 把 X Calls 放到 call.x.com 测试：用 X 账号开会或排期，对方凭链接或短码进房间。产品没有拨手机号、发短信的入口。9 月的 X Number 只是 Chat 里的私密联系码。
tldr: X Calls 是网络音视频会议，一条可预约的会议链接。它不拨运营商电话，也不发短信。X Number 同样进不了手机通讯录，只让别人在 X Chat 里发消息或发起站内通话。
topic_type: product
subjects: [product_experience]
content_type: analysis
assistance: cursor
model: grok-4.7
review_ready: false
ad_eligible: false
pv: 0
---

# X 新上的 Calls 是视频会议，不打电话，也不发短信

## 一、先给结论

**X Calls 是网络视频会议。发起人用 X 账号立刻开会，或把会议排进日历；对方凭链接或短码打开摄像头和麦克风进房间。它不拨手机号，也不发短信。**

1. 2026-10-02，@grok 发帖称 X Calls 已在 [call.x.com](https://call.x.com) 进入测试。网页、Android、iOS 都能用链接或短码加入，加入者不需要 X 账号。帖子列出即时通话、预约、日历、白板和表情反应，并写明还没有正式发布日期。
2. 同一天，测试者 @nima_owji 描述了同一地址：可以马上开、生成稍后再用的链接，或排期；房间里有白板、反应，以及标成 Grok Imagine 的背景。
3. 主站 Calls 与这个测试站是同一套能力：New Call、日程、搜索人物，以及把自己的 Google 或 Microsoft 日历链进来。入口里没有拨号，也没有短信收件人。
4. 2026-09-22 由 @chat 宣布的 X Number 是另一套入口。帮助中心的原句是 “Your X Number is not a phone number.” 它是一串可关闭、可刷新的私密码，用来在 X Chat 里发消息，或按对方的通话设置发起站内音视频。对话进 Chat 收件箱，不进短信。
5. 更早的私信音视频从 2023 年 10 月在 iOS 陆续出现，2024 年 1 月到 Android，2024 年 2 月 28 日对全部用户开放。入口在已有私信里的电话图标，说明里写明不需要电话号码。

把它当成会议链接，可以观望，并用一场不含敏感内容的短会试链接、访客姓名和日历。把它当成电话或短信则不用跟：公开产品没有这条路径。

## 二、事实层

### X Calls 做什么

登录 X 账号后可以马上开会，或生成 `call.x.com/` 开头的链接和一串短码。预约时填写标题、说明、时间和受邀的 X 账号，可以设成重复，并选择是否由 X 发邀请邮件。受邀账号需要打开邮件通知和私信，才会收到那封邮件。没有 X 账号的人，拿到的是主持人发出的链接，打开后填写姓名即可进房；主持若把房间收成已验证组织，加入者就要登录。

日历可连接 Google 或 Microsoft，日、周、月视图里能看到自己的事件。分享空闲时，对方只看到忙闲，看不到事件内容。谁能进房有三档：持有链接的所有人、同一已验证组织里的人，或先在等候室等主持批准。

测试按账号放开。部分账号会看到 “Scheduling isn’t available for your account yet” 或 “Linking calendars isn’t available for your account yet”。看得到 New Call、预约和链接日历，只说明这个账号已打开，不说明全站都已打开。

### 三套入口

| | 私信里的音视频 | X Number | X Calls |
|---|---|---|---|
| 上线 | iOS 2023-10 起，全员 2024-02-28 | @chat 于 2026-09-22 宣布 | call.x.com 测试，@grok 于 2026-10-02 发帖 |
| 从哪里开始 | 已有私信或群聊里的电话图标 | Chat 收件箱菜单里的 Number | 主站 Calls，或 call.x.com |
| 对方是谁 | 这场私信里的人；一对一还要求对方先给自己发过私信 | 持有当前私密码的人，即使未互相关注、收件箱关闭 | 拿到链接或短码的人；主持可收成「所有人 / 已验证组织 / 等候室批准」 |
| 要不要 X 账号 | 要 | 要，码本身挂在 Chat 上 | 主持要；公开房间的加入者输入姓名即可 |
| 和手机的关系 | 不需要电话号码；默认可能暴露 IP，可开 Enhanced call privacy | 帮助中心原句：不是 phone number；消息进 Chat，不进短信 | 摄像头、麦克风、链接和日历，没有拨号或短信 |

X Number 的位数，公开报道并不一致。Forbes 在 2026-09-22 写成 8 位，另有记录写成 10 位。帮助中心没有给出位数。

用法比较一致：在 Chat 里输入 PIN，打开收件箱下拉菜单，进入 Number，可以启用、分享、关闭或刷新。刷新后，只拿着旧码的人不能再以此开新对话。已有私信来往的人默认可能看到这串码，并可以转给别人；隐藏选项用来挡住这一点。对方能否打进来，仍看 Chat 里的通话范围：通讯录、关注的人、已验证用户，或所有人。

### 房间里有什么

进房前可以检查摄像头和麦克风。房间里有侧边文字、表情、举手队列，可以共享整个屏幕、一个窗口或一个浏览器标签，也有白板、背景模糊，以及标成 Grok Imagine 的背景，还有降噪。主持可以逐个或一次性放人进来。

测试版没有录制、转写或会议纪要。Grok 只出现在背景选择里。价格、人数上限、单场时长都没有公布。私信群组通话的帮助文档写过「尚未端到端加密」。X Calls 自己的安全说明还没有公开文本。

第三方客户端把两套通话记成不同的媒体路径：私信通话沿用旧的 Periscope / Janus，call.x.com 走另一组接口和名为 Hydra 的媒体网关。这是逆向记录，不是 X 的架构说明。

## 三、结构分析

Calls 这个名字、日历，再加上一串叫 Number 的数字，会让人联想到电话和短信。Musk 从 2024 年起多次把 X 说成可以取代电话号码的应用。Forbes 记录过他曾说要停用自己的手机号，改用 X 收消息和通话。产品沿用了电话和号码的词，接通的是 X 的账号和会议房间。

私信通话和 X Calls 都要浏览器或 App 交出摄像头、麦克风权限。加入者的身份是 X 账号，或当场填写的显示名。X Number 改变的是谁能越过关闭的收件箱，消息落点仍是 Chat。日历连的是 Google 或 Microsoft 里的忙闲，用来排会议，不向一个手机号振铃。

X Calls 能做的是：给已经在 X 上的人发一条会议链接，或让没有账号的人凭链接进同一间房。拨出一个手机号，或把一条文字送到运营商短信，不在这个产品里。

## 四、外部研判

**会议链接可以观望。电话和短信不用跟。**

X 上已经有固定联系人的人，可以用它省掉「先把所有人拉进一个群再开通话」。免账号加入，是它和私信通话不同的地方。和 Zoom、Google Meet 并排时，缺的是已经写明的人数、时长、录制、加密和价格。这些决定能不能把客户会、录音会放上去。

要打给一个手机号，或给一个手机号发短信，继续用运营商或现有通讯 App。

账号里已经出现 Calls 的话，约一场没有敏感内容的短会，确认链接能否被未登录的人用姓名打开，以及链上的日历是否只对自己显示事件详情。需要录音或已写明的加密时，这场会仍放在现有会议工具上。

## 五、信息来源与持续验证

资料截至 2026-10-10。

- @grok，2026-10-02。转引见 Pasquale Pillitteri，[X Calls launches in beta](https://pasqualepillitteri.it/en/news/20154/x-calls-beta-video-calls-no-account)。
- @nima_owji，2026-10-02，call.x.com、免账号加入、日历、白板、Grok Imagine 背景。
- UseCarly，2026-10-03，[X Calls (call.x.com)](https://www.usecarly.com/blog/x-calls/)。页面来自一家日程产品公司，功能记录对应帮助中心和当日的 call.x.com。
- @chat，2026-09-22。转述见 [Cyber Kendra](https://www.cyberkendra.com/2026/09/x-numbers-x-chat-private-contact-code.html)、[Forbes](https://www.forbes.com/sites/antoniopequenoiv/2026/09/22/x-adds-private-codes-for-calls-says-it-is-not-a-phone-number/)、[Social Media Today](https://www.socialmediatoday.com/news/x-numbers-officially-launch/831091/)。“Your X Number is not a phone number.” 出自这些报道引用的帮助中心文本。
- 私信音视频时间线：Enrique Barragan 2024-01-18 帖子，经 [Thurrott](https://www.thurrott.com/cloud/296389/twitter-x-launches-audio-and-video-calls-on-android)；@XNews 2024-02-28，经 [Kimp](https://www.kimp.io/kimps-picks-1st-march/)；通话设置与「不需要电话号码」见 [FOX 2](https://www.fox2detroit.com/news/twitter-x-calls-audio-video-privacy-how-to-turn-off)。
- 两套通话栈的逆向笔记：[emusks Calls](https://emusks.tiago.zip/xchat/calls)。

X 若给 Calls 或 X Number 加上电话拨出、短信收发，会议房间和运营商通讯就不再是两条线。公开入口里目前没有。
