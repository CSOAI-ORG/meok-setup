# meok-setup

[![MEOK](https://img.shields.io/badge/MEOK-CSOAI%20Ltd-667eea)](https://meok.ai)
[![Measurement](https://img.shields.io/badge/Measurement-not%20certification-64748b)](https://councilof.ai/api/gspc)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Adds MEOK compliance MCP servers to Claude Desktop, Cursor, VS Code or Windsurf. It writes MCP entries into the client's config file, after backing it up. It installs nothing itself: each server is started on demand by [`uvx`](https://docs.astral.sh/uv/) from its own PyPI package, in its own isolated environment.

## Quick start

```bash
npx meok-setup --list                       # packs and the servers in each
npx meok-setup --dry-run --pack governance  # preview, writes nothing
npx meok-setup --pack governance            # add the governance pack to Claude Desktop
npx meok-setup --uninstall --pack governance
```

Requires Node 18+ and [uv](https://docs.astral.sh/uv/) on the machine running the MCP client.

## What gets written

One entry per server, for example:

```json
"eu-ai-act-compliance-mcp": { "command": "uvx", "args": ["--from", "eu-ai-act-compliance-mcp", "--with", "mcp<2", "eu-ai-act-compliance-mcp"] }
```

`--with mcp<2` is a guard. The server packages declare `mcp>=1.28.0` with no upper bound, and the MCP Python SDK 2.0 (28 July 2026) renamed `FastMCP`, so a fresh unguarded install fails at import. The guard is dropped per server once that package is republished with `mcp<2` or migrated to mcp 2.

The package name and launch script for every server are in [`servers.json`](servers.json). They were read from each package's published wheel on PyPI, not typed by hand. `npx meok-setup --list` prints the current packs and counts from that file.

## Pricing

MEOK charges per delivered job; there are no subscriptions or tiers. See https://meok.ai/pricing.

## What this is not

- **Measurement, not certification.** CSOAI Ltd measures and signs; it does not certify, accredit or act as a notified body. These servers do not certify EU AI Act or any other compliance.
- Live measurement figures come from `GET https://councilof.ai/api/gspc`; this README does not repeat them.

## Licence

MIT © CSOAI Ltd (UK Companies House 16939677). MEOK is a trading name of CSOAI Ltd.
