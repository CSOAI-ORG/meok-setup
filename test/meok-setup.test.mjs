import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GSPC_BOARD_URL,
  COUNCIL_MCP_URL,
  loadPacks,
  buildClients,
  buildMcpEntry,
  fetchGspcBoard,
  runCli,
} from "../bin/meok-setup.js";

test("gspc pack is first-class and includes csoai-gspc-mcp and councilof-ai", () => {
  const packs = loadPacks();
  assert.ok(packs.gspc);
  assert.deepEqual(packs.gspc.servers, ["csoai-gspc-mcp", "councilof-ai"]);
  assert.ok(packs.governance.servers.includes("csoai-gspc-mcp"));
  assert.ok(packs.governance.servers.includes("councilof-ai"));
});

test("buildMcpEntry emits stdio for Claude Desktop and Streamable HTTP + stdio for HTTP clients", () => {
  const clients = buildClients("/tmp/fakehome", "darwin", {});
  assert.deepEqual(buildMcpEntry("csoai-gspc-mcp", "claude", clients), {
    command: "npx",
    args: ["-y", "csoai-gspc-mcp"],
  });
  assert.equal(buildMcpEntry("councilof-ai", "claude", clients), null);
  assert.deepEqual(buildMcpEntry("councilof-ai", "cursor", clients), {
    type: "http",
    url: COUNCIL_MCP_URL,
  });
  assert.deepEqual(buildMcpEntry("councilof-ai", "gemini", clients), {
    httpUrl: COUNCIL_MCP_URL,
  });
});

test("runCli installs and uninstalls gspc pack cleanly into an isolated Cursor config", async () => {
  const dir = mkdtempSync(join(tmpdir(), "meok-setup-test-"));
  const cfgPath = join(dir, "mcp.json");
  try {
    const code1 = await runCli(["--pack", "gspc", "--client", "cursor", "--config-path", cfgPath, "-y"]);
    assert.equal(code1, 0);
    const written = JSON.parse(readFileSync(cfgPath, "utf-8"));
    assert.deepEqual(written.mcpServers["csoai-gspc-mcp"], {
      command: "npx",
      args: ["-y", "csoai-gspc-mcp"],
    });
    assert.deepEqual(written.mcpServers["councilof-ai"], {
      type: "http",
      url: COUNCIL_MCP_URL,
    });

    const code2 = await runCli(["--pack", "gspc", "--client", "cursor", "--config-path", cfgPath, "--uninstall", "-y"]);
    assert.equal(code2, 0);
    const after = JSON.parse(readFileSync(cfgPath, "utf-8"));
    assert.deepEqual(after.mcpServers, {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fetchGspcBoard quotes totals.public_count verbatim and returns UNCHECKABLE on failure", async () => {
  const okRes = await fetchGspcBoard(async (url) => {
    assert.equal(url, GSPC_BOARD_URL);
    return new Response(
      JSON.stringify({
        schema: "csoai.gspc-axes/0.5",
        totals: { public_count: "34 axes · 34 measured", lid: "synthetic lid" },
      }),
      { status: 200 }
    );
  });
  assert.equal(okRes.ok, true);
  assert.equal(okRes.public_count, "34 axes · 34 measured");
  assert.equal(okRes.gateway, COUNCIL_MCP_URL);

  const badRes = await fetchGspcBoard(async () => new Response("", { status: 503 }));
  assert.equal(badRes.ok, false);
  assert.equal(badRes.state, "UNCHECKABLE");
});
