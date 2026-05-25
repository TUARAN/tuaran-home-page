'use client'

/*
 * 运行逻辑对齐 blogger-alliance/src/pages/workspace/web-llm/index.vue
 * 样式保留本站 webllm.css
 */

import { useEffect, useRef } from 'react'

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
            <p className="eyebrow">Distributed Intelligence Lab</p>
            <h1>端侧大模型</h1>
            <p className="edge-hero-manifesto">
              端侧大模型是分布式的智能，是真正的未来。
            </p>
            <p className="edge-hero-detail">
              这里会持续沉淀端侧模型部署的调研、实验和工程实践，覆盖浏览器 WebGPU、本机 Ollama /
              llama.cpp、移动端、NAS、边缘设备和端云协同。当前实验台先用 WebGPU 加载 Qwen ONNX
              模型，作为端侧运行形态的一条验证路径。
            </p>
          </div>
          <div id="model-controls">
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
        </header>

        <section className="edge-lab-map" aria-label="端侧大模型规划">
          <article>
            <span>01</span>
            <h2>运行形态</h2>
            <p>浏览器 WebGPU、本机 Ollama / llama.cpp、ONNX Runtime、MLC、移动端和边缘硬件。</p>
          </article>
          <article>
            <span>02</span>
            <h2>工程部署</h2>
            <p>量化、模型缓存、离线包、设备能力探测、私有数据接入和低配机器降级策略。</p>
          </article>
          <article>
            <span>03</span>
            <h2>连接成网</h2>
            <p>端侧智能体、隐私数据本地化、端云协同、多设备协作与分布式智能。</p>
          </article>
        </section>

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
