export const DEFAULT_MODEL_ID = 'onnx-community/Qwen3.5-0.8B-ONNX'

export const MODEL_OPTIONS = [
  {
    id: 'onnx-community/Qwen3.5-0.8B-ONNX',
    label: 'Qwen3.5 0.8B',
    description: '默认模型，启动和下载成本最低。',
  },
  {
    id: 'onnx-community/Qwen3.5-2B-ONNX',
    label: 'Qwen3.5 2B',
    description: '效果更稳，但首次加载更久。',
  },
  {
    id: 'onnx-community/Qwen3.5-4B-ONNX',
    label: 'Qwen3.5 4B',
    description: '参数更大，对显存和时间要求更高。',
  },
]

export const MAX_NEW_TOKENS = 384
export const MAX_IMAGE_EDGE = 1280
export const MAX_HISTORY_TURNS = 4
export const SESSION_DB_NAME = 'tuaran-web-llm'
export const SESSION_STORE_NAME = 'sessions'
