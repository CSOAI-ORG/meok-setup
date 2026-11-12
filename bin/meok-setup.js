#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const GSPC_BOARD_URL = "https://councilof.ai/api/gspc";
export const COUNCIL_MCP_URL = "https://councilof.ai/mcp";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const c = {
  ok: (s) => `${ANSI.green}✓${ANSI.reset} ${s}`,
  err: (s) => `${ANSI.red}✗${ANSI.reset} ${s}`,
  info: (s) => `${ANSI.cyan}→${ANSI.reset} ${s}`,
  warn: (s) => `${ANSI.yellow}⚠${ANSI.reset} ${s}`,
  dim: (s) => `${ANSI.dim}${s}${ANSI.reset}`,
  bold: (s) => `${ANSI.bold}${s}${ANSI.reset}`,
  cyan: (s) => `${ANSI.cyan}${s}${ANSI.reset}`,
  green: (s) => `${ANSI.green}${s}${ANSI.reset}`,
  red: (s) => `${ANSI.red}${s}${ANSI.reset}`,
  yellow: (s) => `${ANSI.yellow}${s}${ANSI.reset}`,
};

export function loadPacks() {
  const packsPath = join(__dirname, "..", "packs.json");
  if (!existsSync(packsPath)) {
    throw new Error("packs.json not found. Reinstall meok-setup.");
  }
  return JSON.parse(readFileSync(packsPath, "utf-8"));
}

export function buildClients(home = homedir(), osPlatform = platform(), env = process.env) {
  return {
    claude: {
      name: "Claude Desktop",
      configPath:
        osPlatform === "darwin"
          ? join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
          : osPlatform === "win32"
            ? join(env.APPDATA || "", "Claude", "claude_desktop_config.json")
            : join(home, ".config", "Claude", "claude_desktop_config.json"),
      configKey: "mcpServers",
      supportsRemoteUrl: false,
    },
    "claude-code": {
      name: "Claude Code",
      configPath: join(home, ".claude.json"),
      configKey: "mcpServers",
      supportsRemoteUrl: true,
    },
    cursor: {
      name: "Cursor",
      configPath: join(home, ".cursor", "mcp.json"),
      configKey: "mcpServers",
      supportsRemoteUrl: true,
    },
    vscode: {
      name: "VS Code",
      configPath:
        osPlatform === "darwin"
          ? join(home, "Library", "Application Support", "Code", "User", "settings.json")
          : osPlatform === "win32"
            ? join(env.APPDATA || "", "Code", "User", "settings.json")
            : join(home, ".config", "Code", "User", "settings.json"),
      configKey: "mcp",
      supportsRemoteUrl: true,
    },
    windsurf: {
      name: "Windsurf",
      configPath: join(home, ".codeium", "windsurf", "mcp_config.json"),
      configKey: "mcpServers",
      supportsRemoteUrl: true,
    },
    gemini: {
      name: "Gemini CLI",
      configPath: join(home, ".gemini", "settings.json"),
      configKey: "mcpServers",
      supportsRemoteUrl: true,
    },
  };
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pack" || a === "-p") args.pack = argv[++i];
    else if (a === "--client" || a === "-c") args.client = argv[++i];
    else if (a === "--config-path") args.configPath = argv[++i];
    else if (a === "--list" || a === "-l") args.list = true;
    else if (a === "--check-gspc" || a === "--board") args.checkGspc = true;
    else if (a === "--dry-run" || a === "-n") args.dryRun = true;
    else if (a === "--uninstall" || a === "-u") args.uninstall = true;
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-V") args.version = true;
    else args._.push(a);
  }
  return args;
}

function showHelp() {
  console.log(`
${c.bold("meok-setup")} — Configure Council of AI GSPC & MEOK MCP servers

${c.bold("USAGE")}
  npx meok-setup [options]

${c.bold("OPTIONS")}
  -p, --pack <name>       Server pack to install (default: gspc)
  -c, --client <name>     Target client: claude, claude-code, cursor, vscode, windsurf, gemini (default: claude)
      --config-path <p>   Explicit config file path override
      --check-gspc        Fetch live GET https://councilof.ai/api/gspc totals verbatim
  -l, --list              List available packs and servers
  -n, --dry-run           Preview changes without writing files
  -u, --uninstall         Remove MCP servers from client config
  -y, --yes               Skip confirmation prompt
  -h, --help              Show this help
  -V, --version           Show version

${c.bold("EXAMPLES")}
  npx meok-setup                              Install canonical GSPC pack for Claude Desktop
  npx meok-setup --pack gspc --client cursor  Configure csoai-gspc-mcp + councilof.ai/mcp in Cursor
  npx meok-setup --check-gspc                 Read live GSPC board public_count & lid verbatim
  npx meok-setup --pack governance -y         Configure governance + GSPC pack

${c.bold("CANONICAL AUTHORITY")}
  Live board:     ${GSPC_BOARD_URL}
  Remote gateway: ${COUNCIL_MCP_URL} (single remote MCP gateway; measurement, not certification)
  MEOK surface:   https://meok.ai
`);
}

