import { greetingCalendarLabel } from './dailyGreeting.js'

export const X_US_AUDIENCE_SLOTS = Object.freeze({
  us_morning: Object.freeze({
    id: 'us_morning',
    label: 'US morning',
    time: '23:00',
    audienceTime: '11:00 ET / 08:00 PT',
    direction: 'Open with a useful, upbeat thought for builders starting their day. Focus on AI, coding, indie products, or creative work, and end with one easy question about what they plan to make or learn today.',
  }),
  us_midday: Object.freeze({
    id: 'us_midday',
    label: 'US midday',
    time: '03:00',
    audienceTime: '15:00 ET / 12:00 PT',
    direction: 'Share one compact, practical observation or framework about AI tools, software, product craft, learning, or independent creation. Make it useful without sounding like a guru, then invite a specific response.',
  }),
  us_evening: Object.freeze({
    id: 'us_evening',
    label: 'US afternoon',
    time: '07:00',
    audienceTime: '19:00 ET / 16:00 PT',
    direction: 'Write a relaxed end-of-workday conversation starter for builders and creators. Center it on something shipped, learned, simplified, or reconsidered, and ask a concrete question people can answer from experience.',
  }),
})

export function normalizeXUsAudienceSlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_US_AUDIENCE_SLOTS[slot] ? slot : fallback
}

export function xUsAudienceLastRunKey(slot) {
  return `automation.x_us_audience.last_run.${normalizeXUsAudienceSlot(slot)}`
}

export function buildXUsAudienceMessages({ slot = 'us_morning', now = new Date() } = {}) {
  const normalizedSlot = normalizeXUsAudienceSlot(slot, 'us_morning')
  const slotInfo = X_US_AUDIENCE_SLOTS[normalizedSlot]
  return [
    {
      role: 'system',
      content: [
        'Write one ready-to-publish X post in natural American English for a personal account.',
        'Output only the final post. Do not add a title, Markdown, quotation marks, alternatives, or writing notes.',
        'Write for US-based builders, developers, AI users, indie makers, and curious creators. Sound like a thoughtful peer: clear, warm, specific, and lightly conversational.',
        'Open with a crisp, defensible opinion that challenges a lazy assumption. Support it with one practical observation, consequence, or takeaway.',
        'Include one quotable core line people can genuinely agree or disagree with, so the post can earn likes without asking for them.',
        'End with a low-friction question that asks for a choice, a tradeoff, or firsthand experience. Avoid vague prompts such as “Thoughts?” or “Who agrees?”.',
        'Do not invent personal credentials, locations, projects, results, statistics, news, or experiences. Do not make unverifiable claims or present current events without supplied sources.',
        'Be pointed without being hostile. Avoid engagement bait, hustle clichés, corporate marketing language, culture-war topics, partisan politics, financial advice, and generic motivational quotes.',
        'Do not mention the posting schedule, China time, US time zones, the date, or the audience targeting.',
        'Use zero or one relevant hashtag only when it reads naturally. Do not ask for likes, reposts, follows, or mutual follows.',
        'Aim for 170–240 characters and never exceed X’s 280 weighted-character limit.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Calendar rotation key: ${greetingCalendarLabel({ now })}. Do not repeat it in the post.`,
        `Publishing window: ${slotInfo.time} Beijing time, approximately ${slotInfo.audienceTime} during US daylight saving time.`,
        `Editorial direction: ${slotInfo.direction}`,
        'Use a fresh opening and sentence rhythm. The post should make sense on its own to someone seeing this account for the first time.',
      ].join('\n'),
    },
  ]
}

export function buildXUsAudienceLengthRepairMessages({ text, targetWeight = 240 } = {}) {
  return [
    {
      role: 'system',
      content: [
        'Shorten one English post for X while preserving its main idea and natural American-English voice.',
        'Output only the revised post. Do not add explanations, a title, Markdown, quotation marks, or alternatives.',
        `The result must stay within ${targetWeight} weighted characters. Remove repetition and secondary details before cutting the core observation or question.`,
        'Keep complete sentences. Do not translate the post or add facts, claims, hashtags, or calls to engage that were not already present.',
      ].join('\n'),
    },
    { role: 'user', content: `Original post:\n${String(text || '').trim()}` },
  ]
}
