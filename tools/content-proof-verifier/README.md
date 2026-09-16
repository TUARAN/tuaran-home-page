# 2aran Content Proof Verifier

Offline CLI for `2aran-content-proof@v1`. It reuses the same browser-safe hashing and signature code as 2aran.com, but it only reads local files. It does not fetch `2aran.com`, open a wallet, or query chain RPC.

## What a passing result means

- The normalized content SHA-256 matches the proof.
- The proof ID matches the unsigned proof payload.
- The pinned P-256 public key verifies the publisher signature.
- If you pass a batch file, the Merkle path reproduces the published root.
- If you pass a replica file, the enclosed canonical content matches the proof.

## What it does not mean

- The article's numbers, citations, or opinions are true.
- A court has decided copyright ownership.
- The live EAS attestation was re-fetched from Base. Open `batch.anchor.explorerUrl` yourself if you need that extra check.

## Pin the public key first

Download the publisher JWK from a channel you already trust, then keep that file. Do not treat a key that only exists inside a proof JSON as identity.

Example key used by the checked-in demo:

```text
public/.well-known/content-proof-key.json
```

## Run

From the repository root, Node 18+ with Web Crypto:

```bash
node tools/content-proof-verifier/cli.mjs \
  --replica public/proofs/replicas/content-proof-demo-v1.json \
  --public-key public/.well-known/content-proof-key.json \
  --batch public/proofs/batches/bootstrap-001-anchored.json \
  --expected-chain-id 84532
```

Or verify a proof and entry without a replica:

```bash
node tools/content-proof-verifier/cli.mjs \
  --proof proof.json \
  --entry entry.json \
  --public-key site-public.jwk.json
```

Exit code `0` means every supplied check passed. The JSON report lists `verified` and `notVerified` so a script or agent can say what was actually checked.

## Copy it out of this repo

These files are enough to verify proofs without the website:

- `tools/content-proof-verifier/cli.mjs`
- `lib/contentProof.js`
- `lib/contentMerkle.js`
- `lib/contentReplica.js`
- `lib/contentProofClaims.js`
- `lib/contentProofVerify.js`

Keep the relative `../../lib/` imports, or place those modules next to the CLI and adjust the import paths.
