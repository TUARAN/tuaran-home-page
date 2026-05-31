'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

const MODEL_OPTIONS = {
  'onnx-community/Qwen3.5-0.8B-ONNX': {
    label: 'Qwen3.5-0.8B',
    notes: '推荐首测，体积最小，加载成功率最高。',
  },
  'onnx-community/Qwen3.5-2B-ONNX': {
    label: 'Qwen3.5-2B',
    notes: '回答质量更稳，对显存和下载体积要求更高。',
  },
  'onnx-community/Qwen3.5-4B-ONNX': {
    label: 'Qwen3.5-4B',
    notes: '仅建议高显存设备尝试。',
  },
}

const MODEL_SOURCES = {
  official: { label: '官方源 huggingface.co', host: 'https://huggingface.co/' },
  mirror: { label: '国内镜像 hf-mirror.com', host: 'https://hf-mirror.com/' },
}

const SOURCE_ORDER = ['mirror', 'official']

const DB_NAME = 'QwenChatDB'
const STORE_NAME = 'chats'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_SIDE = 1280
const MAX_CONTEXT_MESSAGES = 8
const MAX_CONTEXT_IMAGES = 2

function nowId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

function getBrowserDiagnostics() {
  if (typeof window === 'undefined') return []

  const notices = []
  if (!('gpu' in navigator)) {
    notices.push('当前浏览器未暴露 WebGPU，无法在 GPU 上加载模型。建议使用新版 Chrome/Edge。')
  }
  if (!window.isSecureContext) {
    notices.push('当前页面不是安全上下文，请通过 localhost 或 HTTPS 访问。')
  }
  if (!crossOriginIsolated) {
    notices.push('当前页面未启用 cross-origin isolation，部分 ONNX/WebAssembly 优化可能不可用。')
  }
  return notices
}

function openChatDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (event) => resolve(event.target.result)
    request.onerror = (event) => reject(event.target.error)
  })
}

function txRequest(db, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = action(store)
    tx.oncomplete = () => resolve(result?.result)
    tx.onerror = (event) => reject(event.target.error)
  })
}

async function getAllChats(db) {
  const chats = await txRequest(db, 'readonly', (store) => store.getAll())
  return (chats || []).sort((a, b) => b.id - a.id)
}

async function saveChat(db, chat) {
  await txRequest(db, 'readwrite', (store) => store.put(chat))
}

async function removeChat(db, id) {
  await txRequest(db, 'readwrite', (store) => store.delete(id))
}

async function clearChats(db) {
  await txRequest(db, 'readwrite', (store) => store.clear())
}

async function probeModelSource(source, modelId, timeoutMs = 6000) {
  const startedAt = performance.now()
  const target = `${source.host}${modelId}/resolve/main/config.json`
  let timer = null
  try {
    const controller = new AbortController()
    timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(target, { mode: 'cors', cache: 'no-store', signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) {
      return { status: 'fail', latency: 0, error: `HTTP ${response.status}` }
    }
    return { status: 'ok', latency: Math.round(performance.now() - startedAt), error: '' }
  } catch (error) {
    if (timer) clearTimeout(timer)
    return {
      status: 'fail',
      latency: 0,
      error: error?.name === 'AbortError' ? '超时' : (error?.message || '无法连接'),
    }
  }
}

function chooseBestSource(results) {
  const available = SOURCE_ORDER
    .map((id) => ({ id, ...results[id] }))
    .filter((item) => item.status === 'ok')
    .sort((a, b) => a.latency - b.latency)
  return available[0]?.id || 'mirror'
}

function buildChatTitle(messages) {
  const firstUser = messages.find((msg) => msg.role === 'user')
  const firstText = firstUser?.text?.trim()
  if (firstText) return firstText.slice(0, 18)
  if (firstUser?.image) return '图片对话'
  return '新对话'
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target.result)
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解码失败，请换一张图片。'))
    image.src = dataUrl
  })
}

