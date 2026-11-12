# meok-setup

[![MEOK](https://img.shields.io/badge/MEOK-meok.ai-0ea5e9)](https://meok.ai)
[![GSPC](https://img.shields.io/badge/GSPC-live%20GET%20%2Fapi%2Fgspc-0ea5e9)](https://councilof.ai/api/gspc)
[![Measurement](https://img.shields.io/badge/Measurement-not%20certification-64748b)](https://councilof.ai/api/gspc)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Zero-dependency Node.js CLI to configure **Council of AI's GSPC measurement board** (`csoai-gspc-mcp` + `https://councilof.ai/mcp`) and MEOK MCP packs across **Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, and Gemini CLI**.

---

## Quick Start

```bash
# Configure the canonical GSPC pack (csoai-gspc-mcp + councilof.ai/mcp)
npx meok-setup

# Configure Cursor, Claude Code, VS Code, Windsurf, or Gemini CLI
npx meok-setup --pack gspc --client cursor -y
npx meok-setup --pack gspc --client claude-code -y
npx meok-setup --pack gspc --client vscode -y
npx meok-setup --pack gspc --client gemini -y

# Quote the live GSPC board totals verbatim (never recomputed)
npx meok-setup --check-gspc
```

## Canonical Architecture & Boundaries

- **Single Remote MCP Gateway:** `https://councilof.ai/mcp` (Streamable HTTP). MEOK operates no second remote MCP gateway; all remote MCP traffic routes through `https://councilof.ai/mcp`.
- **Local Stdio GSPC Server:** [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) (`npx -y csoai-gspc-mcp`) reads `GET https://councilof.ai/api/gspc` and verifies Ed25519 measurement cards offline.
- **Layer-0 Client SDK:** [`@csoai/layer0`](https://www.npmjs.com/package/@csoai/layer0) (npm) · [`csoai-gspc`](https://pypi.org/project/csoai-gspc/) (PyPI).
- **Free Verification Forever:** `GET https://councilof.ai/api/gspc`, `GET https://councilof.ai/api/corrections`, and `https://councilof.ai/gspc-verify` carry no payment gate.

## Honesty Register

**Live authority is `GET https://councilof.ai/api/gspc`** — cite `totals.public_count` and `totals.lid` from that payload. Do not type static axis counts into documentation.

- **Measurement, not certification.** CSOAI Ltd (UK Companies House `16939677`) measures and publishes signed artifacts; it does not certify, accredit, or act as a notified body.
- **MEOK.ai is a human-in-command workspace and frontend**, not a second Council.
- Prefer honest **UNCHECKABLE** over an unverified claim.

## License

MIT © [CSOAI Ltd](https://councilof.ai)
