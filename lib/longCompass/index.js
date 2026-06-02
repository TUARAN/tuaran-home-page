// 长期罗盘 isomorphic 模块入口
//
// 浏览器组件：import { decryptPayload, migrate } from '../../lib/longCompass'
// Node 脚本：  import { encryptPayload } from '../lib/longCompass/index.js'

export {
  CRYPTO_PARAMS,
  encryptPayload,
  decryptPayload,
  isValidEnvelope,
} from './crypto.js'

export {
  CURRENT_PLAIN_VERSION,
  KINDS,
  KIND_LABELS,
  isValidKind,
  migrate,
  validatePlain,
} from './schema.js'

export { fetchEncryptedRecords } from './api.js'