function showVersion() {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
  console.log(pkg.version);
}

function listPacks(packs) {
  console.log(`\n${c.bold("Available MCP Server Packs")}\n`);
  for (const [key, pack] of Object.entries(packs)) {
    const allServers =
      pack.servers[0] === "*"
        ? [...new Set(Object.values(packs).flatMap((p) => p.servers).filter((s) => s !== "*"))]
        : pack.servers;
    console.log(`  ${c.cyan(key.padEnd(12))} ${c.dim(`(${allServers.length} servers)`)} ${pack.description}`);
    if (key !== "all") {
      for (const s of allServers) {
        console.log(`  ${c.dim("".padEnd(12))} ${c.dim("├─")} ${s}`);
      }
    }
    console.log();
  }
}

export function buildMcpEntry(serverName, clientKey = "claude", clients = buildClients()) {
  const client = clients[clientKey] || { supportsRemoteUrl: false };
  if (serverName === "csoai-gspc-mcp") {
    return {
      command: "npx",
      args: ["-y", "csoai-gspc-mcp"],
    };
  }
  if (serverName === "councilof-ai") {
    if (!client.supportsRemoteUrl) {
      return null;
    }
    if (clientKey === "vscode") {
      return { type: "http", url: COUNCIL_MCP_URL };
    }
    if (clientKey === "windsurf") {
      return { serverUrl: COUNCIL_MCP_URL };
    }
    if (clientKey === "gemini") {
      return { httpUrl: COUNCIL_MCP_URL };
    }
    return { type: "http", url: COUNCIL_MCP_URL };
  }
  const moduleName = serverName.replace(/-/g, "_");
  return {
    command: "python",
    args: ["-m", moduleName],
  };
}

export async function fetchGspcBoard(fetchImpl = globalThis.fetch) {
  try {
    const res = await fetchImpl(GSPC_BOARD_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { ok: false, state: "UNCHECKABLE", reason: `HTTP ${res.status}`, source: GSPC_BOARD_URL };
    }
    const data = await res.json();
    const publicCount = data?.totals?.public_count;
    if (!publicCount) {
      return { ok: false, state: "UNCHECKABLE", reason: "missing totals.public_count", source: GSPC_BOARD_URL };
    }
    return {
      ok: true,
      state: "LIVE",
      source: GSPC_BOARD_URL,
      gateway: COUNCIL_MCP_URL,
      schema: data.schema || null,
      public_count: publicCount,
      separation_public_count: data.totals?.separation_public_count || null,
      lid: data.totals?.lid || null,
      doctrine: "Measurement, not certification. Counts quoted verbatim from GET https://councilof.ai/api/gspc.",
    };
  } catch (err) {
    return { ok: false, state: "UNCHECKABLE", reason: String(err?.message || err), source: GSPC_BOARD_URL };
  }
}

