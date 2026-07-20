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
  ['monthly-visitors', '月访问者', ['people']], ['daily-minutes', '日均使用时长', ['minutes']],
  ['country-share', '国家受众占比', ['percent']], ['internet-penetration', '互联网人口渗透率', ['percent']],
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
  source('x-creator-revenue', 'Creator Revenue Sharing', 'X Help', 'https://help.x.com/en/using-x/creator-revenue-sharing', ACCESSED_AT, 'primary-live-reference', 'Undated live eligibility page: active Premium tier, 5M organic impressions in three months, 500 verified followers, supported country, and policy compliance.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-creator-subscriptions', 'About Creator Subscriptions', 'X Help', 'https://help.x.com/en/using-x/subscriptions-creator', ACCESSED_AT, 'primary-live-reference', 'Undated live eligibility page: age 18+, active in 30 days, 2,000 verified followers, and 5M organic impressions in three months.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-organic-best-practices', 'Organic best practices', 'X Business', 'https://business.x.com/en/basics/organic-best-practices', ACCESSED_AT, 'primary-live-reference', 'Undated live editorial guidance recommending concise, conversational copy, clear calls to action, and media.', { publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('x-recommendation-code', 'X Recommendation Algorithm', 'X / GitHub', 'https://github.com/twitter/the-algorithm', '2023-03-31', 'primary-code-archive', 'Public historical source snapshot describing shared data, candidate generation, ranking, and filtering services; it is not proof of the current production system.', { archiveStatus: 'historical' }),
  source('eu-x-dsa-fine-2025', 'Commission fines X €120 million under the Digital Services Act', 'European Commission', 'https://digital-strategy.ec.europa.eu/en/news/commission-fines-x-eu120-million-under-digital-services-act', '2025-12-05', 'regulatory', 'Final DSA non-compliance decision concerning blue-check design, advertising-repository transparency, and researcher access to public data.', { geography: 'eu' }),
  source('eu-x-action-plan-2026', 'Commission accepts X’s action plan to comply with Digital Services Act', 'European Commission', 'https://digital-strategy.ec.europa.eu/en/news/commission-accepts-xs-action-plan-comply-digital-services-act', '2026-07-16', 'regulatory', 'Records corrective commitments for advertising-repository search/API access and eligible researcher access; implementation remains subject to supervision.', { geography: 'eu' }),
  source('x-global-mau-self-2025', 'With 600 million users, X’s CEO cites platform scale', 'Digiday', 'https://digiday.com/marketing/with-600-million-users-xs-linda-yaccarino-doubles-down-on-dismissing-journalism/', '2025-04-30', 'secondary-self-report', 'Contemporaneous report of the X CEO’s approximately 600M global MAU claim; no deduplication, bot treatment, or measurement method was disclosed.', { geography: 'global' }),
  source('pew-social-2025', 'Social Media Fact Sheet', 'Pew Research Center', 'https://www.pewresearch.org/internet/fact-sheet/social-media/', '2025-11-20', 'independent-survey', 'Survey of 5,022 US adults fielded 2025-02-05 through 2025-06-18 by SSRS using address-based sampling and web, mail, and phone modes; weighted to US adults.', { geography: 'us', sampleSize: 5022 }),
  source('pew-x-experience-2024', 'How X users view and experience the platform', 'Pew Research Center', 'https://www.pewresearch.org/2024/06/12/how-x-users-view-experience-the-platform/', '2024-06-12', 'independent-survey', 'US survey of X users covering reasons for use, news, and politics; estimates apply to surveyed US adults/users, not global platform activity.', { geography: 'us' }),
  source('pew-news-influencers-2025', 'News Influencers Fact Sheet', 'Pew Research Center', 'https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/', '2025-11-04', 'independent-content-analysis', 'Pew-Knight sample defines news influencers as accounts regularly posting current-events/civic content with at least 100,000 followers; platform findings are sample-specific.', { geography: 'us' }),
  source('ofcom-online-nation-2025', 'Online Nation 2025', 'Ofcom', 'https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/online-research/online-nation/2025/online-nations-report-2025.pdf', '2025-12-10', 'regulatory-measurement', 'Ipsos iris UK Online Audience Measurement, May 2025, adults 18+; smartphone, tablet, and computer use only, excluding TV sets and smart displays.', { geography: 'uk' }),
  source('datareportal-x-2025', 'Essential X statistics and trends for 2025', 'DataReportal / Kepios', 'https://datareportal.com/essential-x-stats', '2025-03-12', 'independent-analysis', 'Kepios analysis of X ad-planning data for January 2025. Ad reach can include duplicate, inauthentic, and non-human accounts and is explicitly not MAU.', { geography: 'global' }),
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
  source('jike-app-store', '即刻 App listing', 'If Tech / Apple App Store', 'https://apps.apple.com/cn/app/%E5%8D%B3%E5%88%BBapp/id966129812', ACCESSED_AT, 'primary-distributor-listing', 'Developer-supplied product description documents interest circles, personalised recommendation, comments, and Jike Yellow pricing; it provides no active-user count.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('jike-official-site', '即刻 official site', 'If Tech', 'https://www.okjike.com/', ACCESSED_AT, 'primary-live-reference', 'Official product landing endpoint verified live; no public user metric or audience methodology is disclosed.', { geography: 'china', publicationDateStatus: 'undated-live-page-access-date-proxy' }),
  source('appinchina-index-2025', 'AppInChina App Index', 'AppInChina', 'https://appinchina.co/market/apps/', '2025-11-30', 'independent-app-index', 'Monthly-active ranking for Android apps in China, last updated November 2025; no public Jike value was available in the accessible index.', { geography: 'china', deviceScope: 'android-apps' }),
]

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
  observation({ id: 'weibo-mau-2025-12', platformId: 'weibo', metricId: 'mau', value: 567000000, unit: 'people', periodStart: '2025-12-01', periodEnd: '2025-12-31', publishedAt: '2026-03-18', geography: 'china', methodology: 'Company-defined December MAU in FY2025 results.', sourceId: 'weibo-fy2025-results', confidence: 'high', comparability: 'company-defined-mau' }),
  observation({ id: 'weibo-dau-2025-12', platformId: 'weibo', metricId: 'dau', value: 252000000, unit: 'people', periodStart: '2025-12-01', periodEnd: '2025-12-31', publishedAt: '2026-03-18', geography: 'china', methodology: 'Company-defined average December DAU in FY2025 results.', sourceId: 'weibo-fy2025-results', confidence: 'high', comparability: 'company-defined-dau' }),
  observation({ id: 'zhihu-dau-daily-minutes-2025-q4', platformId: 'zhihu', metricId: 'daily-minutes', value: 41, unit: 'minutes', periodStart: '2025-10-01', periodEnd: '2025-12-31', publishedAt: '2026-03-25', geography: 'china', methodology: 'Company-reported average time among DAUs in Q4 2025.', sourceId: 'zhihu-fy2025-results', confidence: 'high', comparability: 'company-defined-dau-time', editorNote: 'Applies to DAUs, not all MAUs.' }),
  observation({ id: 'xiaohongshu-mau-official-2025', platformId: 'xiaohongshu', metricId: 'mau', value: 300000000, unit: 'people', periodStart: '2025-01-01', periodEnd: '2025-12-31', publishedAt: '2026-07-20', geography: 'global', methodology: 'Official commercial claim on a live merchant page; metric method and as-of month not disclosed.', sourceId: 'xiaohongshu-commercial', confidence: 'disputed', comparability: 'company-defined-mau', conflictGroupId: 'xiaohongshu-mau-2025', editorNote: 'Marketing claim; period is bounded to 2025 only because no exact as-of date is published.' }),
  observation({ id: 'xiaohongshu-mobile-mau-quest-2025-05', platformId: 'xiaohongshu', metricId: 'mau', value: 242000000, unit: 'people', periodStart: '2025-05-01', periodEnd: '2025-05-31', publishedAt: '2025-12-17', geography: 'china', methodology: 'QuestMobile TRUTH app active users: at least one app launch in the month, modelled from multi-source device data.', sourceId: 'questmobile-new-media-2025', confidence: 'reference', comparability: 'mobile-app-only', conflictGroupId: 'xiaohongshu-mau-2025', editorNote: 'Independent app measurement; differs in geography, device coverage, and metric definition from the official claim.' }),
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
  ['age-share', ['age-18-29', 'age-30-49', 'age-50-64', 'age-65-plus'], 'age'],
  ['gender-share', ['men', 'women'], 'gender'],
  ['income-use-rate', ['income-under-30000', 'income-30000-69999', 'income-70000-99999', 'income-100000-plus'], 'income'],
  ['education-use-rate', ['high-school-or-less', 'some-college', 'college-graduate'], 'education'],
]

for (const [platformId, profile] of Object.entries(pewProfiles)) {
  observations.push(observation({
    id: `${platformId}-us-adult-use-2025`, platformId, metricId: 'internet-penetration',
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
  id: 'linkedin-us-adult-use-2025', platformId: 'linkedin', metricId: 'internet-penetration',
  valueType: 'percentage', value: 25, unit: 'percent', periodStart: '2025-02-05', periodEnd: '2025-06-18',
  publishedAt: '2025-11-20', geography: 'us', segments: ['adults-18-plus'],
  methodology: 'Pew NPORS address-based probability survey of 5,022 US adults; web, mail, and phone; weighted.',
  sourceId: 'pew-social-2025', confidence: 'high', comparability: 'us-adult-survey-use-rate',
  editorNote: 'Share of US adults who say they ever use LinkedIn; the 1.2B member count is not MAU.',
}))

const insights = [
  { id: 'x-public-realtime', title: '实时公共讨论仍是 X 的核心差异', summary: '新闻、科技发布和人物关系链仍有优势，但规模与安全判断必须并列展示第三方测量和监管证据。', audienceGoal: ['technology-creator', 'news'], geographies: ['global'], segmentFilters: [], evidenceObservationIds: ['x-global-mau-self-2025', 'x-global-mobile-mau-sensor-q4-2024', 'x-uk-daily-minutes-2025-05'], evidenceSourceIds: ['x-recommendation-code', 'eu-x-dsa-fine-2025'], confidence: 'disputed', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'threads-scale-community', title: 'Threads 已进入大规模公共社区阶段', summary: '官方 5 亿 MAU 与 Live Chats 表明规模和实时产品能力继续增强。', audienceGoal: ['community', 'consumer'], geographies: ['global'], segmentFilters: [], evidenceObservationIds: ['threads-global-mau-2026-06', 'threads-uk-monthly-visitors-2025-05'], evidenceSourceIds: ['meta-threads-live-chats'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'facebook-broad-reach', title: 'Facebook 仍具广泛成年受众覆盖', summary: '美国调查显示跨年龄覆盖较广；Meta Family DAP 不应拆分成 Facebook 单平台活跃数。', audienceGoal: ['broad-reach'], geographies: ['us', 'global'], segmentFilters: [], evidenceObservationIds: ['facebook-us-adult-use-2025', 'facebook-us-age-65-plus-use-2025'], evidenceSourceIds: ['meta-fy2025-results'], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'instagram-visual-youth', title: 'Instagram 的年轻视觉受众优势明确', summary: 'Pew 的美国成年人分组数据和 Ofcom 的英国使用时长都显示年轻、视觉化分发优势。', audienceGoal: ['visual-creator', 'consumer'], geographies: ['us', 'uk'], segmentFilters: ['age-18-29'], evidenceObservationIds: ['instagram-us-age-18-29-use-2025', 'instagram-uk-daily-minutes-2025-05'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'tiktok-eu-scale-video', title: 'TikTok 的欧盟规模和消费时长都很高', summary: '欧盟 DSA 月活跃接收者与英国时长指标支持其视频分发强度，但地域不可外推为全球 MAU。', audienceGoal: ['video-creator', 'consumer'], geographies: ['eu', 'uk'], segmentFilters: [], evidenceObservationIds: ['tiktok-eu-mau-2025-h2', 'tiktok-uk-daily-minutes-2025-05'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'reddit-community-depth', title: 'Reddit 的主题社区具有持续讨论价值', summary: 'DAUq 提供规模基准，Pew 数据显示美国年轻和高学历人群使用率较高。', audienceGoal: ['community', 'research'], geographies: ['global', 'us'], segmentFilters: [], evidenceObservationIds: ['reddit-global-dauq-2025-q4', 'reddit-us-college-graduate-use-2025'], evidenceSourceIds: [], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'linkedin-professional-graph', title: 'LinkedIn 的专业关系链定位最清晰', summary: '官方会员规模支持网络广度但不是 MAU；活跃判断需使用独立访问或调查指标。', audienceGoal: ['professional', 'b2b'], geographies: ['global', 'us', 'uk'], segmentFilters: [], evidenceObservationIds: ['linkedin-us-adult-use-2025', 'linkedin-uk-daily-minutes-2025-05'], evidenceSourceIds: ['linkedin-fy2025-highlights'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'weibo-public-china', title: '微博仍是中国大规模实时公共讨论平台', summary: '2025 年末 MAU、DAU 与公司对非对称关系链和实时传播的定义共同支持这一定位。', audienceGoal: ['news', 'public-conversation'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['weibo-mau-2025-12', 'weibo-dau-2025-12'], evidenceSourceIds: ['weibo-2025-20f'], confidence: 'high', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'zhihu-search-depth', title: '知乎的长内容与搜索价值仍强', summary: '公司披露 DAU 日均 41 分钟且强调专家和可信内容，但 2025 精确 MAU 未披露。', audienceGoal: ['knowledge', 'search'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['zhihu-dau-daily-minutes-2025-q4'], evidenceSourceIds: ['zhihu-2025-20f'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'xiaohongshu-search-commerce', title: '小红书兼具搜索、内容和商业转化', summary: '官方与 QuestMobile 的规模口径不同，应并列呈现；内容搜索优势不等于公开关系链优势。', audienceGoal: ['lifestyle', 'commerce', 'search'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: ['xiaohongshu-mau-official-2025', 'xiaohongshu-mobile-mau-quest-2025-05'], evidenceSourceIds: ['xiaohongshu-local-life'], confidence: 'disputed', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'wechat-oa-owned-audience', title: '公众号更适合沉淀关注关系而非估算公域规模', summary: '腾讯总微信月活不能代替公众号触达；公众号应以关注、打开和私域运营指标评估。', audienceGoal: ['owned-audience', 'china'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: [], evidenceSourceIds: ['wechat-oa-official-help', 'tencent-2025-annual'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
  { id: 'jike-niche-community', title: '即刻是兴趣与职业同好社区，但公开规模证据不足', summary: '产品材料支持兴趣圈、推荐和评论能力；公开、方法披露的活跃用户估计仍缺失。', audienceGoal: ['technology-creator', 'community'], geographies: ['china'], segmentFilters: [], evidenceObservationIds: [], evidenceSourceIds: ['jike-app-store', 'appinchina-index-2025'], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2' },
]

const comparisonProfiles = {
  x: ['high', 'high', 'medium', 'high', 'high', 'high', 'high', 'high', 'high', 'low', 'high', 'low', 'high', 'medium', 'low', 'low'],
  threads: ['high', 'high', 'medium', 'medium', 'medium', 'high', 'medium', 'high', 'medium', 'low', 'high', 'low', 'low', 'medium', 'medium', 'medium'],
  facebook: ['high', 'medium', 'high', 'high', 'medium', 'high', 'medium', 'high', 'high', 'low', 'high', 'medium', 'high', 'high', 'medium', 'medium'],
  instagram: ['high', 'medium', 'medium', 'high', 'medium', 'medium', 'low', 'high', 'high', 'low', 'high', 'high', 'high', 'high', 'medium', 'medium'],
  tiktok: ['high', 'high', 'low', 'medium', 'low', 'medium', 'low', 'high', 'medium', 'low', 'high', 'high', 'high', 'medium', 'low', 'medium'],
  reddit: ['high', 'high', 'high', 'high', 'medium', 'high', 'high', 'high', 'medium', 'low', 'high', 'medium', 'medium', 'medium', 'medium', 'high'],
  linkedin: ['high', 'medium', 'high', 'high', 'high', 'medium', 'high', 'medium', 'high', 'low', 'high', 'medium', 'high', 'high', 'high', 'medium'],
  weibo: ['high', 'high', 'medium', 'medium', 'low', 'high', 'medium', 'high', 'high', 'high', 'low', 'medium', 'high', 'medium', 'low', 'high'],
  zhihu: ['medium', 'low', 'high', 'high', 'high', 'high', 'medium', 'medium', 'medium', 'high', 'low', 'medium', 'medium', 'low', 'medium', 'medium'],
  xiaohongshu: ['high', 'low', 'high', 'high', 'low', 'medium', 'low', 'high', 'medium', 'high', 'low', 'high', 'high', 'medium', 'medium', 'low'],
  'wechat-oa': ['unknown', 'low', 'high', 'medium', 'medium', 'low', 'medium', 'low', 'high', 'high', 'medium', 'medium', 'medium', 'high', 'medium', 'low'],
  jike: ['unknown', 'medium', 'low', 'low', 'medium', 'medium', 'low', 'medium', 'medium', 'unknown', 'low', 'low', 'medium', 'medium', 'unknown', 'unknown'],
}

const platformEvidenceSourceIds = {
  x: ['x-dsa-h2-2025', 'datareportal-x-2025', 'pew-social-2025', 'ofcom-online-nation-2025', 'x-organic-best-practices', 'x-recommendation-code', 'x-creator-revenue', 'eu-x-dsa-fine-2025'],
  threads: ['meta-threads-500m', 'meta-threads-live-chats', 'pew-social-2025', 'ofcom-online-nation-2025'],
  facebook: ['meta-fy2025-results', 'pew-social-2025', 'ofcom-online-nation-2025'],
  instagram: ['meta-fy2025-results', 'pew-social-2025', 'ofcom-online-nation-2025'],
  tiktok: ['tiktok-dsa-h2-2025', 'pew-social-2025', 'ofcom-online-nation-2025'],
  reddit: ['reddit-fy2025-results', 'pew-social-2025', 'ofcom-online-nation-2025'],
  linkedin: ['linkedin-fy2025-highlights', 'pew-social-2025', 'ofcom-online-nation-2025'],
  weibo: ['weibo-fy2025-results', 'weibo-2025-20f'],
  zhihu: ['zhihu-fy2025-results', 'zhihu-2025-20f'],
  xiaohongshu: ['xiaohongshu-commercial', 'xiaohongshu-local-life', 'questmobile-new-media-2025', 'questmobile-methodology'],
  'wechat-oa': ['wechat-oa-official-help', 'tencent-2025-annual'],
  jike: ['jike-app-store', 'jike-official-site', 'appinchina-index-2025'],
}

const dimensionRationales = {
  reach: '按可比的活跃、访问、调查或触达证据评估，非同口径数字不合并。',
  realtime: '按事件发生时公开参与和传播能力评估。',
  'content-longevity': '按内容在发布后持续被发现和消费的能力评估。',
  'search-value': '按站内搜索、外部索引和问题解决意图评估。',
  'professional-relationships': '按专业身份、职业关系链和 B2B 使用情境评估。',
  'public-conversation': '按公开回复、讨论串和可发现对话评估。',
  'external-links': '按外链发布、点击和站外导流的产品支持评估。',
  'algorithmic-distribution': '按非关注推荐和内容发现能力评估。',
  'follow-graph': '按可持续关注关系和直接分发能力评估。',
  'chinese-reach': '按中国大陆的公开规模、可用性和内容生态证据评估。',
  internationalization: '按跨国家、跨语言的可用性与受众证据评估。',
  'production-cost': '按持续产出所需的视频、视觉或编辑投入评估；高评分代表成本更低。',
  'native-monetization': '按平台内广告、订阅、分成或商业转化工具评估。',
  'private-audience': '按私信、群组、订阅或自有关注关系沉淀评估。',
  'brand-safety': '按治理机制、监管记录和公开风险证据评估。',
  'data-transparency': '按审计、监管披露、方法说明和可重复获取程度评估。',
}

const comparisonNotes = {
  x: '规模自报与移动端独立估计冲突，监管也记录了透明度缺陷。',
  threads: '官方规模快速增长，实时社区功能仍在扩展。',
  facebook: 'Pew 支持广泛成年覆盖，但 Meta Family 指标不能拆成单平台数据。',
  instagram: '调查和英国测量支持视觉与年轻受众优势。',
  tiktok: '欧盟 DSA 和英国测量支持高规模、高消费强度。',
  reddit: '公司 DAUq、独立调查和主题社区结构共同提供证据。',
  linkedin: '专业关系定位清晰；会员数绝不按 MAU 使用。',
  weibo: '上市公司披露和产品定义支持大规模、实时、公开关系链。',
  zhihu: '长内容和知识搜索定位清晰，但 2025 精确 MAU 缺失。',
  xiaohongshu: '官方与独立移动测量的规模口径不同，搜索与商业场景证据较强。',
  'wechat-oa': '公众号是微信生态内的关注分发产品，微信总 MAU 不能作为公众号触达。',
  jike: '官方材料支持兴趣社区功能，但公开规模与治理透明度证据不足。',
}

const reachObservationIds = Object.fromEntries(platforms.map(({ id }) => [
  id,
  observations.filter((row) => row.platformId === id && ['mau', 'dau', 'monthly-visitors', 'internet-penetration'].includes(row.metricId)).map((row) => row.id),
]))

const comparisons = platforms.flatMap((platform) => COMPARISON_DIMENSIONS.map((dimensionId, dimensionIndex) => ({
  id: `${platform.id}-${dimensionId}`,
  platformId: platform.id,
  dimensionId,
  rating: comparisonProfiles[platform.id][dimensionIndex],
  quantitativeObservationIds: dimensionId === 'reach' ? reachObservationIds[platform.id] : [],
  evidenceSourceIds: platformEvidenceSourceIds[platform.id],
  rationale: `${comparisonNotes[platform.id]} ${dimensionRationales[dimensionId]}`,
  confidence: comparisonProfiles[platform.id][dimensionIndex] === 'unknown' ? 'lead-only' : 'reference',
  snapshotId: '2026-q2',
})))

const fixedCoverageGaps = [
  { id: 'gap-x-h2-amars-not-global', platformId: 'x', dimensionId: 'reach', reason: 'X H2 2025 DSA reporting is EU regulatory evidence and cannot support a global MAU value.', attemptedSourceUrl: 'https://transparency.x.com/en/reports/dsa-transparency-report', checkedAt: ACCESSED_AT, impact: 'Global scale remains a disputed range using self-report and independent mobile-app estimates.' },
  { id: 'gap-x-similarweb-public-current', platformId: 'x', dimensionId: 'reach', reason: 'No current Similarweb daily-use value with sufficient public method and device scope was accessible; Sensor Tower mobile estimates are retained instead.', attemptedSourceUrl: 'https://www.similarweb.com/website/x.com/', checkedAt: ACCESSED_AT, impact: 'Daily-use trend evidence is mobile-app scoped and excludes web.' },
  { id: 'gap-zhihu-2025-exact-mau', platformId: 'zhihu', dimensionId: 'reach', reason: 'FY2025 results and Form 20-F say the MAU base was stable but publish no exact 2025 MAU.', attemptedSourceUrl: 'https://www.sec.gov/Archives/edgar/data/1835724/000110465926044557/zh-20251231x20f.htm', checkedAt: ACCESSED_AT, impact: 'No exact 2025 Zhihu reach number is shown.' },
  { id: 'gap-wechat-oa-reach', platformId: 'wechat-oa', dimensionId: 'reach', reason: 'Tencent reports 1.418B combined Weixin/WeChat MAU, not Official Account reach; no public OA-specific total was found.', attemptedSourceUrl: 'https://static.www.tencent.com/uploads/2026/04/09/62d786fcf3d3c8cb7e54791ee95439ac.pdf', checkedAt: ACCESSED_AT, impact: 'WeChat total MAU is excluded from Official Account reach comparisons.' },
  { id: 'gap-jike-independent-mau', platformId: 'jike', dimensionId: 'reach', reason: 'Official Jike materials publish no active-user metric, and the accessible AppInChina independent index exposes no public Jike value.', attemptedSourceUrl: 'https://appinchina.co/market/apps/', checkedAt: ACCESSED_AT, impact: 'Jike reach remains unknown; no unattributed estimate is substituted.' },
]

const comparisonCoverageGaps = comparisons.filter((item) => item.rating === 'unknown').map((item) => {
  const attemptedSourceUrl = sources.find((itemSource) => itemSource.id === platformEvidenceSourceIds[item.platformId][0]).url
  return {
    id: `gap-${item.id}`,
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
