export const PLATFORM_GROUPS = ['focus', 'global', 'china']

export const COMPARISON_DIMENSIONS = [
  'reach', 'realtime', 'content-longevity', 'search-value', 'professional-relationships',
  'public-conversation', 'external-links', 'algorithmic-distribution', 'follow-graph',
  'chinese-reach', 'internationalization', 'production-cost', 'native-monetization',
  'private-audience', 'brand-safety', 'data-transparency',
]

const platforms = [
  ['x', 'X', 'focus'], ['threads', 'Threads', 'global'], ['facebook', 'Facebook', 'global'],
  ['instagram', 'Instagram', 'global'], ['tiktok', 'TikTok', 'global'], ['reddit', 'Reddit', 'global'],
  ['linkedin', 'LinkedIn', 'global'], ['weibo', '微博', 'china'], ['zhihu', '知乎', 'china'],
  ['xiaohongshu', '小红书', 'china'], ['wechat-oa', '微信公众号', 'china'], ['jike', '即刻', 'china'],
].map(([id, name, group]) => ({ id, name, group }))

const metrics = [
  ['dau', 'DAU', ['people']], ['mau', 'MAU', ['people']], ['ad-reach', '广告可触达人数', ['people']],
  ['registered-members', '注册会员数', ['people']], ['device-count', '设备数', ['devices']],
  ['monthly-visitors', '月访问者', ['people']], ['daily-minutes', '日均使用时长', ['minutes']],
  ['country-share', '国家受众占比', ['percent']], ['internet-penetration', '互联网人口渗透率', ['percent']],
  ['adult-use-rate', '成年人口使用率', ['percent']], ['age-use-rate', '年龄人群使用率', ['percent']],
  ['gender-use-rate', '性别人群使用率', ['percent']],
  ['age-share', '年龄占比', ['percent']], ['gender-share', '性别占比', ['percent']],
  ['income-use-rate', '收入人群使用率', ['percent']], ['education-use-rate', '教育人群使用率', ['percent']],
  ['news-use-rate', '新闻使用率', ['percent']], ['creator-threshold', '创作者门槛', ['qualitative']],
  ['post-volume', '发布量', ['posts']], ['engagement-rate', '互动率', ['percent']],
].map(([id, label, allowedUnits]) => ({ id, label, allowedUnits }))

const snapshots = [{
  id: '2026-q2', label: '2026 Q2', periodStart: '2026-04-01', periodEnd: '2026-06-30',
  verifiedAt: '2026-07-20', summary: '私有化后的 X 数据透明度有限；规模需用多来源区间理解。', previousSnapshotId: null,
}]

const ACCESSED_AT = '2026-07-20'

function source(id, title, publisher, url, publishedAt, sourceClass, methodologySummary, extra = {}) {
  return {
    id, title, publisher, url, publishedAt, accessedAt: ACCESSED_AT, sourceClass,
    methodologySummary, archiveStatus: 'live', ...extra,
  }
}

