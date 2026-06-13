# meok-setup

[![npm](https://img.shields.io/npm/v/meok-setup)](https://www.npmjs.com/package/meok-setup)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-installer-purple)](https://meok.ai)

**Zero-friction installer for MEOK AI compliance MCP servers.**

One command installs EU AI Act, GDPR, ISO 27001, NIS2, DORA, HIPAA, OWASP, and 200+ more compliance MCPs across Claude Desktop, Cursor, VS Code, and Windsurf.

## Quick start

```bash
# Install governance pack (13 MCPs) into Claude Desktop
npx meok-setup

# Pick a specific pack
npx meok-setup --pack healthcare
npx meok-setup --pack security
npx meok-setup --pack all

# Target a different client
npx meok-setup --client cursor
npx meok-setup --client vscode
npx meok-setup --client windsurf

# Preview without writing files
npx meok-setup --dry-run --pack governance

# Skip confirmation prompt
npx meok-setup --pack governance --yes
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--pack <name>` | `-p` | Server pack to install (default: `governance`) |
| `--client <name>` | `-c` | Target client: `claude`, `cursor`, `vscode`, `windsurf` |
| `--list` | `-l` | List all available packs and servers |
| `--dry-run` | `-n` | Preview changes without writing files |
| `--uninstall` | `-u` | Remove MCP servers from client config |
| `--yes` | `-y` | Skip confirmation prompt |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version |

## Packs

| Pack | Servers | Coverage |
|------|---------|----------|
| `governance` | 13 | EU AI Act, GDPR, ISO 27001, ISO 42001, NIS2, DORA, CRA, AI-BOM, bias detection |
| `healthcare` | 5 | HIPAA, FHIR, SaMD, MDR, clinical AI governance |
| `finance` | 4 | Basel, MiFID II, AML, MiCA crypto |
| `security` | 8 | OWASP, MITRE ATT&CK/ATLAS, CISA KEV, SBOM, SLSA, Sigstore |
| `a2a` | 6 | Agent policy, audit, rate limiting, handoff, prompt injection firewall, data residency |
| `trade` | 7 | UK haulage, skip hire, BIM, NRSWA, CHAS, crane, concrete pump |
| `industry` | 9 | MiCA, MDR, FDA SaMD, COPPA/FERPA, Basel, MiFID II, AML, food safety |
| `all` | 218+ | Every MEOK compliance MCP server |

## What it does

1. **Detects** installed MCP clients (Claude Desktop, Cursor, VS Code, Windsurf)
2. **Writes** MCP server entries to the appropriate config file
3. **Preserves** existing config — appends, never overwrites
4. **Backs up** config before writing (`.bak` file)
5. **Skips** servers already present in config

## Uninstall

```bash
# Remove a specific pack
npx meok-setup --uninstall --pack governance

# Remove everything from a client
npx meok-setup --uninstall --pack all --client cursor
```

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | £0 | 10 calls/day per MCP, no API key required |
| Pro | £79/mo | Unlimited calls, signed attestations, priority support |
| Enterprise | £1,499/mo | Custom SLA, on-prem, dedicated support |

Subscribe: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K

## Verifying compliance attestations

Every Pro/Enterprise audit emits an HMAC-signed cert with a public verify URL:

```
https://meok-attestation-api.vercel.app/verify
```

## License

MIT © MEOK AI Labs
