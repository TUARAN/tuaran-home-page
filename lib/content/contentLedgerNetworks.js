const EAS = '0x4200000000000000000000000000000000000021'
const SCHEMA_REGISTRY = '0x4200000000000000000000000000000000000020'
const SCHEMA = 'bytes32 merkleRoot,uint32 itemCount,uint64 generatedAt,bytes32 manifestHash,bytes32 previousRoot,string manifestURI'

export const CONTENT_LEDGER_SCHEMA = SCHEMA

export const CONTENT_LEDGER_NETWORKS = Object.freeze({
  'base-sepolia': Object.freeze({
    chainId: 84532,
    eas: EAS,
    explorer: 'https://base-sepolia.easscan.org',
    kind: 'testnet',
    name: 'base-sepolia',
    privateKeyEnv: 'CONTENT_LEDGER_TESTNET_PRIVATE_KEY',
    rpcUrl: 'https://sepolia.base.org',
    schemaRegistry: SCHEMA_REGISTRY,
  }),
  base: Object.freeze({
    chainId: 8453,
    eas: EAS,
    explorer: 'https://base.easscan.org',
    kind: 'mainnet',
    name: 'base',
    privateKeyEnv: 'CONTENT_LEDGER_MAINNET_PRIVATE_KEY',
    rpcUrl: 'https://mainnet.base.org',
    schemaRegistry: SCHEMA_REGISTRY,
  }),
})

export function getContentLedgerNetwork(name = 'base-sepolia') {
  const network = CONTENT_LEDGER_NETWORKS[name]
  if (!network) throw new TypeError(`unsupported content ledger network: ${name}`)
  return network
}

export function contentLedgerExplorerUrl(network, attestationUid) {
  return `${network.explorer}/attestation/view/${attestationUid}`
}
