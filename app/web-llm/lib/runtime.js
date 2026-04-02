import { DEFAULT_MODEL_ID, MAX_IMAGE_EDGE } from './constants'
import { SITE_CONTEXT } from './siteContext'

let runtimePromise = null
let runtimeModule = null
let loadedModelId = null
let processor = null
let model = null

function getDiagnostics() {
  if (typeof window === 'undefined') {
    return {
      hasWebGPU: false,
      isSecureContext: false,
      crossOriginIsolated: false,
      userAgent: '',
    }
  }

  return {
    hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
    isSecureContext: window.isSecureContext === true,
    crossOriginIsolated: window.crossOriginIsolated === true,
    userAgent: navigator.userAgent,
  }
}

function aggregateProgress(items) {
  const totals = Object.values(items).reduce(
    (acc, item) => {
      acc.loaded += item.loaded || 0
      acc.total += item.total || 0
      return acc
    },
    { loaded: 0, total: 0 }
  )

  return {
    loaded: totals.loaded,
    total: totals.total,
    percent: totals.total > 0 ? Math.min(100, Math.round((totals.loaded / totals.total) * 100)) : 0,
  }
}

class DomTextStreamer {
  constructor(tokenizer, onUpdate) {
    this.text = ''
    this.decodeTokens = 0
    this.firstTokenAt = 0
    this.lastTps = 0
    this.onUpdate = onUpdate
    this.textStreamer = new runtimeModule.TextStreamer(tokenizer, {
      skip_prompt: true,
      callback_function: (chunk) => {
        this.text += chunk
        this.emit()
      },
      token_callback_function: (tokens) => {
        if (!this.firstTokenAt) {
          this.firstTokenAt = performance.now()
        }
        this.decodeTokens += Array.isArray(tokens) ? tokens.length : 0
        this.emit()
      },
    })
  }

  put(value) {
    this.textStreamer.put(value)
  }

  end() {
    this.textStreamer.end()
    this.emit(true)
  }

  emit(isDone = false) {
    if (this.firstTokenAt && this.decodeTokens > 0) {
      const elapsed = Math.max((performance.now() - this.firstTokenAt) / 1000, 0.001)
      this.lastTps = Number((this.decodeTokens / elapsed).toFixed(2))
    }

    this.onUpdate({
      text: this.text,
      tokenCount: this.decodeTokens,
      tps: this.lastTps,
      isDone,
    })
  }
}

async function ensureRuntimeModule() {
  if (!runtimePromise) {
    runtimePromise = import('@huggingface/transformers').then((mod) => {
      mod.env.allowLocalModels = false
      mod.env.useBrowserCache = true
      mod.env.backends.onnx.wasm.proxy = false
      runtimeModule = mod
      return mod
    })
  }

  return runtimePromise
}

export async function loadModel(modelId = DEFAULT_MODEL_ID, onProgress) {
  const diagnostics = getDiagnostics()
  if (!diagnostics.hasWebGPU || !diagnostics.isSecureContext || !diagnostics.crossOriginIsolated) {
    throw new Error('当前环境不满足 WebGPU 推理条件，请先查看页面中的运行状态提示。')
  }

  const mod = await ensureRuntimeModule()
  if (loadedModelId === modelId && processor && model) {
    onProgress?.({
      status: 'ready',
      percent: 100,
      message: '模型已就绪',
      diagnostics,
    })
    return { processor, model, diagnostics }
  }

  const progressItems = {}
  const handleProgress = (event) => {
    if (event?.status === 'progress' && event?.file) {
      progressItems[event.file] = {
        loaded: event.loaded || 0,
        total: event.total || 0,
      }
      const aggregate = aggregateProgress(progressItems)
      onProgress?.({
        status: 'progress',
        percent: aggregate.percent,
        loaded: aggregate.loaded,
        total: aggregate.total,
        file: event.file,
        message: `正在下载 ${event.file}`,
        diagnostics,
      })
      return
    }

    if (event?.status === 'done') {
      onProgress?.({
        status: 'done',
        percent: 100,
        file: event.file,
        message: `已完成 ${event.file}`,
        diagnostics,
      })
      return
    }

    if (event?.status) {
      onProgress?.({
        status: event.status,
        percent: 0,
        file: event.file,
        message: event.status,
        diagnostics,
      })
    }
  }

  const sharedOptions = {
    progress_callback: handleProgress,
  }

  const [nextProcessor, nextModel] = await Promise.all([
    mod.AutoProcessor.from_pretrained(modelId, sharedOptions),
    mod.Qwen3_5ForConditionalGeneration.from_pretrained(modelId, {
      ...sharedOptions,
      device: 'webgpu',
      dtype: 'q4',
    }),
  ])

  processor = nextProcessor
  model = nextModel
  loadedModelId = modelId

  onProgress?.({
    status: 'ready',
    percent: 100,
    message: '模型加载完成',
    diagnostics,
  })

  return { processor, model, diagnostics }
}

async function dataUrlToRawImage(dataUrl) {
  const mod = await ensureRuntimeModule()
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const rawImage = await mod.RawImage.fromBlob(blob)
  return rawImage.resize(MAX_IMAGE_EDGE, null)
}

export async function runInference({ modelId = DEFAULT_MODEL_ID, messages, maxNewTokens, onUpdate }) {
  const { processor: activeProcessor, model: activeModel } = await loadModel(modelId)

  const images = []
  const conversation = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: [
            '你是 tuaran.me 里的网页大模型助手。',
            '请优先根据提供的站点固定上下文回答与本站、tuaran、本地项目相关的问题。',
            '如果上下文没有明确提到，就直接说“这个上下文里没有提到”，不要编造。',
            '',
            '固定上下文：',
            SITE_CONTEXT,
          ].join('\n'),
        },
      ],
    },
  ]

  for (const message of messages) {
    if (message.role === 'system') {
      conversation.push({
        role: 'system',
        content: [{ type: 'text', text: message.text || '' }],
      })
      continue
    }

    if (message.role === 'assistant') {
      conversation.push({
        role: 'assistant',
        content: [{ type: 'text', text: message.text || '' }],
      })
      continue
    }

    const content = []
    if (message.image) {
      images.push(await dataUrlToRawImage(message.image))
      content.push({ type: 'image' })
    }
    if (message.text) {
      content.push({ type: 'text', text: message.text })
    }
    conversation.push({
      role: 'user',
      content,
    })
  }

  const prompt = activeProcessor.apply_chat_template(conversation, {
    add_generation_prompt: true,
  })
  const inputs = await activeProcessor(prompt, images.length ? images : null)
  const streamer = new DomTextStreamer(activeProcessor.tokenizer, onUpdate)

  await activeModel.generate({
    ...inputs,
    max_new_tokens: maxNewTokens,
    streamer,
  })

  return {
    text: streamer.text,
    tps: streamer.lastTps,
    diagnostics: getDiagnostics(),
  }
}

export function getRuntimeDiagnostics() {
  return getDiagnostics()
}

export function getSiteContextPreview() {
  return SITE_CONTEXT
}
