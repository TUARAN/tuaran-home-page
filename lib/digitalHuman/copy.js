import {
  DIGITAL_HUMAN_REPLICATE_PROVIDER,
  DIGITAL_HUMAN_SELF_HOSTED_PROVIDER,
} from './providerIds'

// 数字人口播的用户可见文案集中在这里，切换模型或计费方式时无需散改页面。
export const DIGITAL_HUMAN_PROVIDER_COPY = {
  [DIGITAL_HUMAN_SELF_HOSTED_PROVIDER]: {
    label: '自建 SadTalker',
    shortLabel: '自建',
    badge: '不收 API 费',
    description: '使用本机或自有 GPU 服务器运行，算力和带宽费用由你自己承担。',
    readyHint: '任务会发送到你配置的 SadTalker 服务，成片仍保存到本站私有存储。',
    unavailableHint: '自建服务尚未连接。部署服务并配置地址、密钥后即可使用。',
    button: '使用自建服务生成',
  },
  [DIGITAL_HUMAN_REPLICATE_PROVIDER]: {
    label: 'Replicate 云端',
    shortLabel: 'Replicate',
    badge: '按量付费',
    description: '无需维护 GPU，使用 Replicate 托管的 SadTalker，账户需要有可用余额。',
    readyHint: '适合快速使用；Replicate 会按实际运行的 GPU 时间计费。',
    unavailableHint: 'Replicate 尚未配置 API Token。',
    button: '使用 Replicate 生成',
  },
}

export const DIGITAL_HUMAN_STATUS_META = {
  preparing: { label: '正在准备素材', tone: 'amber' },
  queued: { label: '已进入生成队列', tone: 'sky' },
  processing: { label: '正在合成口播视频', tone: 'violet' },
  succeeded: { label: '生成完成', tone: 'emerald' },
  failed: { label: '生成失败', tone: 'rose' },
  canceled: { label: '已取消', tone: 'stone' },
}

export const DIGITAL_HUMAN_GENERATION_STAGES = [
  { label: '上传素材', description: '正在安全上传照片' },
  { label: '生成语音', description: '正在合成中文口播' },
  { label: '进入队列', description: '等待 GPU 开始处理' },
  { label: '合成视频', description: '生成嘴型与最终视频' },
]

export const DIGITAL_HUMAN_UI_COPY = {
  title: '数字人口播',
  intro: '上传一张正面人物照片，输入中文文案，生成带语音和嘴型的口播视频。',
  taskSubmitted: '任务已提交，可以留在本页等待生成。',
  taskCompleted: '数字人口播已经生成完成。',
  activeTask: '已有一个任务正在生成，请等待它完成。',
  ownerOnly: '数字人口播目前处于站长内测阶段。',
  unavailable: '数字人口播服务尚未配置完成。',
  providerNotConfigured: '当前生成方式尚未配置，请先完成服务连接。',
}
