import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  MORNING_GREETING_SETTING_KEY,
  buildDailyGreeting,
  greetingLastRunKey,
  greetingPeriodForDate,
  greetingWithinLimit,
  isAutomationPaused,
  normalizeGreetingPeriod,
  pickDailyGreetingTemplate,
  shanghaiDateKey,
} from '../../../../../lib/morningGreeting'
import { listEnabledMorningGreetingTexts } from '../../../../../lib/morningGreetingTemplates'
import {
  buildCultureStoryMessages,
  cultureStoryCategory,
  cultureStoryLastRunKey,
  normalizeCultureStorySlot,
} from '../../../../../lib/dailyCultureStory'
import {
  buildXCommunityMessages,
  normalizeXCommunitySlot,
  normalizeXCommunityText,
  pickXCommunityVariant,
  xCommunityLastRunKey,
} from '../../../../../lib/xCommunityPosts'
import {
  DAILY_GREETING_LLM_PROMPT_KEY,
  DAILY_GREETING_MODE_KEY,
  DAILY_GREETING_OLLAMA_PROVIDER_KEY,
  buildGreetingLlmMessages,
  buildGreetingLengthRepairMessages,
  fitGeneratedGreetingToXLimit,
  normalizeGeneratedGreeting,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
  pickDailyGreetingStyle,
} from '../../../../../lib/dailyGreetingLlm'
import { callDeepSeek } from '../../../../../lib/deepseek'
import { callOllama } from '../../../../../lib/ollama'
import { getXCredentials, publishXPost, uploadXMedia } from '../../../../../lib/xDistribution'
import { recordXApiPostCost, xPostCreatePricing } from '../../../../../lib/xApiCost'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SECRET_HEADER = 'x-morning-greeting-secret'

async function readSetting(db, key) {
  const { results } = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).all()
  return results?.[0]?.value ?? null
}

async function writeSetting(db, key, value, updatedBy) {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
    .bind(key, value, Date.now(), String(updatedBy || 'automation'))
    .run()
}

