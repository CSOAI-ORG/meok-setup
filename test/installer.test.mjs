// End-to-end: run the real CLI against a throwaway HOME and read what it wrote.
//   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "bin", "meok-setup.js");
const packs = JSON.parse(readFileSync(join(ROOT, "packs.json"), "utf8"));
const { servers } = JSON.parse(readFileSync(join(ROOT, "servers.json"), "utf8"));

function run(args) {
  const home = mkdtempSync(join(resolve(tmpdir()), "meok-setup-"));
  const out = execFileSync(process.execPath, [CLI, ...args], { env: { ...process.env, HOME: home, NO_COLOR: "1" }, encoding: "utf8" });
  return { home, out };
}
// macOS: VS Code config path has no hidden directory; elsewhere use Cursor.
const CLIENT = platform() === "darwin" ? "vscode" : "cursor";
function readEntries(home) {
  const f = CLIENT === "vscode"
    ? join(home, "Library", "Application Support", "Code", "User", "settings.json")
    : join(home, ".cursor", "mcp.json");
  if (!existsSync(f)) return null;
  const cfg = JSON.parse(readFileSync(f, "utf8"));
  return CLIENT === "vscode" ? cfg.mcp.servers : cfg.mcpServers;
}
const allNames = [...new Set(Object.values(packs).flatMap((p) => p.servers).filter((s) => s !== "*"))];

test("every server named in a pack has a launch entry", () => {
  for (const s of allNames) assert.ok(servers[s], `${s} is in packs.json but not servers.json`);
});

test("launch entries name a PyPI package and a console script", () => {
  for (const [name, l] of Object.entries(servers)) {
    assert.match(l.pypi, /^[a-z0-9][a-z0-9-]*$/, name);
    assert.match(l.script, /^[A-Za-z0-9_.-]+$/, name);
  }
});

test("--pack all writes one uvx entry per unique server and nothing else", () => {
  const { home } = run(["--pack", "all", "--client", CLIENT, "--yes"]);
  const entries = readEntries(home);
  assert.equal(Object.keys(entries).length, allNames.length);
  for (const [name, e] of Object.entries(entries)) {
    assert.equal(e.command, "uvx");
    const w = (servers[name].with || []).flatMap((r) => ["--with", r]);
    assert.deepEqual(e.args, ["--from", servers[name].pypi, ...w, servers[name].script]);
    assert.ok(e.args.includes("mcp<2"), `${name} must carry the mcp<2 guard until republished`);
    assert.equal(e.env, undefined, "no literal ${VAR} env values");
  }
});

test("underscore console scripts are preserved (gdpr)", () => {
  assert.equal(servers["gdpr-compliance-ai-mcp"].script, "gdpr_compliance_ai_mcp");
});

test("--list prints counts derived from the data, never a typed figure", () => {
  const { out } = run(["--list"]);
  assert.ok(out.includes(`(${allNames.length} servers)`), out);
  assert.ok(!/218\+|200\+|300\+/.test(out));
});

test("--dry-run writes no file; uninstall removes what install added", () => {
  const dry = run(["--pack", "governance", "--client", CLIENT, "--dry-run"]);
  assert.equal(readEntries(dry.home), null);
  const home = mkdtempSync(join(resolve(tmpdir()), "meok-setup-"));
  const env = { ...process.env, HOME: home, NO_COLOR: "1" };
  execFileSync(process.execPath, [CLI, "--pack", "governance", "--client", CLIENT, "--yes"], { env });
  execFileSync(process.execPath, [CLI, "--uninstall", "--pack", "governance", "--client", CLIENT, "--yes"], { env });
  assert.equal(Object.keys(readEntries(home)).length, 0);
});

test("no subscription or tier pricing is printed", () => {
  const { out } = run(["--pack", "governance", "--client", CLIENT, "--yes"]);
  assert.ok(!/£79|\$99|\$499|Subscribe|buy\.stripe\.com|Pro tier/i.test(out), out);
});