const sources = [
  source('x-dsa-h2-2025', 'DSA Transparency Report H2 2025', 'X', 'https://transparency.x.com/en/reports/dsa-transparency-report', '2026-02-27', 'primary-regulatory', 'EU DSA harmonised transparency report covering 2025-07-01 through 2025-12-31; not a global user-count disclosure.', { geography: 'eu' }),
  source('x-eu-amars-history', 'AMARS in the EU', 'X', 'https://transparency.x.com/en/reports/amars-in-the-eu', '2024-08-31', 'primary-regulatory', 'Article 24(2) average monthly active recipients; includes logged-in users and logged-out guests, deduplicates accounts where possible, excludes bots and locates recipients by IP.', { geography: 'eu' }),
  source('x-ads-audience-estimate', 'Audience estimate', 'X Business', 'https://business.x.com/en/help/campaign-setup/audience-estimate', ACCESSED_AT, 'primary-live-reference', 'Undated live help page. Estimates are predictive 30-day potential advertising audiences and explicitly are not mDAU, MAU, or an exact count of people.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-premium', 'About X Premium', 'X Help', 'https://help.x.com/en/using-x/x-premium', ACCESSED_AT, 'primary-live-reference', 'Undated live product and pricing page for Basic, Premium, and Premium+; access date is used because the page exposes no publication date.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-creator-revenue', 'Creator Revenue Sharing', 'X Help', 'https://help.x.com/en/using-x/creator-revenue-sharing', ACCESSED_AT, 'primary-live-reference', 'Undated live program page: active Premium tier, 5M organic impressions in three months, 500 verified followers, supported payout country, Stripe setup, and policy compliance. X states it may modify or cancel the program at its discretion.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-creator-subscriptions', 'About Creator Subscriptions', 'X Help', 'https://help.x.com/en/using-x/subscriptions-creator', ACCESSED_AT, 'primary-live-reference', 'Undated live program page: age 18+, active in 30 days, 2,000 verified followers, 5M organic impressions in three months, supported Stripe location, subscriber-only formats, and platform-fee and payout conditions.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-organic-best-practices', 'Organic best practices', 'X Business', 'https://business.x.com/en/basics/organic-best-practices', ACCESSED_AT, 'primary-live-reference', 'Undated live editorial guidance recommending concise, conversational copy, clear calls to action, and media.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-how-to-post', 'How to post', 'X Help', 'https://help.x.com/en/using-x/how-to-post', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation: standard posts can contain text, photos, GIFs, video, and links; longer posts require an eligible Premium tier. This documents availability, not format performance.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-articles', 'About Articles', 'X Help', 'https://help.x.com/en/using-x/articles', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation for globally available long-form Articles. Publishing requires an eligible Premium or organisation tier; Articles can contain media, posts, and links.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-spaces', 'About X Spaces', 'X Help', 'https://help.x.com/en/using-x/spaces', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation for public live audio, scheduling, optional recordings, replay, and sharing. It documents capabilities, not audience outcomes.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-search', 'How to use X search', 'X Help', 'https://help.x.com/en/using-x/x-search', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation for searching posts, accounts, conversations, media, news, and broadcasts, including Top and Latest result views and advanced filters. It does not quantify long-tail discovery.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-reposts', 'How to Repost', 'X Help', 'https://help.x.com/en/using-x/how-to-repost', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation: Reposts distribute a post to the reposter’s followers, while Quote posts add commentary or media and preserve a reference to the original.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-replies', 'About replies and mentions', 'X Help', 'https://help.x.com/en/using-x/mentions-and-replies', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation for replies, mentions, notification delivery, and non-chronological reply ranking using relevance, credibility, safety, relationship, and subscription signals.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-post-links', 'How to post links in a Post', 'X Help', 'https://help.x.com/en/using-twitter/how-to-tweet-a-link.html', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation confirming that links can be posted and are wrapped by the t.co shortener. It does not disclose whether outbound links receive a ranking penalty.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-recommendation-code', 'X Recommendation Algorithm', 'X / GitHub', 'https://github.com/twitter/the-algorithm', '2023-03-31', 'primary-code-archive', 'Public historical source snapshot describing shared data, candidate generation, ranking, and filtering services; it is not proof of the current production system.', { archiveStatus: 'historical' }),
  source('eu-x-dsa-fine-2025', 'Commission fines X €120 million under the Digital Services Act', 'European Commission', 'https://digital-strategy.ec.europa.eu/en/news/commission-fines-x-eu120-million-under-digital-services-act', '2025-12-05', 'regulatory', 'Final DSA non-compliance decision concerning blue-check design, advertising-repository transparency, and researcher access to public data.', { geography: 'eu' }),
  source('eu-x-action-plan-2026', 'Commission accepts X’s action plan to comply with Digital Services Act', 'European Commission', 'https://digital-strategy.ec.europa.eu/en/news/commission-accepts-xs-action-plan-comply-digital-services-act', '2026-07-16', 'regulatory', 'Records corrective commitments for advertising-repository search/API access and eligible researcher access; implementation remains subject to supervision.', { geography: 'eu' }),
  source('x-global-mau-self-2025', 'With 600 million users, X’s CEO cites platform scale', 'Digiday', 'https://digiday.com/marketing/with-600-million-users-xs-linda-yaccarino-doubles-down-on-dismissing-journalism/', '2025-04-30', 'secondary-self-report', 'Contemporaneous report of the X CEO’s approximately 600M global MAU claim; no deduplication, bot treatment, or measurement method was disclosed.', { geography: 'global' }),
  source('pew-social-2025', 'Social Media Fact Sheet', 'Pew Research Center', 'https://www.pewresearch.org/internet/fact-sheet/social-media/', '2025-11-20', 'independent-survey', 'Survey of 5,022 US adults fielded 2025-02-05 through 2025-06-18 by SSRS using address-based sampling and web, mail, and phone modes; weighted to US adults.', { geography: 'us', sampleSize: 5022 }),
  source('pew-x-experience-2024', 'How X users view and experience the platform', 'Pew Research Center', 'https://www.pewresearch.org/2024/06/12/how-x-users-view-experience-the-platform/', '2024-06-12', 'independent-survey', 'US survey of X users covering reasons for use, news, and politics; estimates apply to surveyed US adults/users, not global platform activity.', { geography: 'us' }),
  source('pew-news-influencers-2025', 'News Influencers Fact Sheet', 'Pew Research Center', 'https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/', '2025-11-04', 'independent-content-analysis', 'Pew-Knight sample defines news influencers as accounts regularly posting current-events/civic content with at least 100,000 followers; platform findings are sample-specific.', { geography: 'us' }),
  source('ofcom-online-nation-2025', 'Online Nation 2025', 'Ofcom', 'https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/online-research/online-nation/2025/online-nations-report-2025.pdf', '2025-12-10', 'regulatory-measurement', 'Ipsos iris UK Online Audience Measurement, May 2025, adults 18+; smartphone, tablet, and computer use only, excluding TV sets and smart displays.', { geography: 'uk' }),
  source('datareportal-x-2025', 'Essential X statistics and trends for 2025', 'DataReportal / Kepios', 'https://datareportal.com/essential-x-stats', '2025-03-12', 'independent-analysis', 'Kepios analysis of X ad-planning data for January 2025. Ad reach can include duplicate, inauthentic, and non-human accounts and is explicitly not MAU.', { geography: 'global' }),
  source('datareportal-us-2025', 'Digital 2025: The United States of America', 'DataReportal / Kepios', 'https://datareportal.com/reports/digital-2025-united-states-of-america', '2025-02-25', 'independent-analysis', 'Kepios analysis of X ad-planning data for January 2025; reports X potential ad reach as a share of the local internet user base and explicitly distinguishes ad reach from MAU.', { geography: 'us' }),
  source('datareportal-japan-2025', 'Digital 2025: Japan', 'DataReportal / Kepios', 'https://datareportal.com/reports/digital-2025-japan', '2025-02-25', 'independent-analysis', 'Kepios analysis of X ad-planning data for January 2025; reports X potential ad reach as a share of the local internet user base and explicitly distinguishes ad reach from MAU.', { geography: 'japan' }),
  source('datareportal-uk-2025', 'Digital 2025: The United Kingdom', 'DataReportal / Kepios', 'https://datareportal.com/reports/digital-2025-united-kingdom', '2025-02-25', 'independent-analysis', 'Kepios analysis of X ad-planning data for January 2025; reports X potential ad reach as a share of the local internet user base and explicitly distinguishes ad reach from MAU.', { geography: 'uk' }),
  source('sensor-tower-x-q4-2024', 'X sees a jump in consumer spending despite decline in daily active users', 'TechCrunch / Sensor Tower', 'https://techcrunch.com/2025/01/23/x-sees-a-jump-in-consumer-spending-on-mobile-despite-decline-in-daily-active-users/', '2025-01-23', 'independent-app-measurement', 'Sensor Tower mobile-app estimate: more than 313M worldwide mobile-app MAU in Q4 2024 and more than 300M in January 2025 month-to-date; web use is excluded.', { geography: 'global', deviceScope: 'ios-and-android-apps' }),
  source('sensor-tower-x-june-2025', 'As X loses its CEO, daily usage is down and competition is growing', 'TechCrunch / Sensor Tower', 'https://techcrunch.com/2025/07/10/as-x-loses-its-ceo-daily-usage-is-down-and-competition-is-growing/', '2025-07-10', 'independent-app-measurement', 'Sensor Tower worldwide iOS and Android daily-active estimate for June 2025; excludes web and does not disclose the full model in the article.', { geography: 'global', deviceScope: 'ios-and-android-apps' }),
  source('academic-twitter-day-2023', 'Just Another Day on Twitter: A Complete 24 Hours of Twitter Data', 'arXiv / multi-institution research team', 'https://arxiv.org/abs/2301.11429', '2023-01-27', 'academic-dataset', 'Globally coordinated collection by 80 scholars of approximately 375M public tweets during 24 hours beginning 2022-09-21; a content corpus, not a representative active-user panel.', { geography: 'global', archiveStatus: 'historical' }),
  source('academic-x-timeline-audit-2024', 'Lower Quantity, Higher Quality: Auditing X Algorithmic versus Chronological Timelines', 'arXiv / academic research team', 'https://arxiv.org/abs/2406.17097', '2024-06-24', 'academic-study', 'Late-2023 sociotechnical audit of 243 users and more than 800,000 posts comparing algorithmic and chronological timelines; not a population prevalence estimate.', { sampleSize: 243 }),
  source('meta-threads-500m', 'New Features to Celebrate 500 Million Monthly Users on Threads', 'Meta', 'https://about.fb.com/news/2026/06/meta-launching-new-features-500-million-monthly-threads-users/', '2026-06-16', 'primary', 'Official global Threads MAU milestone; Meta does not disclose its deduplication or activity methodology in the announcement.', { geography: 'global' }),
  source('meta-threads-live-chats', 'Live Chats on Threads', 'Meta', 'https://about.fb.com/news/2026/04/threads-live-chats/', '2026-04-22', 'primary', 'Official description of public, discoverable real-time chats, initially limited to selected communities and hosts.'),
  source('meta-fy2025-results', 'Meta Reports Fourth Quarter and Full Year 2025 Results', 'Meta Investor Relations', 'https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Fourth-Quarter-and-Full-Year-2025-Results/', '2026-01-28', 'primary-filing', 'Reports 3.58B Family daily active people for December 2025 across Facebook, Instagram, Messenger, and WhatsApp; it is not a platform-specific Facebook or Instagram metric.', { geography: 'global' }),
  source('reddit-fy2025-results', 'Reddit Reports Fourth Quarter and Full Year 2025 Results', 'Reddit Investor Relations', 'https://investor.redditinc.com/news-events/news-releases/news-details/2026/Reddit-Reports-Fourth-Quarter-and-Full-Year-2025-Results-Announces-1-Billion-Share-Repurchase-Program/default.aspx', '2026-02-05', 'primary-filing', 'Company-defined average daily active uniques (DAUq) for Q4 2025, including logged-in and logged-out users.', { geography: 'global' }),
  source('linkedin-fy2025-highlights', 'LinkedIn Business Highlights from Microsoft’s Q4 FY25 Earnings', 'LinkedIn', 'https://news.linkedin.com/2025/Q4FY25_Earnings_Highlights', '2025-07-30', 'primary', 'Official statement of 1.2B members plus engagement trends. Members are registrations and are not MAU or DAU.', { geography: 'global' }),
  source('tiktok-dsa-h2-2025', 'Digital Services Act: Our sixth transparency report', 'TikTok Newsroom', 'https://newsroom.tiktok.com/digital-services-act-our-sixth-transparency-report-on-content-moderation-in-europe?lang=en-150', '2026-02-27', 'primary-regulatory', 'H2 2025 DSA report: 178M people in the EU coming to TikTok each month; this is EU-only monthly active recipients, not global MAU.', { geography: 'eu' }),
  source('weibo-fy2025-results', 'Weibo Q4 and Fiscal Year 2025 Results', 'Weibo / SEC', 'https://www.sec.gov/Archives/edgar/data/1595761/000110465926029771/tm268894d2_ex99-1.htm', '2026-03-18', 'primary-filing', 'December 2025 company-defined MAU and average DAU; platform filing describes asymmetric following and real-time public conversation.', { geography: 'china' }),
  source('weibo-2025-20f', 'Weibo Corporation 2025 Form 20-F', 'Weibo / SEC', 'https://www.sec.gov/Archives/edgar/data/1595761/000110465926047217/wb-20251231x20f.htm', '2026-04-24', 'primary-filing', 'Audited annual filing with metric definitions, historical MAU series, business model, and risk factors.', { geography: 'china' }),
  source('zhihu-fy2025-results', 'Zhihu Q4 and Fiscal Year 2025 Results', 'Zhihu / SEC', 'https://www.sec.gov/Archives/edgar/data/1835724/000110465926034208/tm269796d1_ex99-1.htm', '2026-03-25', 'primary-filing', 'FY2025 release discloses 41+ minutes average daily time among DAUs but no exact 2025 MAU figure.', { geography: 'china' }),
  source('zhihu-2025-20f', 'Zhihu Inc. 2025 Form 20-F', 'Zhihu / SEC', 'https://www.sec.gov/Archives/edgar/data/1835724/000110465926044557/zh-20251231x20f.htm', '2026-04-28', 'primary-filing', 'Defines MAU as deduplicated mobile MAU plus logged-in web visitors; says the 2025 base remained stable but does not publish an exact 2025 MAU.', { geography: 'china' }),
  source('tencent-2025-annual', 'Tencent Annual Report 2025', 'Tencent', 'https://static.www.tencent.com/uploads/2026/04/09/62d786fcf3d3c8cb7e54791ee95439ac.pdf', '2026-04-09', 'primary-filing', 'Reports combined Weixin and WeChat MAU of 1.418B at 2025-12-31. The figure covers the whole services and cannot be assigned to Official Accounts reach.', { geography: 'global' }),
  source('wechat-oa-official-help', 'Weixin Official Accounts help centre', 'Tencent', 'https://kf.qq.com/product/weixinmp.html', ACCESSED_AT, 'primary-live-reference', 'Undated live product documentation for subscription/service accounts and follower messaging; no public Official Account audience-reach total.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('xiaohongshu-commercial', 'Xiaohongshu merchant platform', 'Xiaohongshu', 'https://zhaoshang.xiaohongshu.com/merchant/login', ACCESSED_AT, 'primary-live-reference', 'Official commercial page states 300M monthly active users; the live page does not expose a metric methodology or publication date.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('xiaohongshu-local-life', 'Xiaohongshu Local Life', 'Xiaohongshu', 'https://life.xiaohongshu.com/', ACCESSED_AT, 'primary-live-reference', 'Official commercial page describes 260M users interacting in local-life scenarios; this is a marketing reach statement, not MAU.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('questmobile-new-media-2025', '2025 New Media Ecosystem Review', 'QuestMobile', 'https://www.questmobile.com.cn/research/report/2000767092954075138/', '2025-12-17', 'independent-app-measurement', 'QuestMobile TRUTH app measurement. Public report places Xiaohongshu app MAU at 242M in May 2025; app/device scope differs from company-reported MAU.', { geography: 'china', deviceScope: 'mobile-app' }),
  source('questmobile-methodology', 'QuestMobile data sources and metric definitions', 'QuestMobile', 'https://www.questmobile.com.cn/blog/blog_41.html', '2016-04-15', 'methodology', 'Discloses multi-source device coverage across 31 provinces and 600+ cities and defines active users as users launching an app at least once in the period.', { geography: 'china', archiveStatus: 'methodology-reference' }),
  source('xiaohongshu-qilin-2025', 'Qilin: A Multimodal Information Retrieval Dataset with APP-level User Sessions', 'arXiv / Xiaohongshu research team', 'https://arxiv.org/abs/2503.00501', '2025-03-01', 'academic-dataset', 'Method-published Xiaohongshu session dataset covering heterogeneous search results; reports search penetration above 70%, but is not an active-user census.', { geography: 'china' }),
  source('jike-app-store', '即刻 App listing', 'If Tech / Apple App Store', 'https://apps.apple.com/cn/app/%E5%8D%B3%E5%88%BBapp/id966129812', ACCESSED_AT, 'primary-distributor-listing', 'Developer-supplied product description documents interest circles, personalised recommendation, comments, and Jike Yellow pricing; it provides no active-user count.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('jike-official-site', '即刻 official site', 'If Tech', 'https://www.okjike.com/', ACCESSED_AT, 'primary-live-reference', 'Official product landing endpoint verified live; no public user metric or audience methodology is disclosed.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('appinchina-index-2025', 'AppInChina App Index', 'AppInChina', 'https://appinchina.co/market/apps/', '2025-11-30', 'independent-app-index', 'Monthly-active ranking for Android apps in China, last updated November 2025; no public Jike value was available in the accessible index.', { geography: 'china', deviceScope: 'android-apps' }),
]

const sourceDimensionCoverage = {
  'x-eu-amars-history': ['reach'],
  'x-ads-audience-estimate': ['reach'],
  'x-creator-revenue': ['native-monetization'],
  'x-creator-subscriptions': ['native-monetization'],
  'x-organic-best-practices': ['public-conversation', 'external-links'],
  'x-how-to-post': ['production-cost', 'external-links'],
  'x-articles': ['content-longevity', 'search-value', 'production-cost', 'native-monetization'],
  'x-spaces': ['realtime', 'content-longevity', 'public-conversation'],
  'x-search': ['realtime', 'search-value', 'public-conversation'],
  'x-reposts': ['realtime', 'public-conversation', 'follow-graph'],
  'x-replies': ['public-conversation', 'algorithmic-distribution', 'follow-graph'],
  'x-post-links': ['external-links'],
  'eu-x-dsa-fine-2025': ['brand-safety', 'data-transparency'],
  'eu-x-action-plan-2026': ['data-transparency'],
  'x-global-mau-self-2025': ['reach'],
  'pew-social-2025': ['reach'],
  'ofcom-online-nation-2025': ['reach', 'brand-safety'],
  'datareportal-x-2025': ['reach', 'chinese-reach', 'internationalization'],
  'sensor-tower-x-q4-2024': ['reach'],
  'sensor-tower-x-june-2025': ['reach'],
  'meta-threads-500m': ['reach', 'algorithmic-distribution', 'internationalization'],
  'meta-threads-live-chats': ['realtime', 'content-longevity', 'public-conversation', 'external-links'],
  'reddit-fy2025-results': ['reach', 'public-conversation', 'internationalization', 'data-transparency'],
  'linkedin-fy2025-highlights': ['reach', 'professional-relationships', 'data-transparency'],
  'tiktok-dsa-h2-2025': ['reach', 'brand-safety', 'data-transparency'],
  'weibo-fy2025-results': ['reach', 'realtime', 'search-value', 'public-conversation', 'algorithmic-distribution', 'follow-graph', 'chinese-reach', 'internationalization', 'native-monetization', 'data-transparency'],
  'weibo-2025-20f': ['reach', 'realtime', 'public-conversation', 'follow-graph', 'chinese-reach', 'internationalization', 'native-monetization', 'data-transparency'],
  'zhihu-fy2025-results': ['search-value', 'professional-relationships', 'algorithmic-distribution', 'chinese-reach'],
  'zhihu-2025-20f': ['search-value', 'professional-relationships', 'algorithmic-distribution', 'chinese-reach', 'data-transparency'],
  'wechat-oa-official-help': ['follow-graph', 'private-audience'],
  'xiaohongshu-commercial': ['native-monetization', 'data-transparency'],
  'xiaohongshu-local-life': ['native-monetization'],
  'questmobile-new-media-2025': ['reach', 'chinese-reach', 'data-transparency'],
  'questmobile-methodology': ['reach', 'chinese-reach', 'data-transparency'],
  'xiaohongshu-qilin-2025': ['search-value'],
  'jike-app-store': ['content-longevity', 'public-conversation', 'algorithmic-distribution', 'native-monetization'],
}

for (const item of sources) item.supportedDimensionIds = sourceDimensionCoverage[item.id] || []

function observation({
  id, platformId, metricId, valueType = 'exact', value, unit, periodStart, periodEnd,
  publishedAt, geography, segments = [], methodology, sourceId, confidence = 'high',
  comparability = 'same-metric-only', conflictGroupId = null, status = 'current', editorNote = '',
}) {
  return {
    id, platformId, metricId, valueType, value, unit, periodStart, periodEnd, publishedAt,
    geography, segments, methodology, sourceId, confidence, comparability, conflictGroupId,
    status, snapshotId: '2026-q2', editorNote,
  }
}

const observations = [
  observation({ id: 'x-global-mau-self-2025', platformId: 'x', metricId: 'mau', value: 600000000, unit: 'people', periodStart: '2025-04-01', periodEnd: '2025-04-30', publishedAt: '2025-04-30', geography: 'global', methodology: 'X CEO claim reported contemporaneously; methodology not disclosed.', sourceId: 'x-global-mau-self-2025', confidence: 'disputed', comparability: 'directional-only', conflictGroupId: 'x-global-mau-2025', editorNote: 'Self-reported global MAU; no public deduplication or bot methodology.' }),
  observation({ id: 'x-global-mobile-mau-sensor-q4-2024', platformId: 'x', metricId: 'mau', value: 313000000, unit: 'people', periodStart: '2024-10-01', periodEnd: '2024-12-31', publishedAt: '2025-01-23', geography: 'global', methodology: 'Sensor Tower estimate of worldwide iOS and Android app MAU; web excluded.', sourceId: 'sensor-tower-x-q4-2024', confidence: 'reference', comparability: 'different-device-scope', conflictGroupId: 'x-global-mau-2025', status: 'historical', editorNote: 'Independent mobile-app estimate, not total-platform MAU.' }),
  observation({ id: 'x-global-ad-reach-2025-01', platformId: 'x', metricId: 'ad-reach', value: 586000000, unit: 'people', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'global', methodology: 'Kepios analysis of X advertising planning tools.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-reach-only', editorNote: 'Potential ad reach is never MAU and may include duplicate, non-human, or inauthentic accounts.' }),
  observation({ id: 'x-us-ad-reach-2025-01', platformId: 'x', metricId: 'ad-reach', value: 104000000, unit: 'people', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'us', methodology: 'Kepios analysis of X advertising planning tools.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-reach-only', editorNote: 'Potential ad reach; not US MAU.' }),
  observation({ id: 'x-japan-ad-reach-2025-01', platformId: 'x', metricId: 'ad-reach', value: 70900000, unit: 'people', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'japan', methodology: 'Kepios analysis of X advertising planning tools.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-reach-only', editorNote: 'Potential ad reach; not Japan MAU.' }),
  observation({ id: 'x-uk-ad-reach-2025-01', platformId: 'x', metricId: 'ad-reach', value: 22900000, unit: 'people', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'uk', methodology: 'Kepios analysis of X advertising planning tools.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-reach-only', editorNote: 'Potential ad reach; not UK MAU.' }),
  observation({ id: 'x-us-internet-penetration-2025-01', platformId: 'x', metricId: 'internet-penetration', valueType: 'percentage', value: 32.2, unit: 'percent', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-02-25', geography: 'us', methodology: 'Kepios analysis comparing X potential advertising reach with the local internet user base, regardless of age.', sourceId: 'datareportal-us-2025', confidence: 'reference', comparability: 'ad-reach-share-of-local-internet-users', editorNote: 'X ad reach equalled 32.2% of the US internet user base; this is ad reach penetration, not MAU penetration.' }),
  observation({ id: 'x-japan-internet-penetration-2025-01', platformId: 'x', metricId: 'internet-penetration', valueType: 'percentage', value: 65.2, unit: 'percent', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-02-25', geography: 'japan', methodology: 'Kepios analysis comparing X potential advertising reach with the local internet user base, regardless of age.', sourceId: 'datareportal-japan-2025', confidence: 'reference', comparability: 'ad-reach-share-of-local-internet-users', editorNote: 'X ad reach equalled 65.2% of Japan’s internet user base; this is ad reach penetration, not MAU penetration.' }),
  observation({ id: 'x-uk-internet-penetration-2025-01', platformId: 'x', metricId: 'internet-penetration', valueType: 'percentage', value: 33.7, unit: 'percent', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-02-25', geography: 'uk', methodology: 'Kepios analysis comparing X potential advertising reach with the local internet user base, regardless of age.', sourceId: 'datareportal-uk-2025', confidence: 'reference', comparability: 'ad-reach-share-of-local-internet-users', editorNote: 'X ad reach equalled 33.7% of the UK internet user base; this is ad reach penetration, not MAU penetration.' }),
  observation({ id: 'x-ad-audience-female-2025-01', platformId: 'x', metricId: 'gender-share', valueType: 'percentage', value: 36.3, unit: 'percent', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'global', segments: ['female', 'ad-audience'], methodology: 'Gender identifiers reported by X advertising tools and analysed by Kepios.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-audience-only', editorNote: 'Share of ad audience, not all active users.' }),
  observation({ id: 'x-ad-audience-male-2025-01', platformId: 'x', metricId: 'gender-share', valueType: 'percentage', value: 63.7, unit: 'percent', periodStart: '2025-01-01', periodEnd: '2025-01-31', publishedAt: '2025-03-12', geography: 'global', segments: ['male', 'ad-audience'], methodology: 'Gender identifiers reported by X advertising tools and analysed by Kepios.', sourceId: 'datareportal-x-2025', confidence: 'reference', comparability: 'ad-audience-only', editorNote: 'Share of ad audience, not all active users.' }),
  observation({ id: 'x-mobile-dau-2025-06', platformId: 'x', metricId: 'dau', value: 132000000, unit: 'people', periodStart: '2025-06-01', periodEnd: '2025-06-30', publishedAt: '2025-07-10', geography: 'global', methodology: 'Sensor Tower estimate for iOS and Android apps.', sourceId: 'sensor-tower-x-june-2025', confidence: 'reference', comparability: 'different-device-scope', editorNote: 'Worldwide mobile app DAU; web excluded.' }),
  observation({ id: 'x-eu-amars-2024-h1', platformId: 'x', metricId: 'mau', value: 105994838, unit: 'people', periodStart: '2024-02-01', periodEnd: '2024-07-31', publishedAt: '2024-08-31', geography: 'eu', methodology: 'Article 24(2) AMARS: logged-in users plus logged-out guests, IP geolocation, bots excluded.', sourceId: 'x-eu-amars-history', confidence: 'high', comparability: 'eu-dsa-recipients-only', status: 'historical', editorNote: 'EU-only active recipients; never presented as global MAU.' }),
  observation({ id: 'x-uk-monthly-visitors-2025-05', platformId: 'x', metricId: 'monthly-visitors', value: 19300000, unit: 'people', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris, UK online adults 18+, smartphones/tablets/computers; TV and smart displays excluded.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only', editorNote: 'Monthly visitors, not MAU.' }),
  observation({ id: 'x-uk-daily-minutes-2025-05', platformId: 'x', metricId: 'daily-minutes', value: 6, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Monthly time per visitor divided by days in May; adults 18+, smartphone/tablet/computer only.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only', editorNote: 'Average among measured UK adult visitors.' }),
  observation({ id: 'x-revenue-share-threshold-2026', platformId: 'x', metricId: 'creator-threshold', valueType: 'qualitative', value: 'Premium tier + 5M organic impressions / 3 months + 500 verified followers', unit: 'qualitative', periodStart: '2026-07-20', periodEnd: '2026-07-20', publishedAt: '2026-07-20', geography: 'supported-countries', methodology: 'Live X Help eligibility requirements.', sourceId: 'x-creator-revenue', confidence: 'high', comparability: 'program-specific', editorNote: 'Eligibility can change; verified on access date.' }),
  observation({ id: 'x-subscriptions-threshold-2026', platformId: 'x', metricId: 'creator-threshold', valueType: 'qualitative', value: 'Age 18+ + active in 30 days + 2,000 verified followers + 5M organic impressions / 3 months', unit: 'qualitative', periodStart: '2026-07-20', periodEnd: '2026-07-20', publishedAt: '2026-07-20', geography: 'supported-countries', methodology: 'Live X Help eligibility requirements.', sourceId: 'x-creator-subscriptions', confidence: 'high', comparability: 'program-specific', editorNote: 'Eligibility can change; verified on access date.' }),
  observation({ id: 'threads-global-mau-2026-06', platformId: 'threads', metricId: 'mau', value: 500000000, unit: 'people', periodStart: '2026-06-01', periodEnd: '2026-06-16', publishedAt: '2026-06-16', geography: 'global', methodology: 'Official Meta milestone; detailed activity and deduplication methodology not disclosed.', sourceId: 'meta-threads-500m', confidence: 'reference', comparability: 'company-defined-mau', editorNote: 'Official Threads MAU, distinct from Meta Family DAP.' }),
  observation({ id: 'threads-uk-monthly-visitors-2025-05', platformId: 'threads', metricId: 'monthly-visitors', value: 4300000, unit: 'people', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+, smartphone/tablet/computer.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only', editorNote: 'Monthly visitors, not global MAU.' }),
  observation({ id: 'facebook-uk-daily-minutes-2025-05', platformId: 'facebook', metricId: 'daily-minutes', value: 43, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+; Facebook and Messenger combined.', sourceId: 'ofcom-online-nation-2025', confidence: 'reference', comparability: 'combined-service-device-panel', editorNote: 'Facebook/Messenger combined; retained exactly as Ofcom reports it.' }),
  observation({ id: 'instagram-uk-daily-minutes-2025-05', platformId: 'instagram', metricId: 'daily-minutes', value: 20, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+, smartphone/tablet/computer.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only' }),
  observation({ id: 'tiktok-eu-mau-2025-h2', platformId: 'tiktok', metricId: 'mau', value: 178300000, unit: 'people', periodStart: '2025-07-01', periodEnd: '2025-12-31', publishedAt: '2026-02-27', geography: 'eu', methodology: 'DSA average monthly active recipients across EU member states.', sourceId: 'tiktok-dsa-h2-2025', confidence: 'high', comparability: 'eu-dsa-recipients-only', editorNote: 'EU-only; not global MAU.' }),
  observation({ id: 'tiktok-uk-daily-minutes-2025-05', platformId: 'tiktok', metricId: 'daily-minutes', value: 28, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+, smartphone/tablet/computer.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only' }),
  observation({ id: 'reddit-global-dauq-2025-q4', platformId: 'reddit', metricId: 'dau', value: 121400000, unit: 'people', periodStart: '2025-10-01', periodEnd: '2025-12-31', publishedAt: '2026-02-05', geography: 'global', methodology: 'Reddit company-defined quarterly average daily active uniques, logged-in and logged-out.', sourceId: 'reddit-fy2025-results', confidence: 'high', comparability: 'company-defined-dauq', editorNote: 'DAUq, not MAU.' }),
  observation({ id: 'reddit-uk-daily-minutes-2025-05', platformId: 'reddit', metricId: 'daily-minutes', value: 4, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+, smartphone/tablet/computer.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only' }),
  observation({ id: 'linkedin-uk-daily-minutes-2025-05', platformId: 'linkedin', metricId: 'daily-minutes', value: 2, unit: 'minutes', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-10', geography: 'uk', methodology: 'Ipsos iris UK adults 18+, smartphone/tablet/computer.', sourceId: 'ofcom-online-nation-2025', confidence: 'high', comparability: 'uk-device-panel-only', editorNote: 'LinkedIn 1.2B member count is intentionally not recorded as MAU.' }),
  observation({ id: 'linkedin-registered-members-2025-07', platformId: 'linkedin', metricId: 'registered-members', value: 1200000000, unit: 'people', periodStart: '2025-07-30', periodEnd: '2025-07-30', publishedAt: '2025-07-30', geography: 'global', methodology: 'Official registered-member count; registrations are not a measure of monthly or daily activity.', sourceId: 'linkedin-fy2025-highlights', confidence: 'high', comparability: 'registered-members-only', editorNote: 'Registered members are never represented as MAU or DAU.' }),
  observation({ id: 'weibo-mau-2025-12', platformId: 'weibo', metricId: 'mau', value: 567000000, unit: 'people', periodStart: '2025-12-01', periodEnd: '2025-12-31', publishedAt: '2026-03-18', geography: 'china', methodology: 'Company-defined December MAU in FY2025 results.', sourceId: 'weibo-fy2025-results', confidence: 'high', comparability: 'company-defined-mau' }),
  observation({ id: 'weibo-dau-2025-12', platformId: 'weibo', metricId: 'dau', value: 252000000, unit: 'people', periodStart: '2025-12-01', periodEnd: '2025-12-31', publishedAt: '2026-03-18', geography: 'china', methodology: 'Company-defined average December DAU in FY2025 results.', sourceId: 'weibo-fy2025-results', confidence: 'high', comparability: 'company-defined-dau' }),
  observation({ id: 'zhihu-dau-daily-minutes-2025-q4', platformId: 'zhihu', metricId: 'daily-minutes', value: 41, unit: 'minutes', periodStart: '2025-10-01', periodEnd: '2025-12-31', publishedAt: '2026-03-25', geography: 'china', methodology: 'Company-reported average time among DAUs in Q4 2025.', sourceId: 'zhihu-fy2025-results', confidence: 'high', comparability: 'company-defined-dau-time', editorNote: 'Applies to DAUs, not all MAUs.' }),
  observation({ id: 'xiaohongshu-mobile-mau-quest-2025-05', platformId: 'xiaohongshu', metricId: 'mau', value: 242000000, unit: 'people', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-17', geography: 'china', methodology: 'QuestMobile TRUTH app active users: at least one app launch in the month, modelled from multi-source device data.', sourceId: 'questmobile-new-media-2025', confidence: 'reference', comparability: 'mobile-app-only', editorNote: 'Independent China mobile-app measurement; no official observation with matching period and scope is available for conflict comparison.' }),
]

const pewProfiles = {
  x: { use: 21, age: [33, 25, 16, 10], gender: [25, 16], income: [16, 19, 26, 25], education: [16, 23, 24] },
  threads: { use: 8, age: [15, 10, 6, 3], gender: [8, 9], income: [8, 9, 10, 7], education: [7, 9, 9] },
  facebook: { use: 71, age: [68, 80, 74, 57], gender: [63, 78], income: [71, 72, 72, 71], education: [69, 73, 71] },
  instagram: { use: 50, age: [80, 62, 40, 19], gender: [44, 55], income: [41, 46, 54, 60], education: [41, 53, 58] },
  tiktok: { use: 37, age: [63, 44, 30, 12], gender: [30, 42], income: [42, 40, 39, 30], education: [40, 42, 29] },
  reddit: { use: 26, age: [48, 35, 16, 6], gender: [29, 23], income: [17, 22, 29, 37], education: [15, 28, 37] },
}

const pewSegmentDefinitions = [
  ['age-use-rate', ['age-18-29', 'age-30-49', 'age-50-64', 'age-65-plus'], 'age'],
  ['gender-use-rate', ['men', 'women'], 'gender'],
  ['income-use-rate', ['income-under-30000', 'income-30000-69999', 'income-70000-99999', 'income-100000-plus'], 'income'],
  ['education-use-rate', ['high-school-or-less', 'some-college', 'college-graduate'], 'education'],
]

for (const [platformId, profile] of Object.entries(pewProfiles)) {
  observations.push(observation({
    id: `${platformId}-us-adult-use-2025`, platformId, metricId: 'adult-use-rate',
    valueType: 'percentage', value: profile.use, unit: 'percent', periodStart: '2025-02-05',
    periodEnd: '2025-06-18', publishedAt: '2025-11-20', geography: 'us', segments: ['adults-18-plus'],
    methodology: 'Pew NPORS address-based probability survey of 5,022 US adults; web, mail, and phone; weighted.',
    sourceId: 'pew-social-2025', confidence: 'high', comparability: 'us-adult-survey-use-rate',
    editorNote: 'Share of US adults who say they ever use the platform; not platform MAU.',
  }))
  for (const [metricId, segmentIds, profileKey] of pewSegmentDefinitions) {
    profile[profileKey].forEach((value, index) => observations.push(observation({
      id: `${platformId}-us-${segmentIds[index]}-use-2025`, platformId, metricId,
      valueType: 'percentage', value, unit: 'percent', periodStart: '2025-02-05',
      periodEnd: '2025-06-18', publishedAt: '2025-11-20', geography: 'us',
      segments: ['adults-18-plus', segmentIds[index]],
      methodology: 'Pew NPORS address-based probability survey of 5,022 US adults; web, mail, and phone; weighted.',
      sourceId: 'pew-social-2025', confidence: 'high', comparability: 'us-adult-cohort-use-rate',
      editorNote: 'Use rate within the named US adult cohort, not the cohort share of platform users.',
    })))
  }
}

observations.push(observation({
  id: 'linkedin-us-adult-use-2025', platformId: 'linkedin', metricId: 'adult-use-rate',
  valueType: 'percentage', value: 25, unit: 'percent', periodStart: '2025-02-05', periodEnd: '2025-06-18',
  publishedAt: '2025-11-20', geography: 'us', segments: ['adults-18-plus'],
  methodology: 'Pew NPORS address-based probability survey of 5,022 US adults; web, mail, and phone; weighted.',
  sourceId: 'pew-social-2025', confidence: 'high', comparability: 'us-adult-survey-use-rate',
  editorNote: 'Share of US adults who say they ever use LinkedIn; the 1.2B member count is not MAU.',
}))

observations.push(observation({
  id: 'x-us-news-reason-2024', platformId: 'x', metricId: 'news-use-rate', valueType: 'percentage',
  value: 65, unit: 'percent', periodStart: '2024-03-18', periodEnd: '2024-03-24',
  publishedAt: '2024-06-12', geography: 'us', segments: ['x-users', 'news-major-or-minor-reason'],
  methodology: 'Pew American Trends Panel survey of US adult X users; share saying getting news is a major or minor reason they use X.',
  sourceId: 'pew-x-experience-2024', confidence: 'high', comparability: 'us-x-user-news-reason-survey',
  editorNote: 'Applies to surveyed US adult X users, not all US adults and not global X users.',
}))

function operationalInsight({
  id, title, summary, category, evidenceType, evidenceObservationIds = [], evidenceSourceIds = [],
  audienceGoal = ['technology-creator'], geographies = ['global'], confidence = 'reference', ...details
}) {
  return {
    id, title, summary, category, evidenceType, audienceGoal, geographies, segmentFilters: [],
    evidenceObservationIds, evidenceSourceIds, confidence, validFrom: '2026-04-01', validTo: null,
    snapshotId: '2026-q2', lastVerifiedAt: ACCESSED_AT, status: 'current', ...details,
  }
}

const insights = [
  operationalInsight({
    id: 'x-content-formats', category: 'content', mechanicId: 'formats', evidenceType: '当前产品规则', confidence: 'high',
    title: '文本、图片、视频、长文与 Spaces 都有当前产品依据',
    summary: '普通帖子支持文本、图片、GIF、视频和链接；Articles 提供长文，Spaces 提供公开直播音频及可选回放。部分长内容能力与 Premium 资格相关，产品存在不代表各格式效果相同。',
    evidenceSourceIds: ['x-how-to-post', 'x-articles', 'x-spaces'],
  }),
  operationalInsight({
    id: 'x-discovery-surfaces', category: 'distribution', mechanicId: 'discovery-surfaces', evidenceType: '当前产品规则', confidence: 'high',
    title: '发现入口同时包含搜索、最新结果与算法排序',
    summary: 'X Search 当前支持帖子、账号、对话、媒体和新闻等结果，并区分 Top 与 Latest；这证明发现入口并非单一关注时间线，但不等于所有帖子都能获得推荐。',
    evidenceSourceIds: ['x-search', 'x-replies'],
  }),
  operationalInsight({
    id: 'x-relationship-propagation', category: 'distribution', mechanicId: 'relationship-propagation', evidenceType: '当前产品规则', confidence: 'high',
    title: '转帖、引用与回复把内容传播和关系互动连接起来',
    summary: '转帖会把原帖分发给转帖者的关注者，引用帖可附加评论或媒体；回复可进入相关关系链和通知。可见性同时受关注关系、对话相关性和排序信号影响。',
    evidenceSourceIds: ['x-reposts', 'x-replies'],
  }),
  operationalInsight({
    id: 'x-content-lifespan-limit', category: 'content', mechanicId: 'content-lifespan', evidenceType: '编辑推断',
    title: '公开资料不能给出统一的“帖子寿命”',
    summary: '当前规则证明帖子可被搜索、转帖和再次引用，录制的 Spaces 也可回放；但现有来源没有给出跨格式、跨账号可复核的曝光半衰期，因此不展示统一寿命数字。',
    evidenceSourceIds: ['x-search', 'x-reposts', 'x-spaces'],
  }),
  operationalInsight({
    id: 'x-search-value-bounded', category: 'content', mechanicId: 'search-value', evidenceType: '编辑推断',
    title: '站内搜索存在，但长尾搜索价值尚无可比量化证据',
    summary: 'X 提供关键词、话题、Top、Latest 和高级筛选，Articles 也可承载长文；这些是功能事实，不能直接推导稳定的长期搜索流量。教程和常青知识仍应保留其他搜索型渠道。',
    evidenceSourceIds: ['x-search', 'x-articles', 'zhihu-2025-20f', 'xiaohongshu-qilin-2025'],
  }),
  operationalInsight({
    id: 'x-external-link-behaviour', category: 'content', mechanicId: 'external-links', evidenceType: '当前产品规则', confidence: 'high',
    title: '外链可以发布，但公开规则没有证明统一“外链降权”',
    summary: '官方帮助页确认帖子可包含链接且链接经 t.co 包装，官方经营建议也支持明确行动号召；仓库内没有当前、可复核的统一外链排序惩罚证据，因此不把传言写成规则。',
    evidenceSourceIds: ['x-post-links', 'x-how-to-post', 'x-organic-best-practices'],
  }),
  operationalInsight({
    id: 'x-creator-fit-primary', category: 'creator-fit', verdict: 'fit', evidenceType: '编辑推断',
    title: '适合 X：科技发布、实时评论、国际同行关系、人物型账号。',
    summary: '实时搜索、公开回复、转帖与引用构成可被发现的公共对话链；全球广告受众与美国新闻使用调查说明它仍适合跨语种发布和事件评论，但广告触达不等于 MAU。',
    evidenceObservationIds: ['x-global-ad-reach-2025-01', 'x-us-news-reason-2024'],
    evidenceSourceIds: ['x-search', 'x-reposts', 'x-replies'],
  }),
  operationalInsight({
    id: 'x-creator-fit-complement', category: 'creator-fit', verdict: 'complement', evidenceType: '编辑推断',
    title: '适合作为组合渠道：教程、长尾知识、中文大众内容、私域经营。',
    summary: 'X 可承担发布、讨论和关系连接；知乎、小红书与公众号的公开材料分别提供长内容、搜索或关注触达依据。组合建议是跨平台编辑判断，不表示 X 完全不支持这些目标。',
    evidenceSourceIds: ['x-search', 'zhihu-2025-20f', 'xiaohongshu-qilin-2025', 'wechat-oa-official-help'],
  }),
  operationalInsight({
    id: 'x-creator-fit-avoid-only', category: 'creator-fit', verdict: 'avoid-only', evidenceType: '编辑推断',
    title: '不适合只做 X：依赖稳定搜索沉淀、强站内交易或低互动批量分发的目标。',
    summary: '现有证据支持搜索和商业化功能的存在，却没有稳定长尾曝光或强站内交易闭环的可比证明；官方创作者收入规则又把有效互动、资格和支付条件置于核心，因此不应把 X 当作唯一渠道。',
    evidenceObservationIds: ['x-revenue-share-threshold-2026'],
    evidenceSourceIds: ['x-search', 'x-creator-revenue', 'xiaohongshu-commercial', 'wechat-oa-official-help'],
  }),
  operationalInsight({
    id: 'x-monetization-eligibility', category: 'monetization', playbookArea: 'eligibility', evidenceType: '当前产品规则', confidence: 'high',
    title: '收入分成有明确但较高的资格门槛',
    summary: '截至核验日，官方列出的基础门槛包括有效 Premium 层级、三个月 500 万自然曝光、500 名认证关注者、支持地区及合规要求；资格会变化，应以设置页复核。',
    evidenceObservationIds: ['x-revenue-share-threshold-2026'], evidenceSourceIds: ['x-creator-revenue'],
  }),
  operationalInsight({
    id: 'x-monetization-payout-geography', category: 'monetization', playbookArea: 'payout-geography', evidenceType: '当前产品规则', confidence: 'high',
    title: '可申请不等于所在地一定能收款',
    summary: '收入分成与订阅均依赖支付服务商支持的国家或地区，并要求 Stripe 与身份信息；创作者应在投入前核对当前列表和本地收款条件。',
    evidenceSourceIds: ['x-creator-revenue', 'x-creator-subscriptions'],
  }),
  operationalInsight({
    id: 'x-monetization-subscriptions', category: 'monetization', playbookArea: 'subscriptions', evidenceType: '当前产品规则', confidence: 'high',
    title: '订阅提供经常性收入和会员内容工具',
    summary: '订阅支持专属帖子、回复、Spaces 和站内外订阅链接；申请门槛包括年满 18 岁、近 30 天活跃、2,000 名认证关注者和三个月 500 万自然曝光。',
    evidenceObservationIds: ['x-subscriptions-threshold-2026'], evidenceSourceIds: ['x-creator-subscriptions'],
  }),
  operationalInsight({
    id: 'x-monetization-policy-stability', category: 'monetization', playbookArea: 'revenue-stability', evidenceType: '当前产品规则',
    title: '收入分成不是可视为固定不变的合同现金流',
    summary: '官方规则写明 X 可基于商业、财务或法律原因修改或取消收入分成，并可决定接受或撤销参与资格。经营预算应把分成视作波动收入。',
    evidenceSourceIds: ['x-creator-revenue'],
  }),
  operationalInsight({
    id: 'x-monetization-external-conversion', category: 'monetization', playbookArea: 'external-conversion', evidenceType: '编辑推断',
    title: '外部转化路径可用，但需要自有落地页承接',
    summary: '帖子支持外链和行动号召，订阅页链接也可站内外分享；这些规则证明路径存在，不证明点击率。对产品、通讯或社群的转化仍需用自有分析工具测量。',
    evidenceSourceIds: ['x-post-links', 'x-organic-best-practices', 'x-creator-subscriptions'],
  }),
  operationalInsight({
    id: 'x-platform-risk-measurement', category: 'platform-risk', riskScope: 'platform', severity: 'high', evidenceType: '监管材料',
    title: '规模口径与数据透明度风险',
    summary: '公司自报全球 MAU、移动 App 测量和广告触达的定义与覆盖范围不同；欧盟处罚也涉及广告资料库和研究者数据访问。经营判断不能依赖单一总量。',
    evidenceObservationIds: ['x-global-mau-self-2025', 'x-global-mobile-mau-sensor-q4-2024', 'x-global-ad-reach-2025-01'],
    evidenceSourceIds: ['eu-x-dsa-fine-2025'],
  }),
  operationalInsight({
    id: 'x-platform-risk-data-access-change', category: 'platform-risk', riskScope: 'platform', severity: 'medium', evidenceType: '监管材料', status: 'changed',
    title: '研究与广告资料访问正在整改',
    summary: '欧盟委员会已接受 X 的广告资料库搜索/API 与合格研究者访问行动计划，但实施仍受监管监督；这是状态变化，不等于透明度问题已经消失。',
    evidenceSourceIds: ['eu-x-dsa-fine-2025', 'eu-x-action-plan-2026'],
  }),
  operationalInsight({
    id: 'x-platform-risk-brand-safety', category: 'platform-risk', riskScope: 'platform', severity: 'high', evidenceType: '监管材料',
    title: '内容治理与品牌邻接需要单独评估',
    summary: '欧盟最终决定记录蓝标设计与透明度问题，Ofcom 的英国测量也记录平台伤害暴露。证据地域有限，但足以要求品牌主对敏感议题、评论区和投放邻接做额外审查。',
    evidenceSourceIds: ['eu-x-dsa-fine-2025', 'ofcom-online-nation-2025'],
  }),
  operationalInsight({
    id: 'x-creator-risk-thresholds', category: 'creator-risk', riskScope: 'creator', severity: 'medium', evidenceType: '当前产品规则', confidence: 'high',
    title: '变现门槛依赖认证关注与大规模自然曝光',
    summary: '收入分成和订阅都要求三个月 500 万自然曝光，且分别要求认证关注者门槛。达到受众规模并不自动保证持续符合资格。',
    evidenceObservationIds: ['x-revenue-share-threshold-2026', 'x-subscriptions-threshold-2026'],
    evidenceSourceIds: ['x-creator-revenue', 'x-creator-subscriptions'],
  }),
  operationalInsight({
    id: 'x-creator-risk-payout', category: 'creator-risk', riskScope: 'creator', severity: 'medium', evidenceType: '当前产品规则', confidence: 'high',
    title: '支付地区、身份核验与第三方费用影响到手收入',
    summary: '可收款地区由支付服务商支持范围决定，订阅收入还可能受应用商店费用、退款和拒付影响；核验地区和税务条件应早于内容投入。',
    evidenceSourceIds: ['x-creator-revenue', 'x-creator-subscriptions'],
  }),
  operationalInsight({
    id: 'x-creator-risk-channel-dependence', category: 'creator-risk', riskScope: 'creator', severity: 'high', evidenceType: '编辑推断',
    title: '把 X 作为唯一分发和收入渠道会放大政策波动',
    summary: '平台可修改或取消收入分成，搜索长尾效果又缺少稳定量化证据。应同步保留网站、邮件列表或其他可迁移受众渠道，降低单平台政策变化的影响。',
    evidenceSourceIds: ['x-creator-revenue', 'x-search', 'wechat-oa-official-help'],
  }),
  { id: 'x-public-realtime', title: '实时公共讨论仍是 X 的核心差异', summary: '新闻、科技发布和人物关系链仍有优势，但规模与安全判断必须并列展示第三方测量和监管证据。', audienceGoal: ['technology-creator', 'news'], geographies: ['global'], segmentFilters: [], evidenceObservationIds: ['x-global-mau-self-2025', 'x-global-mobile-mau-sensor-q4-2024', 'x-uk-daily-minutes-2025-05'], evidenceSourceIds: ['x-recommendation-code', 'eu-x-dsa-fine-2025'], confidence: 'disputed', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'threads-scale-community', title: 'Threads 已进入大规模公共社区阶段', summary: '官方 5 亿 MAU 与 Live Chats 表明规模和实时产品能力继续增强。', audienceGoal: ['community', 'consumer'], geographies: ['global'], segmentFilters: [], evidenceObservationIds: ['threads-global-mau-2026-06', 'threads-uk-monthly-visitors-2025-05'], evidenceSourceIds: ['meta-threads-live-chats'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'facebook-broad-reach', title: 'Facebook 仍具广泛成年受众覆盖', summary: '美国调查显示跨年龄覆盖较广；Meta Family DAP 不应拆分成 Facebook 单平台活跃数。', audienceGoal: ['broad-reach'], geographies: ['us', 'global'], segmentFilters: [], evidenceObservationIds: ['facebook-us-adult-use-2025', 'facebook-us-age-65-plus-use-2025'], evidenceSourceIds: ['meta-fy2025-results'], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'instagram-visual-youth', title: 'Instagram 的年轻视觉受众优势明确', summary: 'Pew 的美国成年人分组数据和 Ofcom 的英国使用时长都显示年轻、视觉化分发优势。', audienceGoal: ['visual-creator', 'consumer'], geographies: ['us', 'uk'], segmentFilters: ['age-18-29'], evidenceObservationIds: ['instagram-us-age-18-29-use-2025', 'instagram-uk-daily-minutes-2025-05'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'tiktok-eu-scale-video', title: 'TikTok 的欧盟规模和消费时长都很高', summary: '欧盟 DSA 月活跃接收者与英国时长指标支持其视频分发强度，但地域不可外推为全球 MAU。', audienceGoal: ['video-creator', 'consumer'], geographies: ['eu', 'uk'], segmentFilters: [], evidenceObservationIds: ['tiktok-eu-mau-2025-h2', 'tiktok-uk-daily-minutes-2025-05'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'reddit-community-depth', title: 'Reddit 的主题社区具有持续讨论价值', summary: 'DAUq 提供规模基准，Pew 数据显示美国年轻和高学历人群使用率较高。', audienceGoal: ['community', 'research'], geographies: ['global', 'us'], segmentFilters: [], evidenceObservationIds: ['reddit-global-dauq-2025-q4', 'reddit-us-college-graduate-use-2025'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'linkedin-professional-graph', title: 'LinkedIn 的专业关系链定位最清晰', summary: '官方会员规模支持网络广度但不是 MAU；活跃判断需使用独立访问或调查指标。', audienceGoal: ['professional', 'b2b'], geographies: ['global', 'us', 'uk'], segmentFilters: [], evidenceObservationIds: ['linkedin-us-adult-use-2025', 'linkedin-uk-daily-minutes-2025-05'], evidenceSourceIds: ['linkedin-fy2025-highlights'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'weibo-public-china', title: '微博仍是中国大规模实时公共讨论平台', summary: '2025 年末 MAU、DAU 与公司对非对称关系链和实时传播的定义共同支持这一定位。', audienceGoal: ['news', 'public-conversation'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['weibo-mau-2025-12', 'weibo-dau-2025-12'], evidenceSourceIds: ['weibo-2025-20f'], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'zhihu-search-depth', title: '知乎的长内容与搜索价值仍强', summary: '公司披露 DAU 日均 41 分钟且强调专家和可信内容，但 2025 精确 MAU 未披露。', audienceGoal: ['knowledge', 'search'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['zhihu-dau-daily-minutes-2025-q4'], evidenceSourceIds: ['zhihu-2025-20f'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'xiaohongshu-search-commerce', title: '小红书兼具搜索、内容和商业转化', summary: 'QuestMobile 提供中国移动 App 月活估计；官方商业页缺少时期与地域范围，只作为产品证据而不生成 MAU 观察。', audienceGoal: ['lifestyle', 'commerce', 'search'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['xiaohongshu-mobile-mau-quest-2025-05'], evidenceSourceIds: ['xiaohongshu-local-life', 'xiaohongshu-qilin-2025'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'wechat-oa-owned-audience', title: '公众号更适合沉淀关注关系而非估算公域规模', summary: '腾讯总微信月活不能代替公众号触达；公众号应以关注、打开和私域运营指标评估。', audienceGoal: ['owned-audience', 'china'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: [], evidenceSourceIds: ['wechat-oa-official-help', 'tencent-2025-annual'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'jike-niche-community', title: '即刻是兴趣与职业同好社区，但公开规模证据不足', summary: '产品材料支持兴趣圈、推荐和评论能力；公开、方法披露的活跃用户估计仍缺失。', audienceGoal: ['technology-creator', 'community'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: [], evidenceSourceIds: ['jike-app-store', 'appinchina-index-2025'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
]

const supportedComparisonClaims = {
  x: {
    reach: { rating: 'high', evidenceSourceIds: ['x-global-mau-self-2025', 'datareportal-x-2025', 'sensor-tower-x-q4-2024', 'sensor-tower-x-june-2025', 'pew-social-2025', 'ofcom-online-nation-2025'], rationale: 'X 的公司自报、全球广告触达、移动端估计及美英调查共同证明大规模覆盖，但这些口径不得合并为单一活跃数。' },
    internationalization: { rating: 'high', evidenceSourceIds: ['datareportal-x-2025'], rationale: 'DataReportal 的全球广告工具分析同时列出美国、日本和英国等市场，直接支持 X 的跨国家受众分布。' },
    'native-monetization': { rating: 'high', evidenceSourceIds: ['x-creator-revenue', 'x-creator-subscriptions'], rationale: 'X 官方帮助页明确列出创作者广告收入分成与订阅项目及各自门槛，平台内变现工具证据充分。' },
    'brand-safety': { rating: 'low', evidenceSourceIds: ['eu-x-dsa-fine-2025', 'ofcom-online-nation-2025'], rationale: '欧盟最终处罚记录蓝标设计问题，Ofcom 亦记录英国用户伤害暴露，现有证据支持较弱的品牌安全判断。' },
    'data-transparency': { rating: 'low', evidenceSourceIds: ['eu-x-dsa-fine-2025', 'eu-x-action-plan-2026'], rationale: '欧盟处罚明确涉及广告资料库和研究者数据访问，后续行动计划仍受监督，因此 X 的数据透明度评级偏低。' },
  },
  threads: {
    reach: { rating: 'high', evidenceSourceIds: ['meta-threads-500m', 'pew-social-2025'], rationale: 'Meta 披露 Threads 达到五亿月活，美国成年人概率调查又提供独立使用率，二者直接支持其大规模覆盖。' },
    realtime: { rating: 'high', evidenceSourceIds: ['meta-threads-live-chats'], rationale: 'Meta 对 Live Chats 的官方说明明确将其定义为公开、可发现的实时聊天，直接证明 Threads 的实时参与能力。' },
    'public-conversation': { rating: 'high', evidenceSourceIds: ['meta-threads-live-chats'], rationale: 'Threads Live Chats 被官方描述为公开且可发现的社区对话，直接支持平台的公共讨论能力评级。' },
  },
  facebook: {
    reach: { rating: 'high', evidenceSourceIds: ['pew-social-2025'], rationale: 'Pew 概率调查显示 Facebook 在美国成年人及多个年龄组中均有广泛使用，足以支持覆盖维度的高评级。' },
    'brand-safety': { rating: 'medium', evidenceSourceIds: ['ofcom-online-nation-2025'], rationale: 'Ofcom 对英国线上平台的独立测量包含 Facebook 用户伤害暴露证据，只支持地域受限的中等品牌安全判断。' },
  },
  instagram: {
    reach: { rating: 'high', evidenceSourceIds: ['pew-social-2025'], rationale: 'Pew 的美国成年人调查及年龄分组使用率显示 Instagram 覆盖广且年轻人使用突出，直接支持高覆盖评级。' },
    'brand-safety': { rating: 'medium', evidenceSourceIds: ['ofcom-online-nation-2025'], rationale: 'Ofcom 英国报告提供 Instagram 使用与伤害暴露的独立监管测量，但地域单一，故品牌安全仅评为中等。' },
  },
  tiktok: {
    reach: { rating: 'high', evidenceSourceIds: ['tiktok-dsa-h2-2025', 'pew-social-2025', 'ofcom-online-nation-2025'], rationale: 'TikTok 欧盟月活跃接收者、美国家庭概率调查及英国受众测量分别证明多个市场的大规模覆盖。' },
    'brand-safety': { rating: 'medium', evidenceSourceIds: ['tiktok-dsa-h2-2025'], rationale: 'TikTok 的欧盟 DSA 报告披露内容审核执行数据，但只覆盖欧盟监管口径，因此品牌安全评为中等。' },
    'data-transparency': { rating: 'medium', evidenceSourceIds: ['tiktok-dsa-h2-2025'], rationale: 'TikTok 按 DSA 发布欧盟活跃接收者和内容审核数据，具备正式披露但缺少同等全球口径，透明度评为中等。' },
  },
  reddit: {
    reach: { rating: 'high', evidenceSourceIds: ['reddit-fy2025-results', 'pew-social-2025'], rationale: 'Reddit 公司披露全球季度日活独立用户，Pew 同时给出美国成年人使用率，直接支持其较高覆盖评级。' },
    'data-transparency': { rating: 'high', evidenceSourceIds: ['reddit-fy2025-results'], rationale: 'Reddit 财报公开季度日活独立用户并说明登录与未登录用户口径，当前来源足以支持较高数据透明度。' },
  },
  linkedin: {
    reach: { rating: 'medium', evidenceSourceIds: ['linkedin-fy2025-highlights', 'pew-social-2025'], rationale: 'LinkedIn 官方披露十二亿注册会员，Pew 提供美国成年人使用率；因会员不等于活跃用户，覆盖仅评为中等。' },
    'professional-relationships': { rating: 'high', evidenceSourceIds: ['linkedin-fy2025-highlights'], rationale: 'LinkedIn 官方商业亮点以会员网络及职业互动趋势为核心披露，直接支持其专业关系维度的高评级。' },
    'data-transparency': { rating: 'medium', evidenceSourceIds: ['linkedin-fy2025-highlights'], rationale: 'LinkedIn 明确披露注册会员规模但未提供可比月活或日活，因此数据透明度有正式来源却仍存在关键缺口。' },
  },
  weibo: {
    reach: { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博财报披露二〇二五年十二月月活和日活，年报同时给出定义与历史序列，直接支持中国大规模覆盖。' },
    realtime: { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博财报和年报均将产品描述为实时公共信息网络，且披露持续活跃规模，直接支持高实时性评级。' },
    'public-conversation': { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博上市文件明确描述公开信息传播和互动讨论结构，直接支持其公共对话能力的高评级。' },
    'follow-graph': { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博公司文件明确说明非对称关注关系，用户可持续关注账号接收更新，直接支持高关注关系链评级。' },
    'native-monetization': { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博财报和年报披露平台广告及增值服务商业模式，直接证明平台内原生变现渠道已经成熟。' },
    'data-transparency': { rating: 'high', evidenceSourceIds: ['weibo-fy2025-results', 'weibo-2025-20f'], rationale: '微博通过年度财报和审计年报持续公开月活、日活定义与历史序列，直接支持较高的数据透明度。' },
  },
  zhihu: {
    'data-transparency': { rating: 'medium', evidenceSourceIds: ['zhihu-2025-20f'], rationale: '知乎年报说明月活去重口径并坦承二〇二五年未给精确月活值，方法有披露但关键数字缺失，故评中等。' },
  },
  xiaohongshu: {
    reach: { rating: 'medium', evidenceSourceIds: ['questmobile-new-media-2025', 'questmobile-methodology'], rationale: 'QuestMobile 给出二〇二五年五月中国移动 App 月活及设备测量方法，但不含网页和境外，覆盖仅评为中等。' },
    'search-value': { rating: 'high', evidenceSourceIds: ['xiaohongshu-qilin-2025'], rationale: '小红书研究团队发布的 Qilin 数据集直接覆盖 App 内多模态搜索会话，并报告较高搜索渗透，支持高搜索价值。' },
    'chinese-reach': { rating: 'high', evidenceSourceIds: ['questmobile-new-media-2025', 'questmobile-methodology'], rationale: 'QuestMobile 在中国多省市设备样本中测得小红书移动 App 月活，地域与方法均直接支持较高中文受众覆盖。' },
    'native-monetization': { rating: 'high', evidenceSourceIds: ['xiaohongshu-commercial', 'xiaohongshu-local-life'], rationale: '小红书官方商家平台和本地生活页面直接提供商户经营与场景转化入口，支持成熟的平台内商业变现评级。' },
    'data-transparency': { rating: 'low', evidenceSourceIds: ['xiaohongshu-commercial', 'questmobile-new-media-2025', 'questmobile-methodology'], rationale: '官方商业页的月活说法缺少时期和方法，只能依赖 QuestMobile 的中国移动测量补足，故透明度评为低。' },
  },
  'wechat-oa': {
    'follow-graph': { rating: 'high', evidenceSourceIds: ['wechat-oa-official-help'], rationale: '微信官方帮助中心明确区分订阅号与服务号并说明关注后消息分发，直接支持公众号的关注关系链能力。' },
    'private-audience': { rating: 'high', evidenceSourceIds: ['wechat-oa-official-help'], rationale: '微信官方文档说明公众号可向已关注用户持续发送消息，直接支持其沉淀和运营自有受众的高评级。' },
  },
  jike: {
    'public-conversation': { rating: 'medium', evidenceSourceIds: ['jike-app-store'], rationale: '即刻开发者提供的应用商店说明明确列出兴趣圈和评论互动，支持公共社区对话，但证据仅来自产品描述。' },
    'algorithmic-distribution': { rating: 'medium', evidenceSourceIds: ['jike-app-store'], rationale: '即刻应用商店页面明确写有个性化推荐，直接证明非关注分发能力；缺少独立审计，因此仅评为中等。' },
    'native-monetization': { rating: 'medium', evidenceSourceIds: ['jike-app-store'], rationale: '即刻应用商店页面公开即刻黄标服务及定价，证明存在平台内付费工具，但商业规模未披露，故评中等。' },
  },
}

const platformLimitationSourceIds = {
  x: ['x-dsa-h2-2025'], threads: ['meta-threads-500m'], facebook: ['meta-fy2025-results'],
  instagram: ['meta-fy2025-results'], tiktok: ['tiktok-dsa-h2-2025'], reddit: ['reddit-fy2025-results'],
  linkedin: ['linkedin-fy2025-highlights'], weibo: ['weibo-2025-20f'], zhihu: ['zhihu-2025-20f'],
  xiaohongshu: ['xiaohongshu-commercial'], 'wechat-oa': ['wechat-oa-official-help'], jike: ['jike-official-site'],
}

const reachObservationIds = Object.fromEntries(platforms.map(({ id }) => [
  id,
  observations.filter((row) => row.platformId === id && ['mau', 'dau', 'monthly-visitors', 'adult-use-rate', 'registered-members'].includes(row.metricId)).map((row) => row.id),
]))

const comparisons = platforms.flatMap((platform) => COMPARISON_DIMENSIONS.map((dimensionId) => {
  const claim = supportedComparisonClaims[platform.id]?.[dimensionId]
  return {
    id: `${platform.id}-${dimensionId}`,
    platformId: platform.id,
    dimensionId,
    rating: claim?.rating || 'unknown',
    quantitativeObservationIds: claim && dimensionId === 'reach' ? reachObservationIds[platform.id] : [],
    evidenceSourceIds: claim?.evidenceSourceIds || platformLimitationSourceIds[platform.id],
    rationale: claim?.rationale || `${platform.name} 的 ${dimensionId} 维度在截至 ${ACCESSED_AT} 核验的公开来源中没有直接、可复核证据，因此保持未知且不参与评级。`,
    confidence: claim ? 'reference' : 'lead-only',
    snapshotId: '2026-q2',
  }
}))

const fixedCoverageGaps = [
  { id: 'gap-source-x-h2-amars-not-global', gapKind: 'source-floor', platformId: 'x', dimensionId: 'reach', reason: 'X H2 2025 DSA reporting is EU regulatory evidence and cannot support a global MAU value.', attemptedSourceUrl: 'https://transparency.x.com/en/reports/dsa-transparency-report', checkedAt: ACCESSED_AT, impact: 'Global scale remains a disputed range using self-report and independent mobile-app estimates.' },
  { id: 'gap-source-x-similarweb-public-current', gapKind: 'source-floor', platformId: 'x', dimensionId: 'reach', reason: 'No current Similarweb daily-use value with sufficient public method and device scope was accessible; Sensor Tower mobile estimates are retained instead.', attemptedSourceUrl: 'https://www.similarweb.com/website/x.com/', checkedAt: ACCESSED_AT, impact: 'Daily-use trend evidence is mobile-app scoped and excludes web.' },
  { id: 'gap-source-x-device-count-unavailable', gapKind: 'metric', platformId: 'x', metricId: 'device-count', reason: 'The verified Sensor Tower sources estimate app users rather than a deduplicated count of devices, so no device-count observation can be created.', attemptedSourceUrl: 'https://techcrunch.com/2025/07/10/as-x-loses-its-ceo-daily-usage-is-down-and-competition-is-growing/', checkedAt: ACCESSED_AT, impact: 'Mobile user estimates are not transformed into device counts.' },
  { id: 'gap-source-x-country-share-unavailable', gapKind: 'metric', platformId: 'x', metricId: 'country-share', geoDimensionId: 'country-share', reason: '已核验的 DataReportal 来源列出各国 X 广告可触达人数，但没有直接公布各国占全球 X 受众的比例。', attemptedSourceUrl: 'https://datareportal.com/essential-x-stats', checkedAt: ACCESSED_AT, impact: '国家受众占比保持缺口；不会用经过取整的全球广告触达总数反推。可改看独立呈现的各国广告触达人数与互联网人口渗透率。' },
  { id: 'gap-source-x-occupation-industry-profile', gapKind: 'profile', platformId: 'x', profileDimensionId: 'occupation-industry', reason: '已核验的 Pew 2025 社交媒体事实表没有发布 X 用户的职业或行业交叉分布，广告受众工具公开页也没有可复核的职业样本与口径。', attemptedSourceUrl: 'https://www.pewresearch.org/internet/fact-sheet/social-media/', checkedAt: ACCESSED_AT, impact: '无法判断 X 用户集中在哪些职业或行业；页面不以创作者观察代替总体用户画像。' },
  { id: 'gap-source-x-city-tier-profile', gapKind: 'profile', platformId: 'x', profileDimensionId: 'city-tier', reason: '已核验的公开调查没有给出 X 用户按城市层级、城市规模或城乡类型划分的可复核分布。', attemptedSourceUrl: 'https://www.pewresearch.org/internet/fact-sheet/social-media/', checkedAt: ACCESSED_AT, impact: '无法量化一线城市、低线城市或城乡用户差异；不从国家广告触达数据推断城市结构。' },
  { id: 'gap-source-x-political-orientation-profile', gapKind: 'profile', platformId: 'x', profileDimensionId: 'political-orientation', reason: '已核验的 Pew 2025 社交媒体事实表未发布 X 用户按政治倾向划分的当前占比；其他公开材料也没有同口径、可复核的全球数据。', attemptedSourceUrl: 'https://www.pewresearch.org/internet/fact-sheet/social-media/', checkedAt: ACCESSED_AT, impact: '不能把平台上的高可见政治内容等同于总体用户政治倾向，也不展示未经当前样本验证的比例。' },
  { id: 'gap-source-x-general-use-motivation-profile', gapKind: 'profile', platformId: 'x', profileDimensionId: 'general-use-motivation', reason: '当前可核验调查只支持“获取新闻”这一特定使用理由，未形成覆盖社交、娱乐、学习、客户服务等一般使用动机的同一问卷分布。', attemptedSourceUrl: 'https://www.pewresearch.org/internet/fact-sheet/social-media/', checkedAt: ACCESSED_AT, impact: '一般使用动机保持未知；新闻使用率不会被扩展解释成所有使用目的。' },
  { id: 'gap-source-x-country-availability', gapKind: 'geography', platformId: 'x', geoDimensionId: 'country-availability', reason: '已核验来源没有提供带核验日期、覆盖完整且可复核的 X 国家/地区可用性清单。广告工具覆盖或创作者收款支持国家都不等于产品可用国家。', attemptedSourceUrl: 'https://help.x.com/en/rules-and-policies/x-services-and-corporate-affiliates', checkedAt: ACCESSED_AT, impact: '页面不声称 X 在某个完整国家集合中均可用；运营前仍需按目标市场单独核验。' },
  { id: 'gap-source-x-country-restrictions', gapKind: 'geography', platformId: 'x', geoDimensionId: 'country-restrictions', reason: 'X 透明度材料记录部分法律请求，但没有形成截至本快照逐国、实时的访问限制或封锁状态清单。限制状态也可能快速变化。', attemptedSourceUrl: 'https://transparency.x.com/en/reports/removal-requests.html', checkedAt: ACCESSED_AT, impact: '无法在静态季度快照中穷尽列出每个国家的访问限制；不会把法律请求数量替代为可用性结论。' },
  { id: 'gap-source-x-primary-languages', gapKind: 'geography', platformId: 'x', geoDimensionId: 'primary-languages', reason: 'X 帮助文档可列界面支持语言，但已核验来源没有发布用户主要发帖语言或各语言受众规模的可复核分布。', attemptedSourceUrl: 'https://help.x.com/en/using-x/x-supported-languages', checkedAt: ACCESSED_AT, impact: '界面支持语言不等于用户主要语言；页面不据此估算中文、英文或其他语言受众占比。' },
  { id: 'gap-source-zhihu-2025-exact-mau', gapKind: 'source-floor', platformId: 'zhihu', dimensionId: 'reach', reason: 'FY2025 results and Form 20-F say the MAU base was stable but publish no exact 2025 MAU.', attemptedSourceUrl: 'https://www.sec.gov/Archives/edgar/data/1835724/000110465926044557/zh-20251231x20f.htm', checkedAt: ACCESSED_AT, impact: 'No exact 2025 Zhihu reach number is shown.' },
  { id: 'gap-source-wechat-oa-reach', gapKind: 'source-floor', platformId: 'wechat-oa', dimensionId: 'reach', reason: 'Tencent reports 1.418B combined Weixin/WeChat MAU, not Official Account reach; no public OA-specific total was found.', attemptedSourceUrl: 'https://static.www.tencent.com/uploads/2026/04/09/62d786fcf3d3c8cb7e54791ee95439ac.pdf', checkedAt: ACCESSED_AT, impact: 'WeChat total MAU is excluded from Official Account reach comparisons.' },
  { id: 'gap-source-xiaohongshu-official-mau-scope', gapKind: 'metric', platformId: 'xiaohongshu', metricId: 'mau', reason: 'The official commercial page states a monthly-active figure but exposes no as-of period, geography, or measurement method.', attemptedSourceUrl: 'https://zhaoshang.xiaohongshu.com/merchant/login', checkedAt: ACCESSED_AT, impact: 'No official Xiaohongshu MAU observation is created; only the exact China mobile estimate is retained.' },
  { id: 'gap-source-jike-independent-mau', gapKind: 'source-floor', platformId: 'jike', dimensionId: 'reach', reason: 'Official Jike materials publish no active-user metric, and the accessible AppInChina independent index exposes no public Jike value.', attemptedSourceUrl: 'https://appinchina.co/market/apps/', checkedAt: ACCESSED_AT, impact: 'Jike reach remains unknown; no unattributed estimate is substituted.' },
]

const comparisonCoverageGaps = comparisons.filter((item) => item.rating === 'unknown').map((item) => {
  const attemptedSourceUrl = sources.find((itemSource) => itemSource.id === platformLimitationSourceIds[item.platformId][0]).url
  return {
    id: `gap-comparison-${item.id}`,
    gapKind: 'comparison',
    platformId: item.platformId,
    dimensionId: item.dimensionId,
    reason: `The verified public source floor does not support a defensible ${item.dimensionId} rating for ${item.platformId}.`,
    attemptedSourceUrl,
    checkedAt: ACCESSED_AT,
    impact: 'Comparison cell is explicitly unknown and must not be ranked as high, medium, or low.',
  }
})

const coverageGaps = [...fixedCoverageGaps, ...comparisonCoverageGaps]

export const X_INTELLIGENCE_REPOSITORY = Object.freeze({
  platforms, metrics, sources, snapshots, observations, insights, comparisons, coverageGaps,
})
