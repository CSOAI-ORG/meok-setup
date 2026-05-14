#!/usr/bin/env node
/**
 * meok-setup — Zero-friction installer for MEOK governance MCPs
 *
 * One command sets up ALL MEOK governance MCPs (EU AI Act, DORA, NIS2, CRA, GDPR…)
 * across Claude Desktop, Cursor, VS Code, and Windsurf.
 *
 * Usage:
 *   npx meok-setup                    # Interactive installer
 *   npx meok-setup --client claude    # Install for Claude Desktop only
 *   npx meok-setup --pack governance  # Install governance pack (15 MCPs)
 *   npx meok-setup --pack a2a         # Install A2A pack (7 MCPs)
 *   npx meok-setup --pack trade       # Install UK trade pack (7 MCPs)
 *   npx meok-setup --pack all         # Install everything (40+ MCPs)
 *
 * © 2026 MEOK AI Labs · MIT licensed · https://meok.ai
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import readline from "node:readline";

const $ = promisify(exec);

const PACKS = {
  governance: {
    name: "Governance pack",
    description: "EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001 — every major regulation",
    packages: [
      "eu-ai-act-compliance-mcp",
      "dora-compliance-mcp",
      "nis2-compliance-mcp",
      "cra-compliance-mcp",
      "ai-bom-mcp",
      "ai-incident-reporting-mcp",
      "dora-nis2-crosswalk-mcp",
      "uk-ai-bill-compliance-mcp",
      "watermarking-authenticity-mcp",
      "bias-detection-mcp",
    ],
  },
  a2a: {
    name: "Agent-to-agent pack",
    description: "Run multi-agent systems with governance, identity, audit, and data residency",
    packages: [
      "agent-policy-enforcement-mcp",
      "agent-audit-logger-mcp",
      "agent-rate-limiter-mcp",
      "agent-handoff-certified-mcp",
      "agent-prompt-injection-firewall-mcp",
      "agent-data-residency-mcp",
    ],
  },
  trade: {
    name: "UK trade pack",
    description: "Haulage, plant hire, waste, construction, crane, concrete pump — UK regulatory",
    packages: [
      "haulage-uk-compliance-mcp",
      "skip-hire-ai-mcp",
      "construction-iso-19650-mcp",
      "nrswa-ai-mcp",
      "chas-elite-prep-mcp",
      "crane-hire-cpcs-mcp",
      "concrete-pump-cpa-mcp",
    ],
  },
  industry: {
    name: "Industry verticals pack",
    description: "MiCA crypto, MDR/IVDR, FDA SaMD, COPPA/FERPA, Basel, MiFID II, AML",
    packages: [
      "mica-crypto-mcp",
      "mdr-medical-device-mcp",
      "fda-samd-mcp",
      "coppa-ferpa-mcp",
      "basel-ai-overlay-mcp",
      "mifid-ii-ai-mcp",
      "aml-ai-mcp",
      "fsa-food-safety-mcp",
      "cobol-bridge-mcp",
    ],
  },
  cybersec: {
    name: "Cybersecurity governance pack",
    description: "CISA KEV, SBOM, MITRE ATT&CK/ATLAS, SLSA, Sigstore",
    packages: [
      "cisa-kev-mcp",
      "sbom-cyclonedx-mcp",
      "mitre-attack-mcp",
      "mitre-atlas-mcp",
      "slsa-supply-chain-mcp",
      "sigstore-cosign-mcp",
    ],
  },
};

const CLIENTS = {
  claude: {
    name: "Claude Desktop",
    configPath:
      platform() === "darwin"
        ? join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json")
        : platform() === "win32"
        ? join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json")
        : join(homedir(), ".config", "Claude", "claude_desktop_config.json"),
  },
  cursor: {
    name: "Cursor",
    configPath: join(homedir(), ".cursor", "mcp.json"),
  },
  windsurf: {
    name: "Windsurf",
    configPath: join(homedir(), ".codeium", "windsurf", "mcp_config.json"),
  },
};

function log(msg, level = "info") {
  const prefix =
    level === "ok" ? "\x1b[32m✓\x1b[0m" : level === "err" ? "\x1b[31m✗\x1b[0m" : "\x1b[34m→\x1b[0m";
  console.log(`${prefix} ${msg}`);
}

async function installPackage(pkg) {
  try {
    await $(`pip install --user --upgrade ${pkg}`);
    log(`Installed ${pkg}`, "ok");
    return true;
  } catch (e) {
    log(`Failed to install ${pkg}: ${e.message.split("\n")[0]}`, "err");
    return false;
  }
}

function writeClientConfig(clientKey, mcpEntries) {
  const client = CLIENTS[clientKey];
  const path = client.configPath;
  mkdirSync(dirname(path), { recursive: true });
  let cfg = { mcpServers: {} };
  if (existsSync(path)) {
    try {
      cfg = JSON.parse(readFileSync(path, "utf-8"));
      cfg.mcpServers = cfg.mcpServers || {};
    } catch {
      log(`Existing ${client.name} config malformed, backing up to ${path}.bak`, "info");
      writeFileSync(`${path}.bak`, readFileSync(path));
    }
  }
  Object.assign(cfg.mcpServers, mcpEntries);
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  log(`Updated ${client.name} config: ${path}`, "ok");
}

function buildMcpEntries(packages) {
  const entries = {};
  for (const pkg of packages) {
    // pkg name → module: replace hyphens with underscores
    const moduleName = pkg.replace(/-/g, "_");
    entries[pkg] = {
      command: "python",
      args: ["-m", moduleName],
      env: {
        MEOK_API_KEY: "${MEOK_API_KEY}",
      },
    };
  }
  return entries;
}

async function main() {
  const args = process.argv.slice(2);
  const clientFlag = args.indexOf("--client");
  const packFlag = args.indexOf("--pack");
  const yesFlag = args.includes("--yes") || args.includes("-y");

  let client = clientFlag >= 0 ? args[clientFlag + 1] : "claude";
  let packKey = packFlag >= 0 ? args[packFlag + 1] : "governance";

  console.log(`
\x1b[1m🛡  MEOK AI Labs — Governance MCP Installer\x1b[0m

This will install MEOK governance MCPs into ${CLIENTS[client]?.name || client}.
Pack: \x1b[36m${packKey}\x1b[0m
`);

  let packsToInstall = [];
  if (packKey === "all") {
    packsToInstall = Object.keys(PACKS);
  } else if (PACKS[packKey]) {
    packsToInstall = [packKey];
  } else {
    log(`Unknown pack '${packKey}'. Available: ${Object.keys(PACKS).join(", ")}, all`, "err");
    process.exit(1);
  }

  const allPackages = [];
  for (const p of packsToInstall) {
    allPackages.push(...PACKS[p].packages);
  }

  console.log(`\n\x1b[1mPackages to install (${allPackages.length}):\x1b[0m`);
  allPackages.forEach((p) => console.log(`  • ${p}`));

  if (!yesFlag) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ok = await new Promise((r) => rl.question("\nContinue? [Y/n] ", (a) => { rl.close(); r(a.toLowerCase() !== "n"); }));
    if (!ok) {
      log("Cancelled", "info");
      process.exit(0);
    }
  }

  console.log("\n\x1b[1mInstalling packages...\x1b[0m");
  let succ = 0;
  for (const pkg of allPackages) {
    if (await installPackage(pkg)) succ++;
  }
  log(`Installed ${succ}/${allPackages.length} packages`, "ok");

  if (CLIENTS[client]) {
    console.log(`\n\x1b[1mConfiguring ${CLIENTS[client].name}...\x1b[0m`);
    const entries = buildMcpEntries(allPackages);
    writeClientConfig(client, entries);
  }

  console.log(`
\x1b[1m\x1b[32m✓ Done!\x1b[0m

Next steps:
1. Restart ${CLIENTS[client]?.name || "your MCP client"} to load the new servers.
2. (Optional) Set \x1b[36mMEOK_API_KEY\x1b[0m for Pro tier features:
     \x1b[36mexport MEOK_API_KEY=...\x1b[0m
   Subscribe at \x1b[36mhttps://buy.stripe.com/14A4gB3K4eUWgYR56o8k836\x1b[0m (£79/mo)

Free tier: 10 calls/day, no key required.
Docs: \x1b[36mhttps://meok.ai\x1b[0m
Support: hello@meok.ai
`);
}

main().catch((e) => {
  log(e.message, "err");
  process.exit(1);
});