export async function POST(req) {
  const requestNow = new Date()
  const env = getOptionalRequestContext()?.env || {}
  const expectedSecret = String(env.MORNING_GREETING_SECRET || process.env.MORNING_GREETING_SECRET || '').trim()
  if (!expectedSecret) {
    return Response.json(
      {
        ok: false,
        error: 'MORNING_GREETING_SECRET_NOT_CONFIGURED',
        detail: '请先在 Cloudflare Pages 环境变量配置 MORNING_GREETING_SECRET（与 GitHub 仓库 Secret 同值）。',
      },
      { status: 503 },
    )
  }
  if (req.headers.get(SECRET_HEADER) !== expectedSecret) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const searchParams = new URL(req.url).searchParams
  const requestedStorySlot = searchParams.get('story')
  const storySlot = requestedStorySlot ? normalizeCultureStorySlot(requestedStorySlot) : ''
  if (requestedStorySlot && !storySlot) {
    return Response.json({ ok: false, error: 'INVALID_STORY_SLOT', detail: 'story 仅支持 culture_morning、culture_afternoon、culture_evening。' }, { status: 400 })
  }
  const isCultureStory = Boolean(storySlot)
  const requestedCommunitySlot = searchParams.get('community')
  const communitySlot = requestedCommunitySlot ? normalizeXCommunitySlot(requestedCommunitySlot) : ''
  if (requestedCommunitySlot && !communitySlot) {
    return Response.json(
      { ok: false, error: 'INVALID_COMMUNITY_SLOT', detail: 'community 仅支持 community_friends、community_learning、community_growth。' },
      { status: 400 },
    )
  }
  if (isCultureStory && communitySlot) {
    return Response.json({ ok: false, error: 'AMBIGUOUS_CONTENT_TYPE' }, { status: 400 })
  }
  const isCommunityPost = Boolean(communitySlot)
  const communityVariant = isCommunityPost ? pickXCommunityVariant({ slot: communitySlot, now: requestNow }) : null
  const requestedPeriod = searchParams.get('period')
  const period = requestedPeriod
    ? normalizeGreetingPeriod(requestedPeriod, '')
    : greetingPeriodForDate()
  if (!isCultureStory && !isCommunityPost && !period) {
    return Response.json({ ok: false, error: 'INVALID_PERIOD', detail: 'period 仅支持 morning、noon、evening。' }, { status: 400 })
  }
  const runSlot = storySlot || communitySlot || period
  const storyCategory = isCultureStory ? cultureStoryCategory({ slot: storySlot, now: requestNow }) : ''
  const lastRunKey = isCultureStory
    ? cultureStoryLastRunKey(storySlot)
    : isCommunityPost
      ? xCommunityLastRunKey(communitySlot)
      : greetingLastRunKey(period)

  const db = env.DB || null
  if (db) {
    try {
      const state = await readSetting(db, MORNING_GREETING_SETTING_KEY)
      if (isAutomationPaused(state)) {
        return Response.json(
          { ok: false, error: 'PAUSED', detail: '后台已暂停该自动化，本次不发布。' },
          { status: 423 },
        )
      }
    } catch {
      // D1 不可用时按“运行中”放行，发布失败由 X 凭据环节兜底。
    }
    try {
      // 同一自然日的同一时段只成功发布一次；九个时段分别记录，互不阻断。
      const lastRunRaw = await readSetting(db, lastRunKey)
      if (lastRunRaw) {
        const lastRun = JSON.parse(lastRunRaw)
        if (lastRun?.ok && shanghaiDateKey(lastRun.at) === shanghaiDateKey(requestNow)) {
          return Response.json(
            {
              ok: true,
              skipped: true,
              reason: 'already_posted_today',
              period: runSlot,
              postId: lastRun.postId || '',
              postUrl: lastRun.postUrl || '',
            },
            { status: 200 },
          )
        }
      }
    } catch {
      // 上次记录缺失或无法解析时按“未发布”处理，允许重试。
    }
  }

  let generationMode = 'deepseek'
  let llmIntent = ''
  let ollamaProviderId = ''
  if (db) {
    try {
      const [modeRaw, intentRaw, providerRaw] = await Promise.all([
        readSetting(db, DAILY_GREETING_MODE_KEY),
        readSetting(db, DAILY_GREETING_LLM_PROMPT_KEY),
        readSetting(db, DAILY_GREETING_OLLAMA_PROVIDER_KEY),
      ])
      generationMode = normalizeGreetingGenerationMode(modeRaw)
      llmIntent = normalizeGreetingLlmIntent(intentRaw)
      ollamaProviderId = String(providerRaw || '').trim()
      if (generationMode === 'ollama') {
        const savedProvider = ollamaProviderId
          ? await db.prepare(
              `SELECT id FROM llm_providers WHERE id = ? AND provider_type = 'ollama' AND status = 'active'`,
            ).bind(ollamaProviderId).first()
          : null
        const provider = savedProvider || await db.prepare(
          `SELECT id FROM llm_providers
           WHERE provider_type = 'ollama' AND status = 'active'
           ORDER BY CASE WHEN default_model LIKE 'qwen3.5:%' THEN 0 ELSE 1 END, updated_at DESC
           LIMIT 1`,
        ).first()
        ollamaProviderId = String(provider?.id || '')
      }
    } catch {
      // 配置缺失或暂时无法读取时沿用产品默认值：DeepSeek 意图模式。
      generationMode = 'deepseek'
    }
  }
  // 固定模板只适用于早午晚安；文化短故事和朋友图文始终实时生成。
  if ((isCultureStory || isCommunityPost) && generationMode === 'template') generationMode = 'deepseek'
  const greetingStyle = !isCultureStory && !isCommunityPost && generationMode !== 'template'
    ? pickDailyGreetingStyle()
    : null

  let text = ''
  let generation = null
  if (generationMode === 'deepseek' || generationMode === 'ollama') {
    try {
      const generationArgs = {
        messages: isCultureStory
          ? buildCultureStoryMessages({ slot: storySlot, now: requestNow })
          : isCommunityPost
            ? buildXCommunityMessages({ slot: communitySlot, now: requestNow, variant: communityVariant })
            : buildGreetingLlmMessages({ intent: llmIntent, period, now: requestNow, style: greetingStyle }),
        temperature: 0.85,
        maxTokens: isCultureStory ? 384 : 256,
        task: {
          source: 'x-daily-greeting',
          taskType: 'direct-post-copy',
          title: isCultureStory
            ? `X 文化短故事：${storySlot}`
            : isCommunityPost
              ? `X 朋友图文帖：${communitySlot}`
              : `X 每日问候：${period}`,
          actorId: 'cron:x-daily-greeting',
          actorName: '线上定时自动化',
          inputSummary: isCultureStory
            ? `时段：${storySlot}；类别：${storyCategory}`
            : isCommunityPost
              ? `时段：${communitySlot}；场景：${communityVariant.label}；标签：${communityVariant.tags.join(' ')}`
              : `时段：${period}；风格：${greetingStyle.label}；意图：${llmIntent.slice(0, 500)}`,
          metadata: {
            period: runSlot,
            contentType: isCultureStory ? 'culture-story' : isCommunityPost ? 'community-image' : 'greeting',
            directPublish: true,
            generationMode,
            greetingStyle: greetingStyle?.id || '',
          },
        },
      }
      generation = generationMode === 'ollama'
        ? await callOllama({
            ...generationArgs,
            providerId: ollamaProviderId,
            reasoningEffort: 'none',
            timeoutMs: 120_000,
          })
        : await callDeepSeek({
            ...generationArgs,
            env,
            timeoutMs: 45_000,
            taskDefaultModel: 'deepseek-v4-flash',
            disableThinking: true,
          })
      text = normalizeGeneratedGreeting(generation.content)
      if (!text) throw Object.assign(new Error('模型没有生成可发布文案'), { code: 'EMPTY_GENERATED_GREETING' })

      if (!greetingWithinLimit(text)) {
        try {
          const repairArgs = {
            ...generationArgs,
            messages: buildGreetingLengthRepairMessages({ text }),
            temperature: 0.2,
            maxTokens: 192,
            task: {
              ...generationArgs.task,
              title: `${generationArgs.task.title}（限长压缩）`,
              inputSummary: `原始文案 X 加权长度超限；${generationArgs.task.inputSummary}`,
              metadata: { ...generationArgs.task.metadata, lengthRepair: true },
            },
          }
          const repaired = generationMode === 'ollama'
            ? await callOllama({
                ...repairArgs,
                providerId: ollamaProviderId,
                reasoningEffort: 'none',
                timeoutMs: 120_000,
              })
            : await callDeepSeek({
                ...repairArgs,
                env,
                timeoutMs: 45_000,
                taskDefaultModel: 'deepseek-v4-flash',
                disableThinking: true,
              })
          const repairedText = normalizeGeneratedGreeting(repaired.content)
          if (repairedText) {
            text = repairedText
            generation = repaired
          }
        } catch {
          // 压缩调用失败时继续使用原文，由下方确定性限长兜底，避免定时任务整次失败。
        }
      }
      text = fitGeneratedGreetingToXLimit(text).text
    } catch (error) {
      const errorCode = String(error?.code || 'LLM_GENERATION_FAILED')
      if (db) {
        await writeSetting(
          db,
          lastRunKey,
          JSON.stringify({
            at: Date.now(),
            ok: false,
            period: runSlot,
            mode: generationMode,
            style: greetingStyle?.id || '',
            styleLabel: greetingStyle?.label || '',
            stage: 'generation',
            error: errorCode,
          }),
          'automation',
        ).catch(() => {})
      }
      const status = ['MISSING_DEEPSEEK_API_KEY', 'MISSING_OLLAMA_PROVIDER', 'OLLAMA_PROVIDER_NOT_FOUND'].includes(errorCode) ? 503 : 502
      return Response.json(
        { ok: false, error: errorCode, detail: error?.message || '模型文案生成失败。', period: runSlot, mode: generationMode },
        { status },
      )
    }
  } else {
    // 问候模板以后台 morning_greeting_templates 为准；表不可用或为空时回退代码默认值。
    let pickedTemplate = null
    if (db) {
      try {
        pickedTemplate = pickDailyGreetingTemplate(await listEnabledMorningGreetingTexts(db, period), { period })
      } catch {
        pickedTemplate = null
      }
    }
    text = buildDailyGreeting({ period, template: pickedTemplate })
  }
  if (!greetingWithinLimit(text)) {
    if (db) {
      await writeSetting(
        db,
        lastRunKey,
        JSON.stringify({
          at: Date.now(),
          ok: false,
          period: runSlot,
          mode: generationMode,
          style: greetingStyle?.id || '',
          styleLabel: greetingStyle?.label || '',
          stage: 'validation',
          error: 'TEXT_TOO_LONG',
        }),
        'automation',
      ).catch(() => {})
    }
    return Response.json({ ok: false, error: 'TEXT_TOO_LONG', period: runSlot, mode: generationMode }, { status: 400 })
  }
  if (isCommunityPost) text = normalizeXCommunityText(text, communitySlot, 280, communityVariant)

  const credentials = getXCredentials(env)
  let mediaId = ''
  if (isCommunityPost) {
    let imageResponse
    try {
      imageResponse = await fetch(new URL(communityVariant.imagePath, req.url))
    } catch {
      imageResponse = null
    }
    if (!imageResponse?.ok) {
      if (db) {
        await writeSetting(db, lastRunKey, JSON.stringify({
          at: Date.now(), ok: false, period: runSlot, mode: generationMode,
          stage: 'image-fetch', error: 'COMMUNITY_IMAGE_UNAVAILABLE',
        }), 'automation').catch(() => {})
      }
      return Response.json({ ok: false, error: 'COMMUNITY_IMAGE_UNAVAILABLE', period: runSlot }, { status: 502 })
    }
    const upload = await uploadXMedia(await imageResponse.blob(), { credentials })
    if (!upload.ok) {
      if (db) {
        await writeSetting(db, lastRunKey, JSON.stringify({
          at: Date.now(), ok: false, period: runSlot, mode: generationMode,
          stage: 'media-upload', error: upload.error,
        }), 'automation').catch(() => {})
      }
      return Response.json({ ...upload, period: runSlot }, { status: upload.status })
    }
    mediaId = upload.mediaId
  }

  const result = await publishXPost(text, { credentials, mediaIds: mediaId ? [mediaId] : [] })
  if (!result.ok) {
    if (db) {
      await writeSetting(
        db,
        lastRunKey,
        JSON.stringify({
          at: Date.now(),
          ok: false,
          period: runSlot,
          mode: generationMode,
          style: greetingStyle?.id || '',
          styleLabel: greetingStyle?.label || '',
          stage: 'publish',
          error: result.error,
        }),
        'automation',
      ).catch(() => {})
    }
    return Response.json(result, { status: result.status })
  }

  if (db) {
    const publishedAt = Date.now()
    const xApiPricing = xPostCreatePricing(text)
    const run = JSON.stringify({
      at: publishedAt,
      ok: true,
      period: runSlot,
      contentType: isCultureStory ? 'culture-story' : isCommunityPost ? 'community-image' : 'greeting',
      category: storyCategory,
      theme: communityVariant?.label || '',
      imagePath: communityVariant?.imagePath || '',
      mediaId,
      mode: generationMode,
      style: greetingStyle?.id || '',
      styleLabel: greetingStyle?.label || '',
      postId: result.post.id,
      postUrl: result.post.url,
      model: generation?.model || '',
      deepseekTaskId: generation?.taskId || '',
      providerId: generation?.providerId || '',
      providerName: generation?.providerName || (generationMode === 'deepseek' ? 'DeepSeek Flash' : ''),
      xApiPricingKey: xApiPricing.key,
      xApiCostMicroUsd: xApiPricing.microUsd,
    })
    await Promise.allSettled([
      writeSetting(db, lastRunKey, run, 'automation'),
      // 保留旧的“最新一次运行”键，供现有运维控制台继续展示。
      writeSetting(db, 'automation.x_morning_greeting.last_run', run, 'automation'),
      recordXApiPostCost(db, {
        postId: result.post.id,
        slot: runSlot,
        contentType: isCultureStory ? 'culture-story' : isCommunityPost ? 'community-image' : 'greeting',
        text,
        createdAt: publishedAt,
      }),
    ])
  }
  return Response.json({
    ok: true,
    period: runSlot,
    contentType: isCultureStory ? 'culture-story' : isCommunityPost ? 'community-image' : 'greeting',
    category: storyCategory,
    theme: communityVariant?.label || '',
    imagePath: communityVariant?.imagePath || '',
    mode: generationMode,
    style: greetingStyle?.id || '',
    styleLabel: greetingStyle?.label || '',
    model: generation?.model || '',
    providerId: generation?.providerId || '',
    providerName: generation?.providerName || (generationMode === 'deepseek' ? 'DeepSeek Flash' : ''),
    post: result.post,
    text,
  }, { status: 201 })
}
