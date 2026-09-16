import { CONTENT_MERKLE_CONSTANTS } from './contentMerkle.js'
import { CONTENT_PROOF_CONSTANTS } from './contentProof.js'
import { CONTENT_REPLICA_SCHEMA } from './contentReplica.js'

const HEX_64 = { type: 'string', pattern: '^[a-f0-9]{64}$' }
const HEX_0X_64 = { type: 'string', pattern: '^0x[a-f0-9]{64}$' }

const ASSET = {
  type: 'object',
  additionalProperties: false,
  required: ['bytes', 'sha256', 'url'],
  properties: {
    bytes: { type: 'integer', minimum: 0 },
    mediaType: { type: ['string', 'null'] },
    sha256: HEX_64,
    url: { type: 'string', minLength: 1 },
  },
}

export const CONTENT_PROOF_DISCOVERY_SCHEMA = 'https://2aran.com/schemas/content-proof-discovery/v1'
export const CONTENT_PROOF_REPORT_SCHEMA = 'https://2aran.com/schemas/content-proof-report/v1'

const SCHEMAS = {
  'content-proof/v1': {
    $id: CONTENT_PROOF_CONSTANTS.SCHEMA,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '2aran content proof v1',
    type: 'object',
    additionalProperties: false,
    required: [
      'assets',
      'canonicalization',
      'contentHash',
      'contentKey',
      'previousProofId',
      'proofId',
      'publishedAt',
      'schema',
      'siteSignature',
      'version',
    ],
    properties: {
      assets: { type: 'array', items: ASSET },
      canonicalization: { const: CONTENT_PROOF_CONSTANTS.CANONICALIZATION },
      contentHash: {
        type: 'object',
        additionalProperties: false,
        required: ['algorithm', 'value'],
        properties: {
          algorithm: { const: CONTENT_PROOF_CONSTANTS.HASH_ALGORITHM },
          value: HEX_64,
        },
      },
      contentKey: { type: 'string', minLength: 1 },
      previousProofId: { anyOf: [HEX_64, { type: 'null' }] },
      proofId: HEX_64,
      publishedAt: { type: 'string', format: 'date-time' },
      schema: { const: CONTENT_PROOF_CONSTANTS.SCHEMA },
      siteSignature: {
        type: 'object',
        additionalProperties: false,
        required: ['algorithm', 'keyId', 'value'],
        properties: {
          algorithm: { const: CONTENT_PROOF_CONSTANTS.SIGNATURE_ALGORITHM },
          keyId: { type: 'string', minLength: 1 },
          value: { type: 'string', minLength: 1 },
        },
      },
      version: { type: 'integer', minimum: 1 },
    },
  },
  'content-proof-batch/v1': {
    $id: CONTENT_MERKLE_CONSTANTS.BATCH_SCHEMA,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '2aran content proof batch v1',
    type: 'object',
    additionalProperties: false,
    required: ['algorithm', 'count', 'generatedAt', 'manifestHash', 'members', 'merkleRoot', 'schema'],
    properties: {
      algorithm: { const: CONTENT_MERKLE_CONSTANTS.ALGORITHM },
      anchor: {
        type: ['object', 'null'],
        additionalProperties: true,
        properties: {
          attestationUid: HEX_0X_64,
          chainId: { type: 'integer' },
          contract: { type: 'string' },
          explorerUrl: { type: 'string' },
          schemaUid: HEX_0X_64,
          transactionHash: HEX_0X_64,
        },
      },
      count: { type: 'integer', minimum: 1 },
      generatedAt: { type: 'string', format: 'date-time' },
      manifestHash: HEX_64,
      manifestUri: { type: ['string', 'null'] },
      members: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['contentKey', 'leaf', 'merklePath', 'proofId', 'version'],
          properties: {
            contentKey: { type: 'string', minLength: 1 },
            leaf: HEX_64,
            merklePath: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['hash', 'position'],
                properties: {
                  hash: HEX_64,
                  position: { enum: ['left', 'right'] },
                },
              },
            },
            proofId: HEX_64,
            version: { type: 'integer', minimum: 1 },
          },
        },
      },
      merkleRoot: HEX_64,
      previousRoot: { anyOf: [HEX_64, { type: 'null' }] },
      schema: { const: CONTENT_MERKLE_CONSTANTS.BATCH_SCHEMA },
    },
  },
  'content-replica/v1': {
    $id: CONTENT_REPLICA_SCHEMA,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '2aran content replica v1',
    type: 'object',
    additionalProperties: false,
    required: ['canonical', 'contentHash', 'contentKey', 'proof', 'proofId', 'schema', 'version'],
    properties: {
      canonical: { type: 'object' },
      contentHash: HEX_64,
      contentKey: { type: 'string', minLength: 1 },
      proof: { $ref: CONTENT_PROOF_CONSTANTS.SCHEMA },
      proofId: HEX_64,
      schema: { const: CONTENT_REPLICA_SCHEMA },
      version: { type: 'integer', minimum: 1 },
    },
  },
  'content-proof-discovery/v1': {
    $id: CONTENT_PROOF_DISCOVERY_SCHEMA,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '2aran content proof discovery v1',
    type: 'object',
    additionalProperties: false,
    required: ['claims', 'discovery', 'protocol', 'publicKey', 'schema', 'verifier', 'version'],
    properties: {
      claims: { type: 'object' },
      discovery: { type: 'object' },
      proofs: { type: 'array' },
      protocol: { const: '2aran-content-proof' },
      publicKey: { type: 'object' },
      publisher: { type: 'string' },
      schema: { const: CONTENT_PROOF_DISCOVERY_SCHEMA },
      site: { type: 'string' },
      verifier: { type: 'object' },
      version: { type: 'integer', minimum: 1 },
    },
  },
  'content-proof-report/v1': {
    $id: CONTENT_PROOF_REPORT_SCHEMA,
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: '2aran content proof verifier report v1',
    type: 'object',
    required: ['checks', 'offline', 'schema', 'valid'],
    properties: {
      checks: { type: 'object' },
      contentKey: { type: ['string', 'null'] },
      errors: { type: 'array', items: { type: 'string' } },
      notVerified: { type: 'array' },
      offline: { const: true },
      schema: { const: CONTENT_PROOF_REPORT_SCHEMA },
      valid: { type: 'boolean' },
      verified: { type: 'array', items: { type: 'string' } },
      version: { type: ['integer', 'null'] },
    },
  },
}

export function listContentProofSchemaPaths() {
  return Object.keys(SCHEMAS)
}

export function getContentProofSchema(path) {
  return SCHEMAS[String(path || '').replace(/^\/+/, '')] || null
}