function readConfig(configPath) {
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

function writeConfig(configPath, config, dryRun) {
  if (dryRun) {
    console.log(c.dim(`  [dry-run] Would write ${configPath}`));
    return;
  }
  mkdirSync(dirname(configPath), { recursive: true });
  if (existsSync(configPath)) {
    writeFileSync(`${configPath}.bak`, readFileSync(configPath));
    console.log(c.dim(`  Backed up to ${configPath}.bak`));
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}

export function getConfigSection(config, clientKey, clients = buildClients()) {
  const client = clients[clientKey];
  if (clientKey === "vscode") {
    config["mcp"] = config["mcp"] || {};
    config["mcp"]["servers"] = config["mcp"]["servers"] || {};
    return config["mcp"]["servers"];
  }
  config[client.configKey] = config[client.configKey] || {};
  return config[client.configKey];
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const packs = loadPacks();
  const clients = buildClients();

  if (args.version) {
    showVersion();
    return 0;
  }

  if (args.help) {
    showHelp();
    return 0;
  }

  if (args.list) {
    listPacks(packs);
    return 0;
  }

  if (args.checkGspc) {
    const status = await fetchGspcBoard();
    console.log(JSON.stringify(status, null, 2));
    return status.ok ? 0 : 2;
  }

  const packKey = args.pack || "gspc";
  const clientKey = args.client || "claude";

  if (!packs[packKey]) {
    console.log(c.err(`Unknown pack '${packKey}'. Use --list to see available packs.`));
    return 1;
  }

  if (!clients[clientKey]) {
    console.log(c.err(`Unknown client '${clientKey}'. Available: ${Object.keys(clients).join(", ")}`));
    return 1;
  }

  const pack = packs[packKey];
  const client = clients[clientKey];
  const targetConfigPath = args.configPath || client.configPath;
  const isDryRun = Boolean(args.dryRun);
  const isUninstall = Boolean(args.uninstall);

  const rawServers =
    pack.servers[0] === "*"
      ? [...new Set(Object.values(packs).flatMap((p) => p.servers).filter((s) => s !== "*"))]
      : [...new Set(pack.servers)];

  const servers = isUninstall
    ? rawServers
    : rawServers.filter((s) => buildMcpEntry(s, clientKey, clients) !== null);

  const action = isUninstall ? "Uninstall" : "Install";
  const actionLower = isUninstall ? "uninstall" : "install";

  console.log(`
${c.bold("Council of AI × MEOK — GSPC & MCP Setup")}
${c.dim("────────────────────────────────────────")}

  ${c.bold("Action:")}  ${action} ${c.cyan(packKey)} pack ${c.dim(`(${servers.length} servers)`)}
  ${c.bold("Client:")}  ${client.name}
  ${c.bold("Config:")}  ${c.dim(targetConfigPath)}
  ${isDryRun ? c.yellow("  Mode:    DRY RUN — no files will be written\n") : ""}
`);

  if (!isUninstall && rawServers.includes("councilof-ai") && !client.supportsRemoteUrl) {
    console.log(
      c.info(
        `${client.name} uses stdio MCP configs; installing csoai-gspc-mcp (stdio) for live GSPC reads and verification.`
      )
    );
  }

  console.log(`\n${c.bold(`Servers to ${actionLower} (${servers.length}):`)}`);
  for (const s of servers) {
    console.log(`  ${isUninstall ? c.red("−") : c.green("+")} ${s}`);
  }

  if (!args.yes && !isDryRun) {
    const answer = await prompt(`\n${c.bold(`Proceed with ${actionLower}?`)} [Y/n] `);
    if (answer.toLowerCase() === "n") {
      console.log(c.info("Cancelled."));
      return 0;
    }
  }

  let config = readConfig(targetConfigPath) || {};
  const configSection = getConfigSection(config, clientKey, clients);

  let successCount = 0;
  let skipCount = 0;

  for (const serverName of servers) {
    if (isUninstall) {
      if (configSection[serverName]) {
        delete configSection[serverName];
        console.log(c.ok(`Removed ${serverName}`));
        successCount++;
      } else {
        console.log(c.dim(`  Skipped ${serverName} (not installed)`));
        skipCount++;
      }
    } else {
      if (configSection[serverName]) {
        console.log(c.dim(`  Skipped ${serverName} (already installed)`));
        skipCount++;
      } else {
        const entry = buildMcpEntry(serverName, clientKey, clients);
        if (entry) {
          configSection[serverName] = entry;
          console.log(c.ok(`Added ${serverName}`));
          successCount++;
        }
      }
    }
  }

  if (successCount > 0 || isDryRun) {
    writeConfig(targetConfigPath, config, isDryRun);
  }

  console.log(`
${c.bold(`${c.green("✓")} Done!`)}
  ${action === "Install" ? "Added" : "Removed"}: ${c.cyan(successCount.toString())} servers
  ${skipCount > 0 ? `Skipped: ${c.dim(skipCount.toString())} servers` : ""}
`);

  if (!isUninstall) {
    console.log(`${c.bold("Next steps:")}`);
    console.log(`  1. Restart ${client.name} to load the configured MCP servers.`);
    console.log(`  2. Verify live GSPC board reachability anytime: ${c.cyan("npx meok-setup --check-gspc")}`);
    console.log(`  ${c.dim(`Live board: ${GSPC_BOARD_URL} · Single remote gateway: ${COUNCIL_MCP_URL}`)}`);
    console.log(`  ${c.dim("Measurement, not certification. Verification on councilof.ai is free forever.")}`);
  }

  return 0;
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  runCli().then(
    (code) => process.exit(code),
    (e) => {
      console.log(c.err(e.message));
      process.exit(1);
    }
  );
}
