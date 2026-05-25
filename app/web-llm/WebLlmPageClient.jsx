'use client'

/*
 * 运行逻辑对齐 blogger-alliance/src/pages/workspace/web-llm/index.vue
 * 样式保留本站 webllm.css
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'

const MODEL_OPTIONS = {
  'onnx-community/Qwen3.5-0.8B-ONNX': {
    label: 'Qwen3.5-0.8B-ONNX',
    notes: '推荐首测模型，体积最小，加载成功率最高。',
  },
  'onnx-community/Qwen3.5-2B-ONNX': {
    label: 'Qwen3.5-2B-ONNX',
    notes: '质量更稳，但对显存和下载体积要求更高。',
  },
  'onnx-community/Qwen3.5-4B-ONNX': {
    label: 'Qwen3.5-4B-ONNX',
    notes: '仅建议在高显存设备上尝试。',
  },
}

// 模型下载源：官方 Hub 与国内镜像（URL 1:1 兼容，末尾保留 / 供 transformers.js 拼接）
const MODEL_SOURCES = {
  official: { label: '官方源 huggingface.co', host: 'https://huggingface.co/' },
  mirror: { label: '国内镜像 hf-mirror.com', host: 'https://hf-mirror.com/' },
}

// 用 no-cors 探针测试某个下载源能否直连：连得上 → true，连不上 / 超时 → false
function probeHost(host, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    fetch(`${host}favicon.ico`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal })
      .then(() => resolve(true))
      .catch(() => resolve(false))
      .finally(() => clearTimeout(timer))
  })
}

export default function WebLlmPageClient() {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let disposed = false
    const cleanupFns = []

    ;(async () => {
      const {
        AutoProcessor,
        Qwen3_5ForConditionalGeneration,
        RawImage,
        TextStreamer,
        env,
      } = await import(/* webpackChunkName: "transformers-web" */ './transformers-browser.js')

      if (disposed) return

      class DOMTextStreamer extends TextStreamer {
        constructor(tokenizer, callback) {
          super(tokenizer, { skip_prompt: true, skip_special_tokens: true })
          this.callback = callback
          this.generatedText = ''
          this.tokenCount = 0
          this.startTime = null
          this.firstPutDone = false
          this.finalTps = 0
        }

        put(value) {
          if (!this.firstPutDone) {
            this.firstPutDone = true
            this.startTime = performance.now()
          } else {
            const count = value.size !== undefined ? value.size : value.length || 1
            this.tokenCount += count
          }
          super.put(value)
        }

        on_finalized_text(text, streamEnd) {
          this.generatedText += text

          let tps = 0
          if (this.tokenCount > 0 && this.startTime) {
            const elapsed = (performance.now() - this.startTime) / 1000
            if (elapsed > 0) {
              tps = Number((this.tokenCount / elapsed).toFixed(2))
            }
          }

          this.finalTps = tps
          this.callback(this.generatedText, streamEnd, tps)
        }
      }

      const DB_NAME = 'QwenChatDB'
      const STORE_NAME = 'chats'

      env.allowLocalModels = false

      let db
      let currentChatId = null
      let chatHistory = []
      let processor = null
      let model = null
      let isLoading = false
      let currentImageBase64 = null

      const chatListEl = document.getElementById('chat-list')
      const chatContainerEl = document.getElementById('chat-container')
      const textInput = document.getElementById('text-input')
      const sendBtn = document.getElementById('send-btn')
      const loadModelBtn = document.getElementById('load-model-btn')
      const modelSelect = document.getElementById('model-select')
      const sourceSelect = document.getElementById('source-select')
      const attachBtn = document.getElementById('attach-btn')
      const fileInput = document.getElementById('file-input')
      const previewContainer = document.getElementById('preview-container')
      const previewImg = document.getElementById('preview-img')
      const removeImgBtn = document.getElementById('remove-img-btn')
      const loadingModal = document.getElementById('loading-modal')
      const progressBar = document.getElementById('progress-bar')
      const progressText = document.getElementById('progress-text')
      const newChatBtn = document.getElementById('new-chat-btn')
      const inputForm = document.getElementById('input-form')
      const runtimeNoticeEl = document.getElementById('runtime-notice')

      function setRuntimeNotice(kind, message) {
        runtimeNoticeEl.className = kind ? `notice notice-${kind}` : ''
        runtimeNoticeEl.textContent = message || ''
      }

      function getBrowserDiagnostics() {
        const notices = []

        if (!('gpu' in navigator)) {
          notices.push('当前浏览器未暴露 WebGPU，模型无法在 GPU 上加载。建议使用新版 Chrome/Edge。')
        }

        if (!window.isSecureContext) {
          notices.push('当前页面不是安全上下文，部分浏览器特性可能受限。请通过 localhost 或 HTTPS 访问。')
        }

        if (!crossOriginIsolated) {
          notices.push('当前页面未启用 cross-origin isolation，某些 ONNX/WebAssembly 优化可能不可用。')
        }

        return notices
      }

      function initDB() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, 1)

          request.onupgradeneeded = (event) => {
            const instance = event.target.result
            if (!instance.objectStoreNames.contains(STORE_NAME)) {
              instance.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
          }

          request.onsuccess = (event) => {
            db = event.target.result
            resolve()
          }

          request.onerror = (event) => reject(event.target.error)
        })
      }

      function saveChat(chat) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          tx.objectStore(STORE_NAME).put(chat)
          tx.oncomplete = () => resolve()
          tx.onerror = (event) => reject(event.target.error)
        })
      }

      function getAllChats() {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly')
          const request = tx.objectStore(STORE_NAME).getAll()
          request.onsuccess = () => resolve(request.result || [])
          request.onerror = (event) => reject(event.target.error)
        })
      }

      function removeChat(id) {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          tx.objectStore(STORE_NAME).delete(id)
          tx.oncomplete = () => resolve()
          tx.onerror = (event) => reject(event.target.error)
        })
      }

      function scrollChatToBottom() {
        chatContainerEl.scrollTop = chatContainerEl.scrollHeight
      }

      function autoResizeTextarea() {
        textInput.style.height = 'auto'
        textInput.style.height = `${Math.min(textInput.scrollHeight, 180)}px`
      }

      function setLoadingModal(visible) {
        loadingModal.style.display = visible ? 'flex' : 'none'
        loadingModal.setAttribute('aria-hidden', String(!visible))
      }

      function toggleComposer(disabled) {
        sendBtn.disabled = disabled || !model || !processor
        textInput.disabled = disabled
        attachBtn.disabled = disabled
      }

      function resetPreview() {
        currentImageBase64 = null
        previewContainer.style.display = 'none'
        previewImg.removeAttribute('src')
      }

      function updateModelNotice() {
        const details = MODEL_OPTIONS[modelSelect.value]
        if (!details) {
          setRuntimeNotice('', '')
          return
        }

        const diagnostics = getBrowserDiagnostics()
        const baseMessage = `${details.label}: ${details.notes}`
        setRuntimeNotice(
          diagnostics.length > 0 ? 'warn' : 'info',
          diagnostics.length > 0 ? `${baseMessage} ${diagnostics.join(' ')}` : baseMessage,
        )
      }

      // 把当前选中的下载源写入 transformers.js 的 env.remoteHost
      function applySource() {
        const source = MODEL_SOURCES[sourceSelect.value] || MODEL_SOURCES.mirror
        env.remoteHost = source.host
        return source
      }

      // 启动时自动探测：官方源能直连就用官方，否则回退镜像
      async function detectBestSource() {
        sourceSelect.disabled = true
        setRuntimeNotice('info', '正在检测可用的模型下载源...')

        const [officialOK, mirrorOK] = await Promise.all([
          probeHost(MODEL_SOURCES.official.host),
          probeHost(MODEL_SOURCES.mirror.host),
        ])
        if (disposed) return

        const chosen = officialOK ? 'official' : 'mirror'
        sourceSelect.value = chosen
        applySource()
        sourceSelect.disabled = false

        if (!officialOK && !mirrorOK) {
          setRuntimeNotice(
            'warn',
            '官方源与镜像均无法直连，请检查网络 / 代理后重试。已默认选择镜像，仍可手动切换。',
          )
        } else {
          setRuntimeNotice(
            'success',
            `已自动选择「${MODEL_SOURCES[chosen].label}」作为模型下载源，可在右上角手动切换。`,
          )
        }
      }

      function buildChatTitle(messages) {
        if (messages.length === 0) {
          return '新对话'
        }

        const firstText = messages[0].text?.trim()
        if (firstText) {
          return firstText.slice(0, 15)
        }

        return '图片对话'
      }

      async function updateDB() {
        await saveChat({
          id: currentChatId,
          title: buildChatTitle(chatHistory),
          messages: chatHistory,
        })
        await loadSidebar()
      }

      async function loadSidebar() {
        const chats = await getAllChats()
        chats.sort((a, b) => b.id - a.id)
        chatListEl.innerHTML = ''

        chats.forEach((chat) => {
          const item = document.createElement('div')
          item.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`
          item.onclick = () => selectChat(chat)

          const title = document.createElement('div')
          title.className = 'chat-title'
          title.innerText = chat.title || '新对话'

          const delBtn = document.createElement('button')
          delBtn.className = 'delete-btn'
          delBtn.type = 'button'
          delBtn.innerText = '删除'
          delBtn.onclick = async (event) => {
            event.stopPropagation()
            await removeChat(chat.id)

            if (currentChatId === chat.id) {
              createNewChat()
            } else {
              await loadSidebar()
            }
          }

          item.appendChild(title)
          item.appendChild(delBtn)
          chatListEl.appendChild(item)
        })
      }

      function appendEmptyState() {
        if (chatHistory.length > 0 || chatContainerEl.children.length > 0) {
          return
        }

        const hint = document.createElement('div')
        hint.className = 'message ai-msg'
        hint.innerHTML = '<strong>准备就绪</strong><br />先加载模型，然后输入文字或上传图片开始对话。'
        chatContainerEl.appendChild(hint)
      }

      function clearChatView() {
        chatContainerEl.innerHTML = ''
        appendEmptyState()
      }

      function createNewChat() {
        currentChatId = Date.now()
        chatHistory = []
        clearChatView()
        loadSidebar()
      }

      function appendMessageUI(role, text, imageBase64 = null, msgId = null) {
        const isAssistant = role === 'assistant'
        const msgDiv = document.createElement('div')
        msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`

        if (msgId) {
          msgDiv.id = msgId
        }

        if (imageBase64) {
          const img = document.createElement('img')
          img.src = imageBase64
          img.alt = '用户上传图片'
          msgDiv.appendChild(img)
        }

        const textSpan = document.createElement('span')
        textSpan.innerText = text
        msgDiv.appendChild(textSpan)

        let statsDiv = null
        if (isAssistant) {
          statsDiv = document.createElement('div')
          statsDiv.className = 'msg-stats'
          msgDiv.appendChild(statsDiv)
        }

        if (chatContainerEl.children.length === 1 && chatHistory.length === 0) {
          const firstChild = chatContainerEl.firstElementChild
          if (firstChild && firstChild.innerText.includes('准备就绪')) {
            chatContainerEl.innerHTML = ''
          }
        }

        chatContainerEl.appendChild(msgDiv)
        scrollChatToBottom()

        return { textSpan, statsDiv }
      }

      async function selectChat(chat) {
        currentChatId = chat.id
        chatHistory = chat.messages || []
        chatContainerEl.innerHTML = ''

        chatHistory.forEach((msg) => {
          const { statsDiv } = appendMessageUI(msg.role, msg.text, msg.image)
          if (msg.tps && statsDiv) {
            statsDiv.innerText = `速度: ${msg.tps} tokens/s`
          }
        })

        appendEmptyState()
        await loadSidebar()
      }

      async function loadModel() {
        if (isLoading) {
          return
        }

        const modelId = modelSelect.value
        const source = applySource()
        isLoading = true
        loadModelBtn.disabled = true
        modelSelect.disabled = true
        sourceSelect.disabled = true
        progressBar.value = 0
        progressText.innerText = '正在初始化...'
        setLoadingModal(true)

        const progressMap = {}

        try {
          setRuntimeNotice(
            'info',
            `正在从「${source.label}」加载 ${MODEL_OPTIONS[modelId]?.label || modelId}。首次下载较慢，完成后会缓存在浏览器，下次秒开。`,
          )

          const progressCallback = (info) => {
            if (info.status === 'progress') {
              progressMap[info.file] = {
                loaded: info.loaded,
                total: info.total,
              }

              let totalLoaded = 0
              let totalSize = 0
              Object.values(progressMap).forEach((entry) => {
                totalLoaded += entry.loaded
                totalSize += entry.total
              })

              const percent = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0
              progressBar.value = percent
              progressText.innerText = `下载中... ${Math.round(percent)}%`
            } else if (info.status === 'ready') {
              progressText.innerText = '加载至 WebGPU... 这可能会需要一段时间'
            }
          }

          processor = await AutoProcessor.from_pretrained(modelId, {
            progress_callback: progressCallback,
          })

          model = await Qwen3_5ForConditionalGeneration.from_pretrained(modelId, {
            dtype: {
              embed_tokens: 'q4',
              vision_encoder: 'fp16',
              decoder_model_merged: 'q4',
            },
            device: 'webgpu',
            progress_callback: progressCallback,
          })

          loadModelBtn.innerText = '模型已加载'
          setRuntimeNotice('success', `${MODEL_OPTIONS[modelId]?.label || modelId} 已加载，可以开始对话。`)
          toggleComposer(false)
        } catch (error) {
          console.error(error)
          const diagnostics = getBrowserDiagnostics()
          const diagnosticText = diagnostics.length > 0 ? `\n\n环境诊断：${diagnostics.join(' ')}` : ''

          alert(
            '模型加载失败。请确认浏览器支持 WebGPU，并查看控制台错误信息。\n' +
              error.message +
              diagnosticText,
          )
          setRuntimeNotice(
            'error',
            `模型加载失败：${error.message}。可在右上角切换下载源后重试。${diagnostics.length > 0 ? ` ${diagnostics.join(' ')}` : ''}`,
          )
          loadModelBtn.disabled = false
          modelSelect.disabled = false
          sourceSelect.disabled = false
        } finally {
          isLoading = false
          setLoadingModal(false)
        }
      }

      async function buildConversationAndImages() {
        const conversation = []
        const rawImages = []

        for (const msg of chatHistory) {
          if (msg.role === 'user') {
            const content = []
            if (msg.image) {
              content.push({ type: 'image' })
              const rawImage = await RawImage.read(msg.image)
              const resized = await rawImage.resize(448, 448)
              rawImages.push(resized)
            }
            content.push({ type: 'text', text: msg.text || '' })
            conversation.push({ role: 'user', content })
            continue
          }

          conversation.push({
            role: 'assistant',
            content: [{ type: 'text', text: msg.text }],
          })
        }

        return { conversation, rawImages }
      }

      async function handleSubmit(event) {
        event.preventDefault()

        const text = textInput.value.trim()
        if (!text && !currentImageBase64) {
          return
        }

        if (!model || !processor) {
          alert('请先加载模型。')
          return
        }

        const userText = text
        const userImg = currentImageBase64

        textInput.value = ''
        autoResizeTextarea()
        resetPreview()

        appendMessageUI('user', userText, userImg)
        chatHistory.push({ role: 'user', text: userText, image: userImg })
        await updateDB()

        toggleComposer(true)

        const aiMsgId = `ai-msg-${Date.now()}`
        const { textSpan: aiTextSpan, statsDiv: aiStatsDiv } = appendMessageUI(
          'assistant',
          '思考中...',
          null,
          aiMsgId,
        )

        try {
          const { conversation, rawImages } = await buildConversationAndImages()
          const promptText = processor.apply_chat_template(conversation, {
            add_generation_prompt: true,
          })

          const inputs =
            rawImages.length > 0
              ? await processor(promptText, rawImages.length === 1 ? rawImages[0] : rawImages)
              : await processor(promptText)

          aiTextSpan.innerText = ''

          const streamer = new DOMTextStreamer(processor.tokenizer, (newText, _isEnd, tps) => {
            aiTextSpan.innerText = newText
            if (tps > 0 && aiStatsDiv) {
              aiStatsDiv.innerText = `速度: ${tps} tokens/s`
            }
            scrollChatToBottom()
          })

          await model.generate({
            ...inputs,
            max_new_tokens: 512,
            streamer,
          })

          chatHistory.push({
            role: 'assistant',
            text: aiTextSpan.innerText,
            tps: streamer.finalTps,
          })
          await updateDB()
        } catch (error) {
          console.error('生成报错:', error)
          aiTextSpan.innerText = `生成出错: ${error.message}`
        } finally {
          toggleComposer(false)
          textInput.focus()
        }
      }

      function bindEvents() {
        const onNewChat = () => createNewChat()
        const onLoadModel = () => loadModel()
        const onModelChange = () => updateModelNotice()
        const onSourceChange = () => {
          const source = applySource()
          setRuntimeNotice('info', `下载源已切换为「${source.label}」。`)
        }
        const onAttach = () => fileInput.click()
        const onFileChange = (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          const reader = new FileReader()
          reader.onload = (loadEvent) => {
            currentImageBase64 = loadEvent.target.result
            previewImg.src = currentImageBase64
            previewContainer.style.display = 'block'
          }
          reader.readAsDataURL(file)
          fileInput.value = ''
        }
        const onRemoveImg = () => resetPreview()
        const onTextInput = () => autoResizeTextarea()
        const onTextKeydown = (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            inputForm.requestSubmit()
          }
        }

        newChatBtn.addEventListener('click', onNewChat)
        loadModelBtn.addEventListener('click', onLoadModel)
        inputForm.addEventListener('submit', handleSubmit)
        modelSelect.addEventListener('change', onModelChange)
        sourceSelect.addEventListener('change', onSourceChange)
        attachBtn.addEventListener('click', onAttach)
        fileInput.addEventListener('change', onFileChange)
        removeImgBtn.addEventListener('click', onRemoveImg)
        textInput.addEventListener('input', onTextInput)
        textInput.addEventListener('keydown', onTextKeydown)

        cleanupFns.push(() => {
          newChatBtn.removeEventListener('click', onNewChat)
          loadModelBtn.removeEventListener('click', onLoadModel)
          inputForm.removeEventListener('submit', handleSubmit)
          modelSelect.removeEventListener('change', onModelChange)
          sourceSelect.removeEventListener('change', onSourceChange)
          attachBtn.removeEventListener('click', onAttach)
          fileInput.removeEventListener('change', onFileChange)
          removeImgBtn.removeEventListener('click', onRemoveImg)
          textInput.removeEventListener('input', onTextInput)
          textInput.removeEventListener('keydown', onTextKeydown)
        })
      }

      async function init() {
        await initDB()
        if (disposed) return
        bindEvents()
        autoResizeTextarea()
        updateModelNotice()
        await loadSidebar()
        if (disposed) return
        createNewChat()
        // 异步探测下载源，不阻塞页面交互
        detectBestSource()
      }

      await init()
    })().catch((error) => {
      console.error('初始化失败:', error)
      if (typeof window !== 'undefined') {
        alert(`应用初始化失败: ${error.message}`)
      }
    })

    return () => {
      disposed = true
      cleanupFns.forEach((fn) => {
        try {
          fn()
        } catch (error) {
          console.error('cleanup failed:', error)
        }
      })
      cleanupFns.length = 0
    }
  }, [])

  return (
    <div id="web-llm-app-shell">
      <aside id="sidebar">
        <div id="sidebar-header">
          <Link href="/" className="edge-side-back" aria-label="返回首页">
            ← 返回首页
          </Link>
          <div className="edge-side-brand">
            <p className="eyebrow">On-device AI</p>
            <h2>端侧大模型</h2>
            <p>
              把模型部署到真实设备、本机运行时和边缘节点上。
            </p>
          </div>
          <button id="new-chat-btn" type="button">
            + 新建对话
          </button>
        </div>
        <section className="edge-side-note" aria-label="专题路线">
          <p className="edge-side-kicker">长期专题</p>
          <ul>
            <li>浏览器 WebGPU 与本机推理运行时</li>
            <li>Ollama、llama.cpp、MLC、ONNX Runtime</li>
            <li>模型量化、缓存、离线包和私有数据</li>
            <li>手机、PC、NAS、边缘设备上的智能体</li>
            <li>端云协同与分布式智能网络</li>
          </ul>
        </section>
        <p className="chat-list-label">本地对话记录</p>
        <div id="chat-list" />
      </aside>

      <main id="main">
        <header id="header">
          <div className="edge-hero-copy">
            <p className="eyebrow">On-device AI · 端侧大模型</p>
            <h1>端侧大模型合集</h1>
            <p className="edge-hero-lead">
              把大模型搬下云端、跑在用户自己硬件上的现状、架构与评测。这里持续沉淀调研，并在底部留一台可直接跑的浏览器实验台。
            </p>
          </div>
        </header>

        <section className="edge-stat-strip" aria-label="关键数据">
          <div>
            <strong>0.8 – 4B</strong>
            <span>端侧甜区档位</span>
          </div>
          <div>
            <strong>&lt; 2 GB</strong>
            <span>Q4 量化后权重</span>
          </div>
          <div>
            <strong>262K</strong>
            <span>Qwen3.5 原生上下文</span>
          </div>
          <div>
            <strong>≈ $0</strong>
            <span>站长侧持续成本</span>
          </div>
        </section>

        <section className="edge-section" aria-label="运行形态">
          <header className="edge-section-head">
            <p className="eyebrow">Section 01 · Runtimes</p>
            <h2>运行形态</h2>
            <p className="edge-section-sub">
              端侧推理目前有四条主路径，分别对应不同的硬件天花板与开发者习惯。挑哪一条，决定了你的功能能服务多少用户。
            </p>
          </header>
          <div className="edge-runtime-grid">
            <article>
              <header>
                <span className="edge-runtime-tag">浏览器</span>
                <h3>WebGPU · transformers.js</h3>
              </header>
              <p>模型权重在标签页里下载，推理直接走用户 GPU。零部署、零后端、零账单，代价是首包大、移动端 WebGPU 覆盖差。</p>
              <dl>
                <div><dt>代表实现</dt><dd>transformers.js · WebLLM (MLC) · ONNX Runtime Web</dd></div>
                <div><dt>能力上限</dt><dd>Qwen3.5-4B / Phi-3.5-mini 一档；9B 是实验性上限</dd></div>
                <div><dt>站长成本</dt><dd>≈ $0，天然防刷</dd></div>
              </dl>
            </article>
            <article>
              <header>
                <span className="edge-runtime-tag">本机</span>
                <h3>Ollama · llama.cpp · LM Studio</h3>
              </header>
              <p>命令行 / 桌面 GUI 起一个本地推理服务，OpenAI 兼容 API。开发者侧最成熟的路径，单机能跑到 27B-70B 级。</p>
              <dl>
                <div><dt>代表实现</dt><dd>Ollama · llama.cpp · LM Studio · GPT4All · vLLM</dd></div>
                <div><dt>能力上限</dt><dd>消费独显 9B-27B；24GB+ 工作站到 70B 蒸馏</dd></div>
                <div><dt>典型用法</dt><dd>个人 IDE 集成、桌面 Agent、本地知识库</dd></div>
              </dl>
            </article>
            <article>
              <header>
                <span className="edge-runtime-tag">移动端</span>
                <h3>系统 SDK · MLC LLM · MNN</h3>
              </header>
              <p>厂商在系统层内置模型并暴露 SDK；第三方走 MLC / MNN / ExecuTorch 自带权重。共同特点：跑 NPU、严控耗电。</p>
              <dl>
                <div><dt>系统内置</dt><dd>Apple Foundation Models · Gemini Nano (AICore) · Phi Silica (Copilot+)</dd></div>
                <div><dt>第三方</dt><dd>MLC LLM · 阿里 MNN · ExecuTorch · Core ML · MediaPipe LLM</dd></div>
                <div><dt>能力上限</dt><dd>1B-4B，多模态视觉常驻</dd></div>
              </dl>
            </article>
            <article>
              <header>
                <span className="edge-runtime-tag">边缘 / NPU</span>
                <h3>NAS · Jetson · 加速器</h3>
              </header>
              <p>把模型嵌进 NAS / 网关 / 嵌入式盒子，做家庭与企业内网的私域大脑。重在常驻、低功耗、私有数据闭环。</p>
              <dl>
                <div><dt>代表方案</dt><dd>NVIDIA Jetson · Intel OpenVINO · Qualcomm AI Hub · Hailo</dd></div>
                <div><dt>典型场景</dt><dd>家庭 NAS 推理网关、车载、工业网关、智能摄像头</dd></div>
                <div><dt>能力上限</dt><dd>1B-9B，看 NPU 内存与电源预算</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <section className="edge-section" aria-label="端侧模型矩阵">
          <header className="edge-section-head">
            <p className="eyebrow">Section 02 · Model Matrix</p>
            <h2>端侧模型矩阵</h2>
            <p className="edge-section-sub">
              2026 年仍在被一线项目使用、且确实能端侧运行的主流模型。Q4 权重为公开资料的近似值，随推理框架与上下文长度浮动。
            </p>
          </header>
          <div className="edge-table-wrap">
            <table className="edge-table">
              <thead>
                <tr>
                  <th>模型系列</th>
                  <th>可端侧档</th>
                  <th>架构亮点</th>
                  <th>Q4 权重</th>
                  <th>典型落点</th>
                  <th>许可</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Qwen3.5</strong><span>阿里通义</span></td>
                  <td>0.8B / 2B / 4B<br /><em>9B 勉强</em></td>
                  <td>Gated DeltaNet 混合注意力 · 多模态</td>
                  <td>~1.5 / 1.8 / 2.5 GB</td>
                  <td>浏览器 / 手机 / 笔记本</td>
                  <td>Apache 2.0</td>
                </tr>
                <tr>
                  <td><strong>Llama 3.2</strong><span>Meta</span></td>
                  <td>1B / 3B</td>
                  <td>Dense · 移动端优先</td>
                  <td>~0.8 / 2.0 GB</td>
                  <td>手机 / 集显笔记本</td>
                  <td>Llama 3.2 社区</td>
                </tr>
                <tr>
                  <td><strong>Phi-4-mini</strong><span>Microsoft</span></td>
                  <td>3.8B</td>
                  <td>Dense · 高密度训练</td>
                  <td>~2.4 GB</td>
                  <td>笔记本 / Copilot+ NPU</td>
                  <td>MIT</td>
                </tr>
                <tr>
                  <td><strong>Gemma 3</strong><span>Google</span></td>
                  <td>1B / 4B</td>
                  <td>Dense · 原生多模态</td>
                  <td>~0.9 / 2.6 GB</td>
                  <td>手机 / 笔记本</td>
                  <td>Gemma Terms</td>
                </tr>
                <tr>
                  <td><strong>SmolLM3</strong><span>HuggingFace</span></td>
                  <td>3B</td>
                  <td>Dense · 长上下文优化</td>
                  <td>~1.9 GB</td>
                  <td>浏览器 / 边缘</td>
                  <td>Apache 2.0</td>
                </tr>
                <tr>
                  <td><strong>DeepSeek-R1-Distill</strong><span>DeepSeek</span></td>
                  <td>1.5B / 7B / 8B</td>
                  <td>Dense · 推理能力蒸馏</td>
                  <td>~1.0 / 4.5 / 5.0 GB</td>
                  <td>笔记本（推理任务首选）</td>
                  <td>MIT</td>
                </tr>
                <tr>
                  <td><strong>Apple Foundation</strong><span>Apple</span></td>
                  <td>≈ 3B 设备内</td>
                  <td>Dense · 系统级接入</td>
                  <td>系统不暴露</td>
                  <td>iPhone 15 Pro+ / M 系列 Mac</td>
                  <td>仅 Apple 平台</td>
                </tr>
                <tr>
                  <td><strong>Gemini Nano</strong><span>Google</span></td>
                  <td>≈ 3.25B</td>
                  <td>Dense · AICore 系统服务</td>
                  <td>系统不暴露</td>
                  <td>Pixel / 部分 Android</td>
                  <td>仅 Android</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="edge-section-footnote">
            旗舰模型不在矩阵内：Qwen3.5-397B-A17B、Llama 3.1-405B、DeepSeek-V3 这类参数级别只能落到数据中心。“满血”与“端侧”在物理上互斥。
          </p>
        </section>

        <section className="edge-section" aria-label="架构要点">
          <header className="edge-section-head">
            <p className="eyebrow">Section 03 · Architecture</p>
            <h2>架构要点</h2>
            <p className="edge-section-sub">
              小模型能塞进浏览器，靠的不只是参数量小，更靠下面几项工程取舍。
            </p>
          </header>
          <div className="edge-arch-grid">
            <article>
              <h3>量化 · Q4 是端侧的事实标准</h3>
              <p>
                FP16 全精度部署在端侧几乎不存在。Q4（INT4）把权重体积压到 1/4，质量损失通常 1-3 个百分点；Q5 / Q6 用于桌面更高显存的折中；Q8 留给对精度敏感的视觉编码器。
              </p>
            </article>
            <article>
              <h3>KV 缓存 · 长上下文真正的代价</h3>
              <p>
                262K 满上下文下，KV 缓存可吃 4-8 GB；端侧实际工作在 4-32K 区间，额外开销 0.5-2 GB。容量规划稳妥的做法：按“Q4 权重 + 1-2 GB”估总占用。
              </p>
            </article>
            <article>
              <h3>线性注意力 · 长上下文端侧化的前提</h3>
              <p>
                Gated DeltaNet、Mamba、RWKV 等架构把“注意力随序列长度二次增长”压回近似线性。这是 0.8B 这种小模型也能扛 100K+ 上下文、且能跑进浏览器的关键。
              </p>
            </article>
            <article>
              <h3>MoE · 端侧的“假繁荣”</h3>
              <p>
                MoE 单次推理只激活一小部分专家，但权重要全量加载。35B-A3B / 122B-A10B 这类对桌面工作站友好，对浏览器和手机不友好——加载体积仍是 35B / 122B。
              </p>
            </article>
            <article>
              <h3>多模态 · 视觉头单独留精度</h3>
              <p>
                VLM 在端侧典型拆法：vision encoder 走 fp16、decoder 走 q4，分别给图像与语言路径留预算。本站实验台对 Qwen3.5 ONNX 的 dtype 配置即如此。
              </p>
            </article>
            <article>
              <h3>NPU · 跟着 Copilot+ / Apple Silicon 起飞</h3>
              <p>
                2024 年起 PC 与手机的 NPU 算力进入“够跑 3B-7B”的水平。系统级模型（Phi Silica / Apple Foundation / Gemini Nano）通过 NPU 把性能与续航打平，这是第三方端侧模型仍难做到的。
              </p>
            </article>
          </div>
        </section>

        <section className="edge-section" aria-label="如何评测">
          <header className="edge-section-head">
            <p className="eyebrow">Section 04 · Benchmarks</p>
            <h2>怎么评测</h2>
            <p className="edge-section-sub">
              端侧评测不是把云端 benchmark 复用一遍——还要叠“硬件代价”的维度。
            </p>
          </header>
          <div className="edge-bench-grid">
            <article>
              <h3>性能轴</h3>
              <ul>
                <li><strong>TTFT</strong>（首 token 时延）— 端侧最关心，下载 / shader 编译 / prefill 都会拖慢</li>
                <li><strong>Decode tokens/s</strong> — 出词吞吐，直接决定可用感</li>
                <li><strong>Peak Memory</strong> — 显存 / 统一内存峰值，决定能不能跑</li>
                <li><strong>电池 / 温度</strong> — 移动端额外维度，长时间稳定性</li>
              </ul>
            </article>
            <article>
              <h3>质量轴</h3>
              <ul>
                <li><strong>MMLU / GSM8K / HumanEval</strong> — 通识 / 数学 / 代码三件套</li>
                <li><strong>量化降级</strong> — Q4 vs FP16 的差分，端侧最易被忽略</li>
                <li><strong>Intelligence Index</strong> — Artificial Analysis 的综合分</li>
                <li><strong>多轮稳定性</strong> — 长对话下的格式 / 角色保持</li>
              </ul>
            </article>
            <article>
              <h3>常用榜单</h3>
              <ul>
                <li>
                  <a href="https://artificialanalysis.ai/" target="_blank" rel="noreferrer"><strong>Artificial Analysis</strong></a>
                  {' '}— 端侧小模型横评最常用
                </li>
                <li>
                  <a href="https://mlcommons.org/benchmarks/inference-mobile/" target="_blank" rel="noreferrer"><strong>MLPerf Mobile</strong></a>
                  {' '}— 标准化设备侧负载
                </li>
                <li>
                  <a href="https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" target="_blank" rel="noreferrer"><strong>Open LLM Leaderboard</strong></a>
                  {' '}— HuggingFace 主榜
                </li>
                <li>
                  <a href="https://lmarena.ai/" target="_blank" rel="noreferrer"><strong>LMSYS Arena</strong></a>
                  {' '}— 人类盲测榜，含开源端侧档
                </li>
              </ul>
            </article>
            <article>
              <h3>端侧典型数据点</h3>
              <ul>
                <li>Qwen3.5-0.8B Q4 · Apple M2 集成显卡 WebGPU ≈ <strong>25-35 tokens/s</strong></li>
                <li>Llama 3.2-1B Q4 · iPhone 15 Pro Core ML ≈ <strong>20-25 tokens/s</strong></li>
                <li>Phi-4-mini Q4 · Copilot+ PC NPU ≈ <strong>15-20 tokens/s</strong></li>
                <li>Qwen3.5-4B Q4 · RTX 4060 Laptop WebGPU ≈ <strong>30-45 tokens/s</strong></li>
              </ul>
            </article>
          </div>
          <p className="edge-section-footnote">
            数字为公开评测与本站观察综合估算，仅供数量级参考；具体实测请以本机为准。
          </p>
        </section>

        <section className="edge-section edge-section-lab" aria-label="浏览器实验台">
          <header className="edge-section-head">
            <p className="eyebrow">Section 05 · Live</p>
            <h2>浏览器实验台</h2>
            <p className="edge-section-sub">
              直接在你的浏览器里加载 Qwen3.5 ONNX 权重，全程走 WebGPU，无服务器、无 API。首次会下载数百 MB 权重并缓存进 Cache Storage，下次秒开。
            </p>
          </header>

          <div className="edge-controls-panel">
            <div className="edge-controls-label">模型加载</div>
            <div className="edge-controls-row">
              <select id="source-select" aria-label="选择下载源" defaultValue="mirror">
                <option value="official">官方源 huggingface.co</option>
                <option value="mirror">国内镜像 hf-mirror.com</option>
              </select>
              <select id="model-select" aria-label="选择模型" defaultValue="onnx-community/Qwen3.5-0.8B-ONNX">
                <option value="onnx-community/Qwen3.5-0.8B-ONNX">Qwen3.5-0.8B-ONNX</option>
                <option value="onnx-community/Qwen3.5-2B-ONNX">Qwen3.5-2B-ONNX</option>
                <option value="onnx-community/Qwen3.5-4B-ONNX">Qwen3.5-4B-ONNX</option>
              </select>
              <button id="load-model-btn" type="button">
                加载模型
              </button>
            </div>
          </div>

          <section id="runtime-notice" aria-live="polite" />

          <section id="chat-container" aria-live="polite" />

          <section id="input-wrapper">
            <div id="preview-container">
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img id="preview-img" alt="图片预览" />
              <button id="remove-img-btn" type="button" aria-label="移除图片">
                ✕
              </button>
            </div>
            <form id="input-form">
              <input type="file" id="file-input" accept="image/*" style={{ display: 'none' }} />
              <button type="button" className="icon-btn" id="attach-btn" title="上传图片" aria-label="上传图片">
                📷
              </button>
              <textarea id="text-input" placeholder="输入消息 (Shift + Enter 换行)..." rows={1} />
              <button type="submit" id="send-btn" disabled>
                发送
              </button>
            </form>
          </section>
        </section>

        <section className="edge-section edge-section-reading" aria-label="延伸阅读">
          <header className="edge-section-head">
            <p className="eyebrow">References</p>
            <h2>延伸阅读</h2>
          </header>
          <ul className="edge-reading-list">
            <li>
              <span className="edge-reading-tag">站内</span>
              <Link href="/articles/2026-05-20-qwen3-5-edge-deployment">Qwen3.5 系列模型端侧部署全维度调研</Link>
              <span className="edge-reading-note">— 从 0.8B 到 397B-A17B 的端侧大表与成本拆分</span>
            </li>
            <li>
              <span className="edge-reading-tag">官方</span>
              <a href="https://huggingface.co/docs/transformers.js/index" target="_blank" rel="noreferrer">transformers.js 官方文档</a>
              <span className="edge-reading-note">— 浏览器内 Transformers 的 API 与示例</span>
            </li>
            <li>
              <span className="edge-reading-tag">官方</span>
              <a href="https://huggingface.co/spaces/webml-community/Qwen3.5-WebGPU" target="_blank" rel="noreferrer">Qwen3.5-WebGPU Space</a>
              <span className="edge-reading-note">— HF 社区的浏览器运行 demo（本站实验台同链路）</span>
            </li>
            <li>
              <span className="edge-reading-tag">评测</span>
              <a href="https://artificialanalysis.ai/articles/qwen3-5-small-models" target="_blank" rel="noreferrer">Artificial Analysis — Qwen3.5 小模型横评</a>
              <span className="edge-reading-note">— 端侧档位智能指数与价格曲线</span>
            </li>
            <li>
              <span className="edge-reading-tag">生态</span>
              <a href="https://ollama.com/library" target="_blank" rel="noreferrer">Ollama Library</a>
              <span className="edge-reading-note">— 本机命令行运行时的模型仓库</span>
            </li>
            <li>
              <span className="edge-reading-tag">生态</span>
              <a href="https://github.com/ggerganov/llama.cpp" target="_blank" rel="noreferrer">llama.cpp</a>
              <span className="edge-reading-note">— C/C++ 推理内核，几乎所有桌面端侧的底座</span>
            </li>
            <li>
              <span className="edge-reading-tag">生态</span>
              <a href="https://github.com/mlc-ai/web-llm" target="_blank" rel="noreferrer">MLC WebLLM</a>
              <span className="edge-reading-note">— transformers.js 之外的另一条浏览器内运行链路</span>
            </li>
          </ul>
        </section>

        <div id="loading-modal" aria-hidden="true">
          <div className="modal-box">
            <h2>加载模型中</h2>
            <div id="progress-text">正在初始化...</div>
            <progress id="progress-bar" value="0" max="100" />
            <p className="modal-tip">首次加载会自动下载模型文件，请耐心等待。</p>
          </div>
        </div>
      </main>
    </div>
  )
}
