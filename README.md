# meok-setup

[![npm](https://img.shields.io/npm/v/meok-setup)](https://www.npmjs.com/package/meok-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-installer-purple)](https://meok.ai)

**Zero-friction installer for MEOK governance MCP servers.**

One command sets up EU AI Act, DORA, NIS2, CRA, GDPR (and 30+ more) compliance MCPs across Claude Desktop, Cursor, VS Code, and Windsurf.

## Quick start

```bash
# Install governance pack (10 MCPs) into Claude Desktop
npx meok-setup

# Or pick a different pack
npx meok-setup --pack a2a         # 6 agent-to-agent MCPs
npx meok-setup --pack trade       # 7 UK trade verticals
npx meok-setup --pack industry    # 8 industry verticals (crypto, medical, fintech)
npx meok-setup --pack cybersec    # 6 cybersecurity MCPs
npx meok-setup --pack all         # All 37 MCPs

# Different client
npx meok-setup --client cursor
npx meok-setup --client windsurf

# Skip prompt
npx meok-setup -y
```

## What it does

1. **Installs Python packages** via `pip install --user`
2. **Updates your MCP client config** (Claude Desktop / Cursor / Windsurf) — appends to existing config, doesn't overwrite
3. **Reminds you to restart** your client + set `MEOK_API_KEY` for Pro tier

## Packs available

| Pack | Count | Use case |
|------|-------|----------|
| `governance` | 10 | EU AI Act, DORA, NIS2, CRA, GDPR, bias, AI-BOM |
| `a2a` | 6 | Multi-agent governance: policy, audit, rate limit, handoff, prompt injection, data residency |
| `trade` | 7 | UK trade: haulage, skip hire, BIM, NRSWA, CHAS, crane, concrete pump |
| `industry` | 8 | MiCA crypto, MDR, FDA SaMD, COPPA/FERPA, Basel, MiFID II, AML, food |
| `cybersec` | 6 | CISA KEV, SBOM, MITRE ATT&CK/ATLAS, SLSA, Sigstore |
| `all` | 37 | Everything |

## Pricing

Free tier: 10 calls/day per MCP. No API key needed.
Pro tier: £79/mo, unlimited + signed attestations. https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836
Enterprise: £1,499/mo. hello@meok.ai

## Verifying compliance attestations

Every Pro/Enterprise audit emits an HMAC-signed cert with a public verify URL. Verify any cert without contacting MEOK:

```
https://meok-attestation-api.vercel.app/verify
```

## License

MIT © MEOK AI Labs
