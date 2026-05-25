'use client'

// next.config.js 将该 alias 固定到 transformers.web.js，避免解析到 node 构建。
export {
  AutoProcessor,
  Qwen3_5ForConditionalGeneration,
  InterruptableStoppingCriteria,
  RawImage,
  TextStreamer,
  env,
} from 'transformers-web-runtime'
