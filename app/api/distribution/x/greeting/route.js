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
  buildXUsAudienceLengthRepairMessages,
  buildXUsAudienceMessages,
  normalizeXUsAudienceSlot,
  xUsAudienceLastRunKey,
} from '../../../../../lib/xUsAudiencePosts'
import {
  buildXCryptoMessages,
  normalizeXCryptoSlot,
  pickXCryptoTopic,
  xCryptoLastRunKey,
} from '../../../../../lib/xCryptoPosts'
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
import { claimXAsset, releaseXAsset, updateXAsset, saveXPostDraft, prepareXImage, buildXImageBriefMessages, assetError, xAssetView } from '../../../../../lib/xPostAssets'
import { recordXApiPostCost, xPostCreatePricing } from '../../../../../lib/xApiCost'
import { xPostingSchedule, isXPostDue } from '../../../../../lib/xPostingSchedule'

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
  const requestedUsSlot = searchParams.get('us')
  const usSlot = requestedUsSlot ? normalizeXUsAudienceSlot(requestedUsSlot) : ''
  if (requestedUsSlot && !usSlot) {
    return Response.json(
      { ok: false, error: 'INVALID_US_SLOT', detail: 'us 仅支持 us_morning、us_midday、us_evening。' },
      { status: 400 },
    )
  }
  const requestedCryptoSlot = searchParams.get('crypto')
  const cryptoSlot = requestedCryptoSlot ? normalizeXCryptoSlot(requestedCryptoSlot) : ''
  if (requestedCryptoSlot && !cryptoSlot) {
    return Response.json(
      { ok: false, error: 'INVALID_CRYPTO_SLOT', detail: 'crypto 仅支持 crypto_knowledge、crypto_market、crypto_people。' },
      { status: 400 },
    )
  }
  if ([Boolean(isCultureStory), Boolean(communitySlot), Boolean(usSlot), Boolean(cryptoSlot)].filter(Boolean).length > 1) {
    return Response.json({ ok: false, error: 'AMBIGUOUS_CONTENT_TYPE' }, { status: 400 })
  }
  const isCommunityPost = Boolean(communitySlot)
  const isUsPost = Boolean(usSlot)
  const isCryptoPost = Boolean(cryptoSlot)
  const communityVariant = isCommunityPost ? pickXCommunityVariant({ slot: communitySlot, now: requestNow }) : null
  const cryptoTopic = isCryptoPost ? pickXCryptoTopic({ slot: cryptoSlot, now: requestNow }) : ''
  const requestedPeriod = searchParams.get('period')
  const period = requestedPeriod
    ? normalizeGreetingPeriod(requestedPeriod, '')
    : greetingPeriodForDate()
  if (!isCultureStory && !isCommunityPost && !isUsPost && !isCryptoPost && !period) {
    return Response.json({ ok: false, error: 'INVALID_PERIOD', detail: 'period 仅支持 morning、noon、evening。' }, { status: 400 })
  }
  const runSlot = storySlot || communitySlot || cryptoSlot || usSlot || period
  const scheduledDate = searchParams.get('scheduledDate')
  const schedule = scheduledDate
    ? (await xPostingSchedule(requestNow)).find((item) => item.id === runSlot)
    : null
  if (scheduledDate && (scheduledDate !== schedule.date || !isXPostDue(schedule, requestNow))) {
    return Response.json({ ok: true, skipped: true, reason: 'outside_schedule_window' })
  }
  const contentType = isCultureStory ? 'culture-story' : isCommunityPost ? 'community-image' : isCryptoPost ? 'crypto-insight' : isUsPost ? 'us-english' : 'greeting'
  const storyCategory = isCultureStory ? cultureStoryCategory({ slot: storySlot, now: requestNow }) : ''
  const lastRunKey = isCultureStory
    ? cultureStoryLastRunKey(storySlot)
    : isCommunityPost
      ? xCommunityLastRunKey(communitySlot)
      : isCryptoPost
        ? xCryptoLastRunKey(cryptoSlot)
        : isUsPost
          ? xUsAudienceLastRunKey(usSlot)
          : greetingLastRunKey(period)

  const db = env.DB || null
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
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
      return Response.json({ ok: false, error: 'AUTOMATION_STATE_UNAVAILABLE' }, { status: 503 })
    }
    try {
      // 同一自然日的同一时段只成功发布一次；十五个时段分别记录，互不阻断。
      const lastRunRaw = await readSetting(db, lastRunKey)
      if (lastRunRaw) {
        const lastRun = JSON.parse(lastRunRaw)
        const lastRunDate = lastRun?.date || shanghaiDateKey(lastRun?.at)
        if (lastRun?.ok && lastRunDate === shanghaiDateKey(requestNow)) {
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
      // 无法核实旧版本发帖记录时停止，避免升级当天重复发布。
      return Response.json({ ok: false, error: 'AUTOMATION_STATE_UNAVAILABLE' }, { status: 503 })
    }
  }

  const credentials = getXCredentials(env)
  if (!credentials) return Response.json({ ok: false, error: 'X_NOT_CONFIGURED' }, { status: 503 })
  let asset
  try {
    asset = await claimXAsset(db, { date: shanghaiDateKey(requestNow), slot: runSlot, contentType })
  } catch {
    return Response.json({ ok: false, error: 'X_ASSET_STORAGE_UNAVAILABLE', detail: '请检查 D1 并应用 0082_x_post_assets.sql。' }, { status: 503 })
  }
  if (!asset.acquired) {
    if (asset.row?.status === 'published') return Response.json({ ok: true, skipped: true, reason: 'already_posted_today', postUrl: asset.row.post_url })
    return Response.json({ ok: false, error: ['publishing', 'publish-unknown'].includes(asset.row?.status) ? 'X_PUBLISH_REQUIRES_REVIEW' : 'X_TASK_IN_PROGRESS' }, { status: 409 })
  }
  let stage = 'generation'
  try {
    const response = await runWithAsset()
    if (response.status >= 400 && !['publishing', 'publish-unknown', 'published'].includes(asset.row.status)) {
      const failure = await response.clone().json().catch(() => ({}))
      await updateXAsset(db, asset, { status: 'failed', error: failure.error || 'X_TASK_FAILED' })
    }
    return response
  } catch (error) {
    const code = error?.code || 'X_IMAGE_PIPELINE_FAILED'
    const uncertain = ['publishing', 'publish-unknown', 'published'].includes(asset.row.status)
    if (!uncertain) await updateXAsset(db, asset, { status: 'failed', error: code }).catch(() => {})
    await writeSetting(db, lastRunKey, JSON.stringify({
      at: Date.now(), ok: false, period: runSlot, contentType, stage,
      error: uncertain ? 'X_PUBLISH_REQUIRES_REVIEW' : code,
      assetId: asset.row.id, imagePath: xAssetView(asset.row).imageUrl,
    }), 'automation').catch(() => {})
    return Response.json({ ok: false, error: uncertain ? 'X_PUBLISH_REQUIRES_REVIEW' : code, stage }, { status: error?.status || 502 })
  } finally {
    await releaseXAsset(db, asset).catch(() => {})
  }

  async function runWithAsset() {
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
    // 固定模板只适用于早午晚安；其余任务始终实时生成。
    if ((isCultureStory || isCommunityPost || isUsPost || isCryptoPost) && generationMode === 'template') generationMode = 'deepseek'
    const greetingStyle = !isCultureStory && !isCommunityPost && !isUsPost && !isCryptoPost && generationMode !== 'template'
      ? pickDailyGreetingStyle()
      : null

    let text = asset.row.text || ''
    let generation = null
    if (text) {
      // Resume the saved draft so retries keep the image and copy together.
    } else if (generationMode === 'deepseek' || generationMode === 'ollama') {
      try {
        const generationArgs = {
          messages: isCultureStory
            ? buildCultureStoryMessages({ slot: storySlot, now: requestNow })
            : isCommunityPost
              ? buildXCommunityMessages({ slot: communitySlot, now: requestNow, variant: communityVariant })
              : isCryptoPost
                ? buildXCryptoMessages({ slot: cryptoSlot, now: requestNow })
                : isUsPost
                  ? buildXUsAudienceMessages({ slot: usSlot, now: requestNow })
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
                : isCryptoPost
                  ? `X 加密内容：${cryptoSlot}`
                  : isUsPost
                    ? `X 美区英文帖：${usSlot}`
                    : `X 每日问候：${period}`,
            actorId: 'cron:x-daily-greeting',
            actorName: '线上定时自动化',
            inputSummary: isCultureStory
              ? `时段：${storySlot}；类别：${storyCategory}`
              : isCommunityPost
                ? `时段：${communitySlot}；场景：${communityVariant.label}；标签：${communityVariant.tags.join(' ')}`
                : isCryptoPost
                  ? `时段：${cryptoSlot}；主题：${cryptoTopic}；边界：不喊单、不承诺收益`
                  : isUsPost
                    ? `时段：${usSlot}；语言：美式英语；受众：美国开发者、AI 用户、独立创作者`
                    : `时段：${period}；风格：${greetingStyle.label}；意图：${llmIntent.slice(0, 500)}`,
            metadata: {
              period: runSlot,
              contentType,
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
              messages: isUsPost
                ? buildXUsAudienceLengthRepairMessages({ text })
                : buildGreetingLengthRepairMessages({ text }),
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

    const postFormat = await saveXPostDraft(db, asset, { text })
    let mediaId = ''
    if (postFormat === 'image') {
      stage = 'image-generation'
      const image = await prepareXImage({
        db, bucket: env.MEDIA, ai: env.AI, asset,
        createPrompt: async (style) => {
          const brief = await callDeepSeek({
            env, messages: buildXImageBriefMessages({ text, contentType, slot: runSlot, style }),
            maxTokens: 320, temperature: 0.7, timeoutMs: 45_000,
            taskDefaultModel: 'deepseek-v4-flash', disableThinking: true,
            task: { source: 'x-daily-greeting', taskType: 'image-prompt', title: `X 配图：${runSlot}`,
              actorId: 'cron:x-daily-greeting', inputSummary: text,
              metadata: { assetId: asset.row.id, contentType } },
          })
          return brief.content
        },
      })
      stage = 'media-upload'
      const upload = await uploadXMedia(image, { credentials })
      if (!upload.ok) throw assetError(upload.error, upload.status)
      mediaId = upload.mediaId
    }
    // Persist intent BEFORE sending to X. An ambiguous response must not auto-repost.
    stage = 'publish'
    await updateXAsset(db, asset, { status: 'publishing', media_id: mediaId, error: '' })
    const result = await publishXPost(text, { credentials, mediaIds: mediaId ? [mediaId] : [] })
    if (!result.ok) {
      const uncertain = result.error === 'X_UNREACHABLE' || !result.xStatus || result.xStatus >= 500 || result.xStatus < 400
      await updateXAsset(db, asset, { status: uncertain ? 'publish-unknown' : 'failed', error: result.error })
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
            assetId: asset.row.id,
            imagePath: xAssetView(asset.row).imageUrl,
            error: result.error,
          }),
          'automation',
        ).catch(() => {})
      }
      return Response.json(result, { status: result.status })
    }

    await updateXAsset(db, asset, { status: 'published', post_id: result.post.id, post_url: result.post.url, error: '' })
    if (db) {
      const publishedAt = Date.now()
      const xApiPricing = xPostCreatePricing(text)
      const run = JSON.stringify({
        date: asset.row.date_key,
        postFormat,
        scheduledAt: schedule?.scheduledAt || null,
        at: publishedAt,
        ok: true,
        period: runSlot,
        contentType,
        category: storyCategory,
        theme: communityVariant?.label || '',
        topic: cryptoTopic,
        imagePath: xAssetView(asset.row).imageUrl,
        assetId: asset.row.id,
        imageModel: asset.row.image_model,
        imageSource: asset.row.asset_source,
        fallbackError: asset.row.fallback_error,
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
          contentType,
          text,
          createdAt: publishedAt,
        }),
      ])
    }
    return Response.json({
      ok: true,
      period: runSlot,
      contentType,
      category: storyCategory,
      theme: communityVariant?.label || '',
      topic: cryptoTopic,
      imagePath: xAssetView(asset.row).imageUrl,
      assetId: asset.row.id,
      imageModel: asset.row.image_model,
      imageSource: asset.row.asset_source,
      fallbackError: asset.row.fallback_error,
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
}
