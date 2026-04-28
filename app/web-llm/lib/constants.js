export const DEFAULT_MODEL_ID = 'onnx-community/Qwen3.5-0.8B-ONNX'
export const LIGHT_TEXT_MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct'

export const MODEL_OPTIONS = [
  {
    id: LIGHT_TEXT_MODEL_ID,
    label: 'Qwen2.5 0.5B Text',
    description: '纯文本轻量模式，启动更快，不加载视觉权重。',
    supportsImage: false,
    runtimeType: 'text',
  },
  {
    id: 'onnx-community/Qwen3.5-0.8B-ONNX',
    label: 'Qwen3.5 0.8B',
    description: '默认模型，启动和下载成本最低。',
    supportsImage: true,
    runtimeType: 'vision',
  },
  {
    id: 'onnx-community/Qwen3.5-2B-ONNX',
    label: 'Qwen3.5 2B',
    description: '效果更稳，但首次加载更久。',
    supportsImage: true,
    runtimeType: 'vision',
  },
  {
    id: 'onnx-community/Qwen3.5-4B-ONNX',
    label: 'Qwen3.5 4B',
    description: '参数更大，对显存和时间要求更高。',
    supportsImage: true,
    runtimeType: 'vision',
  },
]

export const MODEL_OPTIONS_BY_ID = Object.fromEntries(MODEL_OPTIONS.map((option) => [option.id, option]))

export const MAX_NEW_TOKENS = 384
export const MAX_IMAGE_EDGE = 448
export const MAX_HISTORY_TURNS = 2
export const SESSION_DB_NAME = 'tuaran-web-llm'
export const SESSION_STORE_NAME = 'sessions'
