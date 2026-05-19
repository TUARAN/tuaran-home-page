'use client'

// Next.js 会错误解析到 transformers.node.mjs，此处固定导出浏览器构建
export {
  AutoProcessor,
  Qwen3_5ForConditionalGeneration,
  RawImage,
  TextStreamer,
  env,
} from '../../node_modules/@huggingface/transformers/dist/transformers.web.js'