async function prepareImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('只支持 JPG、PNG、WebP 图片。')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`图片不能超过 ${formatBytes(MAX_IMAGE_BYTES)}。`)
  }

  const original = await readFileAsDataUrl(file)
  const image = await loadImage(original)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.86),
    name: file.name,
    size: file.size,
    width,
    height,
  }
}

export default function WebLlmPageClient() {
  const [hf, setHf] = useState(null)
  const dbRef = useRef(null)
  const chatScrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const modelRef = useRef(null)
  const processorRef = useRef(null)
  const stopCriteriaRef = useRef(null)
  const loadRunRef = useRef({ id: 0, cancelled: false })

  const [dbReady, setDbReady] = useState(false)
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sourceId, setSourceId] = useState('mirror')
  const [modelId, setModelId] = useState('onnx-community/Qwen3.5-0.8B-ONNX')
  const [modelStatus, setModelStatus] = useState('idle')
  const [generationStatus, setGenerationStatus] = useState('idle')
  const [notice, setNotice] = useState({ kind: 'info', text: '正在初始化实验台...' })
  const [progress, setProgress] = useState({ value: 0, text: '' })
  const [sourceHealth, setSourceHealth] = useState(() => Object.fromEntries(
    Object.keys(MODEL_SOURCES).map((id) => [id, { status: 'idle', latency: 0, error: '' }]),
  ))
  const [isTestingSources, setIsTestingSources] = useState(false)
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [isPreparingImage, setIsPreparingImage] = useState(false)

  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === currentChatId) || null,
    [chats, currentChatId],
  )
  const selectedModel = MODEL_OPTIONS[modelId]
  const canSend = modelStatus === 'ready' && generationStatus !== 'generating' && (input.trim() || pendingImage)

  const testSources = useCallback(async (nextModelId = modelId, options = {}) => {
    const { autoSelect = true, quiet = false } = options
    setIsTestingSources(true)
    setSourceHealth(Object.fromEntries(
      Object.keys(MODEL_SOURCES).map((id) => [id, { status: 'checking', latency: 0, error: '' }]),
    ))
    if (!quiet) {
      setNotice({ kind: 'info', text: `正在测试 ${MODEL_OPTIONS[nextModelId].label} 的下载源连通性...` })
    }

    const entries = await Promise.all(
      Object.entries(MODEL_SOURCES).map(async ([id, source]) => [id, await probeModelSource(source, nextModelId)]),
    )
    const results = Object.fromEntries(entries)
    setSourceHealth(results)
    setIsTestingSources(false)

    const best = chooseBestSource(results)
    const okCount = Object.values(results).filter((item) => item.status === 'ok').length
    if (autoSelect) {
      setSourceId(best)
      if (hf) hf.env.remoteHost = MODEL_SOURCES[best].host
    }
    if (!quiet) {
      if (okCount === 0) {
        setNotice({ kind: 'warn', text: '官方源与国内镜像的模型文件都无法直连。请检查网络、代理或浏览器跨域拦截后重试。' })
      } else {
        setNotice({ kind: 'success', text: `网络测试完成，已选择「${MODEL_SOURCES[best].label}」。` })
      }
    }
    return { results, best, okCount }
  }, [hf, modelId])

  const refreshChats = useCallback(async () => {
    if (!dbRef.current) return []
    const next = await getAllChats(dbRef.current)
    setChats(next)
    return next
  }, [])

  const persistChat = useCallback(async (chatId, nextMessages) => {
    if (!dbRef.current || !chatId) return
    await saveChat(dbRef.current, {
      id: chatId,
      title: buildChatTitle(nextMessages),
      messages: nextMessages,
      updatedAt: Date.now(),
    })
    await refreshChats()
  }, [refreshChats])

  const createNewChat = useCallback(async () => {
    const id = nowId()
    setCurrentChatId(id)
    setMessages([])
    setPendingImage(null)
    setInput('')
    if (dbRef.current) {
      await saveChat(dbRef.current, { id, title: '新对话', messages: [], updatedAt: Date.now() })
      await refreshChats()
    }
  }, [refreshChats])

  const selectChat = useCallback((chat) => {
    setCurrentChatId(chat.id)
    setMessages(chat.messages || [])
    setPendingImage(null)
    setInput('')
  }, [])

  const deleteChat = useCallback(async (chatId) => {
    if (!dbRef.current) return
    await removeChat(dbRef.current, chatId)
    const next = await refreshChats()
    if (chatId === currentChatId) {
      const fallback = next.find((chat) => chat.id !== chatId)
      if (fallback) {
        selectChat(fallback)
      } else {
        await createNewChat()
      }
    }
  }, [createNewChat, currentChatId, refreshChats, selectChat])

  const clearAllLocalChats = useCallback(async () => {
    if (!dbRef.current) return
    const ok = window.confirm('确认清空本页保存在浏览器 IndexedDB 里的全部本地对话和图片？这个操作不可恢复。')
    if (!ok) return
    await clearChats(dbRef.current)
    setChats([])
    await createNewChat()
    setNotice({ kind: 'success', text: '本地对话记录已清空。' })
  }, [createNewChat])

  useEffect(() => {
    let disposed = false

    async function init() {
      try {
        const transformers = await import(/* webpackChunkName: "transformers-web" */ './transformers-browser.js')
        transformers.env.allowLocalModels = false
        if (disposed) return
        setHf(transformers)

        const db = await openChatDB()
        if (disposed) {
          db.close()
          return
        }
        dbRef.current = db
        setDbReady(true)

        const existing = await getAllChats(db)
        if (disposed) return
        setChats(existing)
        if (existing[0]) {
          setCurrentChatId(existing[0].id)
          setMessages(existing[0].messages || [])
        } else {
          const id = nowId()
          await saveChat(db, { id, title: '新对话', messages: [], updatedAt: Date.now() })
          setCurrentChatId(id)
          setChats(await getAllChats(db))
        }

        const diagnostics = getBrowserDiagnostics()
        setNotice({
          kind: diagnostics.length ? 'warn' : 'info',
          text: diagnostics.length
            ? `${MODEL_OPTIONS[modelId].label}: ${MODEL_OPTIONS[modelId].notes} ${diagnostics.join(' ')}`
            : `${MODEL_OPTIONS[modelId].label}: ${MODEL_OPTIONS[modelId].notes}`,
        })

        await testSources(modelId, { autoSelect: true, quiet: true })
      } catch (error) {
        console.error(error)
        setNotice({ kind: 'error', text: `实验台初始化失败：${error.message}` })
      }
    }

    init()
    return () => {
      disposed = true
      dbRef.current?.close?.()
      dbRef.current = null
      stopCriteriaRef.current?.interrupt?.()
    }
    // 初始化只执行一次；后续模型说明和网络测试由 select 的 change handler 更新。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight })
  }, [messages, generationStatus])

  useEffect(() => {
    if (!hf) return
    hf.env.remoteHost = MODEL_SOURCES[sourceId].host
  }, [hf, sourceId])

  function updateModelNotice(nextModelId = modelId) {
    const details = MODEL_OPTIONS[nextModelId]
    const diagnostics = getBrowserDiagnostics()
    setNotice({
      kind: diagnostics.length ? 'warn' : 'info',
      text: diagnostics.length ? `${details.label}: ${details.notes} ${diagnostics.join(' ')}` : `${details.label}: ${details.notes}`,
    })
  }

  async function loadModel() {
    if (!hf || modelStatus === 'loading') return

    if (sourceHealth[sourceId]?.status === 'fail') {
      setNotice({
        kind: 'warn',
        text: `当前选择的「${MODEL_SOURCES[sourceId].label}」刚才测试不可达，建议先点“测试网络”或切换下载源。`,
      })
      return
    }

    const run = { id: Date.now(), cancelled: false }
    loadRunRef.current = run
    setModelStatus('loading')
    setProgress({ value: 0, text: '正在初始化...' })
    setNotice({
      kind: 'info',
      text: `正在从「${MODEL_SOURCES[sourceId].label}」加载 ${MODEL_OPTIONS[modelId].label}。首次下载较慢，完成后会缓存在浏览器。`,
    })

    const progressMap = {}
    const progressCallback = (info) => {
      if (loadRunRef.current !== run || run.cancelled) return
      if (info.status === 'progress') {
        progressMap[info.file] = { loaded: info.loaded, total: info.total }
        let totalLoaded = 0
        let totalSize = 0
        Object.values(progressMap).forEach((entry) => {
          totalLoaded += entry.loaded || 0
          totalSize += entry.total || 0
        })
        const value = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0
        setProgress({ value, text: `下载中... ${Math.round(value)}%` })
      } else if (info.status === 'ready') {
        setProgress({ value: 100, text: '加载至 WebGPU... 这可能还需要一段时间' })
      }
    }

    try {
      const processor = await hf.AutoProcessor.from_pretrained(modelId, { progress_callback: progressCallback })
      const model = await hf.Qwen3_5ForConditionalGeneration.from_pretrained(modelId, {
        dtype: {
          embed_tokens: 'q4',
          vision_encoder: 'fp16',
          decoder_model_merged: 'q4',
        },
        device: 'webgpu',
        progress_callback: progressCallback,
      })

      if (run.cancelled || loadRunRef.current !== run) {
        await model.dispose?.()
        setModelStatus(modelRef.current ? 'ready' : 'idle')
        setNotice({ kind: 'warn', text: '模型加载结果已丢弃。' })
        return
      }

      await modelRef.current?.dispose?.()
      processorRef.current = processor
      modelRef.current = model
      setModelStatus('ready')
      setProgress({ value: 100, text: '模型已加载' })
      setNotice({ kind: 'success', text: `${MODEL_OPTIONS[modelId].label} 已加载，可以开始对话。` })
    } catch (error) {
      console.error(error)
      const diagnostics = getBrowserDiagnostics()
      setModelStatus(modelRef.current ? 'ready' : 'idle')
      setNotice({
        kind: 'error',
        text: `模型加载失败：${error.message}${diagnostics.length ? ` ${diagnostics.join(' ')}` : ''}`,
      })
    }
  }

  function cancelModelLoad() {
    if (modelStatus !== 'loading') return
    loadRunRef.current.cancelled = true
    setModelStatus(modelRef.current ? 'ready' : 'idle')
    setProgress({ value: 0, text: '已请求取消加载' })
    setNotice({ kind: 'warn', text: '已请求取消加载。底层下载可能需要等当前文件请求结束后才释放。' })
  }

  async function unloadModel() {
    stopCriteriaRef.current?.interrupt?.()
    await modelRef.current?.dispose?.()
    modelRef.current = null
    processorRef.current = null
    setModelStatus('idle')
    setGenerationStatus('idle')
    setProgress({ value: 0, text: '' })
    setNotice({ kind: 'info', text: '模型已从当前页面卸载；浏览器缓存的权重文件不会被删除。' })
  }

  async function onPickImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsPreparingImage(true)
    try {
      const image = await prepareImage(file)
      setPendingImage(image)
      setNotice({ kind: 'success', text: `图片已压缩为 ${image.width}x${image.height}，会随下一条消息发送。` })
    } catch (error) {
      setPendingImage(null)
      setNotice({ kind: 'error', text: error.message })
    } finally {
      setIsPreparingImage(false)
    }
  }

  async function buildConversationAndImages(nextMessages) {
    const conversation = []
    const rawImages = []
    let remainingImages = MAX_CONTEXT_IMAGES
    const contextMessages = nextMessages.slice(-MAX_CONTEXT_MESSAGES)

    for (const msg of contextMessages) {
      if (msg.role === 'user') {
        const content = []
        if (msg.image && remainingImages > 0) {
          content.push({ type: 'image' })
          const rawImage = await hf.RawImage.read(msg.image.dataUrl)
          rawImages.push(await rawImage.resize(448, 448))
          remainingImages -= 1
        }
        content.push({ type: 'text', text: msg.text || '' })
        conversation.push({ role: 'user', content })
      } else {
        conversation.push({ role: 'assistant', content: [{ type: 'text', text: msg.text || '' }] })
      }
    }

    return { conversation, rawImages }
  }

  async function sendMessage(event) {
    event.preventDefault()
    if (!canSend || !currentChatId) return

    const text = input.trim()
    const image = pendingImage
    const userMessage = { id: nowId(), role: 'user', text, image, createdAt: Date.now() }
    const assistantId = nowId()
    const assistantMessage = { id: assistantId, role: 'assistant', text: '', status: 'thinking', tps: 0, createdAt: Date.now() }
    const nextMessages = [...messages, userMessage, assistantMessage]

    setMessages(nextMessages)
    setInput('')
    setPendingImage(null)
    setGenerationStatus('generating')
    await persistChat(currentChatId, nextMessages)

    const stoppingCriteria = new hf.InterruptableStoppingCriteria()
    stopCriteriaRef.current = stoppingCriteria

    class DOMTextStreamer extends hf.TextStreamer {
      constructor(tokenizer, callback) {
        super(tokenizer, { skip_prompt: true, skip_special_tokens: true })
        this.callback = callback
        this.generatedText = ''
        this.tokenCount = 0
        this.startTime = null
        this.finalTps = 0
      }

      put(value) {
        if (!this.startTime) {
          this.startTime = performance.now()
        } else {
          this.tokenCount += value.size !== undefined ? value.size : value.length || 1
        }
        super.put(value)
      }

      on_finalized_text(textChunk, streamEnd) {
        this.generatedText += textChunk
        const elapsed = this.startTime ? (performance.now() - this.startTime) / 1000 : 0
        const tps = elapsed > 0 && this.tokenCount > 0 ? Number((this.tokenCount / elapsed).toFixed(2)) : 0
        this.finalTps = tps
        this.callback(this.generatedText, streamEnd, tps)
      }
    }

    try {
      const { conversation, rawImages } = await buildConversationAndImages(nextMessages)
      const promptText = processorRef.current.apply_chat_template(conversation, { add_generation_prompt: true })
      const inputs =
        rawImages.length > 0
          ? await processorRef.current(promptText, rawImages.length === 1 ? rawImages[0] : rawImages)
          : await processorRef.current(promptText)

      const streamer = new DOMTextStreamer(processorRef.current.tokenizer, (newText, _isEnd, tps) => {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantId ? { ...msg, text: newText, status: 'streaming', tps } : msg,
          ),
        )
      })

      await modelRef.current.generate({
        ...inputs,
        max_new_tokens: 512,
        streamer,
        stopping_criteria: stoppingCriteria,
      })

      const finalText = streamer.generatedText || (stoppingCriteria.interrupted ? '已停止生成。' : '')
      const finalMessages = nextMessages.map((msg) =>
        msg.id === assistantId
          ? { ...msg, text: finalText, status: stoppingCriteria.interrupted ? 'stopped' : 'done', tps: streamer.finalTps || 0 }
          : msg,
      )
      setMessages(finalMessages)
      await persistChat(currentChatId, finalMessages)
    } catch (error) {
      console.error(error)
      const failedMessages = nextMessages.map((msg) =>
        msg.id === assistantId ? { ...msg, text: `生成出错：${error.message}`, status: 'error' } : msg,
      )
      setMessages(failedMessages)
      await persistChat(currentChatId, failedMessages)
    } finally {
      stopCriteriaRef.current = null
      setGenerationStatus('idle')
    }
  }

  function stopGeneration() {
    stopCriteriaRef.current?.interrupt?.()
    setNotice({ kind: 'warn', text: '已请求停止生成，当前 token 完成后会结束。' })
  }

  function onInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div id="web-llm-app-shell">
      <aside id="sidebar" aria-label="本地对话">
        <div id="sidebar-header">
          <Link href="/" className="edge-side-back" aria-label="返回首页">
            ← 返回首页
          </Link>
          <div className="edge-side-brand">
            <p className="eyebrow">On-device AI</p>
            <h2>端侧大模型</h2>
            <p>本页实验台只在浏览器本地运行模型；对话与图片会保存到本机 IndexedDB。</p>
          </div>
          <div className="side-actions">
            <button id="new-chat-btn" type="button" onClick={createNewChat} disabled={!dbReady}>
              + 新建
            </button>
            <button type="button" className="side-secondary-btn" onClick={clearAllLocalChats} disabled={!dbReady || chats.length === 0}>
              清空
            </button>
          </div>
        </div>

        <p className="chat-list-label">本地对话记录</p>
        <div id="chat-list">
          {chats.map((chat) => (
            <div key={chat.id} className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}>
              <button type="button" className="chat-title-btn" onClick={() => selectChat(chat)} aria-current={chat.id === currentChatId}>
                <span className="chat-title">{chat.title || '新对话'}</span>
                <span className="chat-count">{chat.messages?.length || 0} 条</span>
              </button>
              <button type="button" className="delete-btn" onClick={() => deleteChat(chat.id)} aria-label={`删除 ${chat.title || '新对话'}`}>
                删除
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main id="main">
        <header id="header">
          <div className="edge-hero-copy">
            <p className="eyebrow">On-device AI · Live Lab</p>
            <h1>浏览器端侧大模型实验台</h1>
            <p className="edge-hero-lead">
              选择下载源和模型后，直接在本机浏览器通过 WebGPU 加载 Qwen3.5 ONNX 权重。无服务端 API，但首次下载较大。
            </p>
          </div>
        </header>

        <section className="edge-section edge-section-lab" aria-label="浏览器实验台">
          <header className="edge-section-head compact">
            <p className="eyebrow">Model Runtime</p>
            <h2>加载与对话</h2>
            <p className="edge-section-sub">
              隐私提示：对话和上传图片只保存在当前浏览器本地 IndexedDB；点击左侧“清空”可删除全部本地记录。
            </p>
          </header>

          <div className="edge-controls-panel">
            <div className="edge-controls-row">
              <label>
                <span>下载源</span>
                <select
                  value={sourceId}
                  onChange={(event) => {
                    setSourceId(event.target.value)
                    setNotice({ kind: 'info', text: `下载源已切换为「${MODEL_SOURCES[event.target.value].label}」。` })
                  }}
                  disabled={modelStatus === 'loading' || generationStatus === 'generating'}
                >
                  {Object.entries(MODEL_SOURCES).map(([id, source]) => (
                    <option key={id} value={id}>{source.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>模型</span>
                <select
                  value={modelId}
                  onChange={(event) => {
                    const nextModelId = event.target.value
                    setModelId(nextModelId)
                    updateModelNotice(nextModelId)
                    testSources(nextModelId, { autoSelect: true, quiet: true })
                  }}
                  disabled={modelStatus === 'loading' || generationStatus === 'generating'}
                >
                  {Object.entries(MODEL_OPTIONS).map(([id, model]) => (
                    <option key={id} value={id}>{model.label}</option>
                  ))}
                </select>
              </label>
              <div className="model-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => testSources(modelId, { autoSelect: true })}
                  disabled={!hf || isTestingSources || modelStatus === 'loading' || generationStatus === 'generating'}
                >
                  {isTestingSources ? '测试中' : '测试网络'}
                </button>
                {modelStatus === 'loading' ? (
                  <button type="button" className="secondary-action" onClick={cancelModelLoad}>取消加载</button>
                ) : (
                  <button type="button" id="load-model-btn" onClick={loadModel} disabled={!hf || generationStatus === 'generating'}>
                    {modelStatus === 'ready' ? '重新加载' : '加载模型'}
                  </button>
                )}
                <button type="button" className="secondary-action" onClick={unloadModel} disabled={modelStatus !== 'ready' || generationStatus === 'generating'}>
                  卸载
                </button>
              </div>
            </div>
            <div className="source-health-row" aria-live="polite">
              {Object.entries(MODEL_SOURCES).map(([id, source]) => {
                const health = sourceHealth[id] || { status: 'idle', latency: 0, error: '' }
                const statusLabel =
                  health.status === 'ok'
                    ? `可用 · ${health.latency}ms`
                    : health.status === 'fail'
                      ? `不可用${health.error ? ` · ${health.error}` : ''}`
                      : health.status === 'checking'
                        ? '检测中'
                        : '未检测'
                return (
                  <span key={id} className={`source-health source-health-${health.status}${sourceId === id ? ' active' : ''}`}>
                    <strong>{source.label}</strong>
                    <span>{statusLabel}</span>
                  </span>
                )
              })}
            </div>
            {modelStatus === 'loading' || progress.text ? (
              <div className="progress-row" aria-live="polite">
                <progress value={progress.value} max="100" />
                <span>{progress.text || '准备中...'}</span>
              </div>
            ) : null}
          </div>

          <section id="runtime-notice" className={`notice notice-${notice.kind}`} aria-live="polite">
            {notice.text}
          </section>

          <section id="chat-container" ref={chatScrollRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="message ai-msg empty-msg">
                <strong>准备就绪</strong>
                <span>加载模型后输入文字或上传图片。当前会话：{currentChat?.title || '新对话'}。</span>
              </div>
            ) : (
              messages.map((msg) => (
                <article key={msg.id} className={`message ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`}>
                  {msg.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image.dataUrl} alt={msg.image.name || '用户上传图片'} />
                  ) : null}
                  <span>{msg.text || (msg.status === 'thinking' ? '思考中...' : '')}</span>
                  {msg.role === 'assistant' && msg.status ? (
                    <div className="msg-stats">
                      {msg.status === 'streaming' ? '生成中' : msg.status === 'stopped' ? '已停止' : msg.status === 'error' ? '失败' : '完成'}
                      {msg.tps ? ` · 速度: ${msg.tps} tokens/s` : ''}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </section>

          <section id="input-wrapper">
            {pendingImage ? (
              <div id="preview-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img id="preview-img" src={pendingImage.dataUrl} alt="图片预览" />
                <div className="preview-meta">
                  <span>{pendingImage.name}</span>
                  <span>{pendingImage.width}x{pendingImage.height}</span>
                </div>
                <button id="remove-img-btn" type="button" onClick={() => setPendingImage(null)} aria-label="移除图片">
                  x
                </button>
              </div>
            ) : null}
            <form id="input-form" onSubmit={sendMessage}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickImage} hidden />
              <button
                type="button"
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={generationStatus === 'generating' || isPreparingImage}
                aria-label="上传图片"
                title="上传图片"
              >
                图
              </button>
              <textarea
                id="text-input"
                placeholder={modelStatus === 'ready' ? '输入消息，Enter 发送，Shift + Enter 换行' : '请先加载模型'}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                disabled={generationStatus === 'generating'}
                maxLength={4000}
              />
              {generationStatus === 'generating' ? (
                <button type="button" id="send-btn" onClick={stopGeneration}>
                  停止
                </button>
              ) : (
                <button type="submit" id="send-btn" disabled={!canSend}>
                  发送
                </button>
              )}
            </form>
          </section>
        </section>

        <section className="edge-stat-strip" aria-label="关键数据">
          <div><strong>0.8-4B</strong><span>浏览器建议档位</span></div>
          <div><strong>Q4</strong><span>端侧量化主流</span></div>
          <div><strong>WebGPU</strong><span>当前实验链路</span></div>
          <div><strong>本地</strong><span>对话存储位置</span></div>
        </section>

        <section className="edge-section" aria-label="运行形态">
          <header className="edge-section-head">
            <p className="eyebrow">Runtimes</p>
            <h2>运行形态</h2>
            <p className="edge-section-sub">端侧推理主要分为浏览器、本机服务、移动端系统 SDK 与边缘设备四条路径。</p>
          </header>
          <div className="edge-runtime-grid">
            <article><span className="edge-runtime-tag">浏览器</span><h3>WebGPU · transformers.js</h3><p>零后端、零 API 账单，代价是首次下载大、兼容性依赖浏览器。</p></article>
            <article><span className="edge-runtime-tag">本机</span><h3>Ollama · llama.cpp</h3><p>开发者最成熟路径，适合 IDE、本地知识库和桌面 Agent。</p></article>
            <article><span className="edge-runtime-tag">移动端</span><h3>Core ML · MLC · MNN</h3><p>重在 NPU、功耗和系统级权限，模型通常在 1B-4B。</p></article>
            <article><span className="edge-runtime-tag">边缘</span><h3>NAS · Jetson · OpenVINO</h3><p>面向常驻、低功耗和私域数据闭环。</p></article>
          </div>
        </section>

        <section className="edge-section" aria-label="端侧模型矩阵">
          <header className="edge-section-head">
            <p className="eyebrow">Model Matrix</p>
            <h2>端侧模型矩阵</h2>
            <p className="edge-section-sub">下面是适合端侧观察的主流小模型线，体积会随框架、量化和上下文长度浮动。</p>
          </header>
          <div className="edge-table-wrap">
            <table className="edge-table">
              <thead><tr><th>模型系列</th><th>端侧档位</th><th>典型落点</th><th>备注</th></tr></thead>
              <tbody>
                <tr><td><strong>Qwen3.5</strong></td><td>0.8B / 2B / 4B</td><td>浏览器 / 笔记本</td><td>本站实验台链路</td></tr>
                <tr><td><strong>Llama 3.2</strong></td><td>1B / 3B</td><td>手机 / 集显笔记本</td><td>移动端优先</td></tr>
                <tr><td><strong>Phi mini</strong></td><td>3B-4B</td><td>Copilot+ PC / 本机</td><td>高密度训练路线</td></tr>
                <tr><td><strong>Gemma</strong></td><td>1B / 4B</td><td>移动端 / 本机</td><td>Google 生态</td></tr>
                <tr><td><strong>DeepSeek Distill</strong></td><td>1.5B / 7B / 8B</td><td>本机推理</td><td>推理任务常用</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="edge-section edge-section-reading" aria-label="延伸阅读">
          <header className="edge-section-head"><p className="eyebrow">References</p><h2>延伸阅读</h2></header>
          <ul className="edge-reading-list">
            <li><span className="edge-reading-tag">站内</span><Link href="/articles/research/topics/qwen3-5-edge-deployment">Qwen3.5 系列模型端侧部署调研</Link></li>
            <li><span className="edge-reading-tag">官方</span><a href="https://huggingface.co/docs/transformers.js/index" target="_blank" rel="noreferrer">transformers.js 官方文档</a></li>
            <li><span className="edge-reading-tag">生态</span><a href="https://github.com/mlc-ai/web-llm" target="_blank" rel="noreferrer">MLC WebLLM</a></li>
            <li><span className="edge-reading-tag">生态</span><a href="https://github.com/ggerganov/llama.cpp" target="_blank" rel="noreferrer">llama.cpp</a></li>
          </ul>
        </section>
      </main>
    </div>
  )
}
