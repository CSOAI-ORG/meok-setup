import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const { servers } = JSON.parse(readFileSync(new URL("../servers.json", import.meta.url), "utf8"));
function probe(name, l) {
  return new Promise((res) => {
    const args = ["--from", l.pypi, ...(l.with || []).flatMap((r) => ["--with", r]), l.script];
    const t0 = Date.now();
    const p = spawn("uvx", args, { stdio: ["pipe", "pipe", "pipe"], env: process.env });
    let buf = "", err = "", info = null, fin = false;
    const done = (r) => { if (fin) return; fin = true; try { p.kill(); } catch {} res({ name, secs: Math.round((Date.now() - t0) / 1000), ...r }); };
    const tm = setTimeout(() => done({ ok: false, why: "timeout 180s", err: err.slice(-300) }), 180000);
    const send = (o) => { try { p.stdin.write(JSON.stringify(o) + "\n"); } catch {} };
    p.stderr.on("data", (d) => (err += d));
    p.stdout.on("data", (d) => {
      buf += d; const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.id === 1) { info = m.result?.serverInfo; send({ jsonrpc: "2.0", method: "notifications/initialized" }); send({ jsonrpc: "2.0", id: 2, method: "tools/list" }); }
        if (m.id === 2) { clearTimeout(tm); done({ ok: true, server: info?.name, tools: m.result?.tools?.length ?? 0 }); }
      }
    });
    p.on("exit", (c) => { clearTimeout(tm); done({ ok: false, why: `exit ${c}`, err: err.split("\n").filter(Boolean).slice(-2).join(" | ").slice(-300) }); });
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "meok-setup-probe", version: "0" } } });
  });
}
const names = Object.keys(servers); const out = []; let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (i < names.length) { const n = names[i++]; out.push(await probe(n, servers[n])); } }));
console.log(JSON.stringify(out, null, 2));
const ok = out.filter((r) => r.ok);
console.log(`started+listed tools: ${ok.length}/${out.length}`);
for (const r of out.filter((r) => !r.ok)) console.log("FAIL", r.name, r.why, r.err);
if (ok.length !== out.length) process.exit(1);
