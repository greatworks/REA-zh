#!/usr/bin/env node
/**
 * rea-update.mjs — REA 版本核对与更新提示（中文）
 *
 * 默认只读：只报告本机版本与线上最新版，不安装、不改配置、不碰任何引擎。
 * 只有显式传 --install 才会执行 npm 安装——这表示用户已经同意。
 *
 * 用法：
 *   node scripts/rea-update.mjs              人类可读提示
 *   node scripts/rea-update.mjs --json       机器可读，便于代理判断
 *   node scripts/rea-update.mjs --fresh      忽略 24 小时缓存，强制联网
 *   node scripts/rea-update.mjs --offline    不联网，只报本机
 *   node scripts/rea-update.mjs --install    装到最新（用户同意后才用）
 *
 * 设计约束：
 *   - 联网失败不报错，把结论降级为「未知」，不阻断逆向工作。
 *   - 默认 24 小时缓存，避免每次调用都打 registry。
 *   - 绝不静默安装。这是外部改动，必须由用户决定。
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCTOR = path.join(HERE, "rea-doctor.mjs");
const IS_WIN = process.platform === "win32";

const ARGV = new Set(process.argv.slice(2));
const JSON_OUT = ARGV.has("--json");
const FRESH = ARGV.has("--fresh");
const OFFLINE = ARGV.has("--offline");
const INSTALL = ARGV.has("--install");

const CACHE_FILE = path.join(os.tmpdir(), "rea-update-check.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REGISTRY_URL = "https://registry.npmjs.org/rea-agents/latest";

/* ------------------------------------------------------------------ 本机状态 */

function localState() {
  try {
    const raw = execFileSync(process.execPath, [DOCTOR, "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30000,
      windowsHide: true,
    });
    const report = JSON.parse(raw);
    return {
      installed: Boolean(report.rea?.active),
      active: report.rea?.active || null,
      found: report.rea?.found || [],
      node: report.node || null,
    };
  } catch (err) {
    return { installed: false, active: null, found: [], node: null, error: String(err.message || err) };
  }
}

if (!existsSync(DOCTOR)) {
  console.error("技能包不完整：同目录下缺少 rea-doctor.mjs，无法判断本机状态。");
  console.error("请重新安装本技能，或直接跑 npx -y rea-agents@latest --version 自查。");
  process.exit(1);
}

/* --------------------------------------------------------------- 线上最新版本 */

function readCache() {
  if (FRESH || !existsSync(CACHE_FILE)) return null;
  try {
    const c = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    if (!c.latest || !c.checkedAt) return null;
    if (Date.now() - Date.parse(c.checkedAt) > CACHE_TTL_MS) return null;
    return c;
  } catch {
    return null;
  }
}

function writeCache(latest) {
  try {
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ latest, checkedAt: new Date().toISOString() }, null, 2) + "\n",
      "utf8",
    );
  } catch {
    /* 缓存写不进去不影响结论 */
  }
}

function fetchJson(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { headers: { "user-agent": "rea-reverse-engineering-zh", accept: "application/json" }, timeout: timeoutMs },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
  });
}

function fetchViaNpm() {
  const res = IS_WIN
    ? spawnSync("cmd.exe", ["/d", "/c", "npm", "view", "rea-agents", "version"], {
        encoding: "utf8",
        timeout: 15000,
        windowsHide: true,
      })
    : spawnSync("npm", ["view", "rea-agents", "version"], { encoding: "utf8", timeout: 15000 });

  const out = (res.stdout || "").trim();
  return /^\d+\.\d+\.\d+/.test(out) ? out.split("\n").pop().trim() : null;
}

async function latestVersion() {
  if (OFFLINE) return { latest: null, source: "offline" };

  const cached = readCache();
  if (cached) return { latest: cached.latest, source: "cache" };

  const doc = await fetchJson(REGISTRY_URL);
  if (doc && typeof doc.version === "string") {
    writeCache(doc.version);
    return { latest: doc.version, source: "registry" };
  }

  // 直连失败时退回 npm，它能吃到 .npmrc 里的代理配置
  const fromNpm = fetchViaNpm();
  if (fromNpm) {
    writeCache(fromNpm);
    return { latest: fromNpm, source: "npm" };
  }

  return { latest: null, source: "unreachable" };
}

/* ------------------------------------------------------------------ 版本比较 */

function parts(v) {
  const m = String(v || "").match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function compare(a, b) {
  const pa = parts(a);
  const pb = parts(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

function distance(current, latest) {
  const a = parts(current);
  const b = parts(latest);
  if (!a || !b) return "";
  if (a[0] !== b[0]) return `落后 ${b[0] - a[0]} 个大版本`;
  if (a[1] !== b[1]) return `落后 ${b[1] - a[1]} 个次版本`;
  return `落后 ${b[2] - a[2]} 个修订`;
}

/* ---------------------------------------------------------------------- 安装 */

function npmInstall(pin) {
  const cmd = `npm install --global ${pin}`;
  const res = IS_WIN
    ? spawnSync("cmd.exe", ["/d", "/c", "npm", "install", "--global", pin], { stdio: "inherit", windowsHide: true })
    : spawnSync("npm", ["install", "--global", pin], { stdio: "inherit" });
  return { ok: res.status === 0, cmd };
}

/* ---------------------------------------------------------------------- 主流程 */

const local = localState();
const { latest, source } = await latestVersion();

let status;
if (!local.installed) status = "not_installed";
else if (!latest) status = "unknown";
else if (compare(local.active.version, latest) < 0) status = "outdated";
else status = "up_to_date";

const payload = {
  status,
  local: {
    installed: local.installed,
    version: local.active?.version || null,
    source: local.active?.source || null,
    others: local.found
      .filter(
        (x) =>
          !(x.version === local.active?.version && x.source === local.active?.source),
      )
      .map((x) => `${x.version}（${x.source}）`),
  },
  latest: { version: latest, source },
  node: local.node,
  installCommand: `npm install --global rea-agents@${latest || "latest"}`,
};

if (INSTALL) {
  if (status === "up_to_date") {
    payload.install = { attempted: false, ok: true, skipped: true, reason: "已是最新" };
    if (JSON_OUT) console.log(JSON.stringify(payload, null, 2));
    else console.log(`\n已是最新（${local.active.version}），没有执行安装。`);
    process.exit(0);
  }
  const pin = latest ? `rea-agents@${latest}` : "rea-agents@latest";
  const target = latest || "latest";
  if (!JSON_OUT) console.log(`\n正在安装 rea-agents@${target} …\n`);
  const { ok, cmd } = npmInstall(pin);
  payload.install = { attempted: true, ok, command: cmd };
  if (!JSON_OUT) {
    console.log("");
    if (ok) {
      const after = localState();
      payload.install.after = after.active?.version || null;
      if (after.active) {
        console.log(`安装完成。当前生效版本：${after.active.version}（${after.active.source}）`);
        if (latest && compare(after.active.version, latest) < 0) {
          console.log("注意：生效版本仍低于线上最新版，说明 PATH 里还有另一份旧安装。");
          console.log("跑 node scripts/rea-doctor.mjs 看全部安装位置。");
        }
      } else {
        console.log("安装命令返回成功，但仍未探测到 rea-agents。");
        console.log("通常是 npm 全局前缀不在 PATH 里，跑 node scripts/rea-doctor.mjs 看详情。");
      }
      console.log("");
      console.log("下一步：重启客户端让 MCP 服务器重新拉起；若注册条目还指向旧路径，");
      console.log("用 node scripts/rea-register.mjs --client <名称> --apply --force 重写。");
    } else {
      console.log("安装失败。常见原因：没有写权限、代理拦截、npm 源不可达。");
      console.log("也可以先用 npx -y rea-agents@latest 免安装运行。");
    }
  }
  if (JSON_OUT) console.log(JSON.stringify(payload, null, 2));
  process.exit(payload.install.ok ? 0 : 1);
}

if (JSON_OUT) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

/* ----------------------------------------------------------------- 人类可读 */

const line = () => console.log("─".repeat(58));

line();
console.log("REA 版本核对");
line();

if (!local.installed) {
  console.log("");
  console.log("本机未找到 rea-agents。");
  console.log("");
  console.log("REA 是独立运行时，不随本技能分发。两条路：");
  console.log("");
  console.log(`  A 免安装先试    npx -y rea-agents@${latest || "latest"} <命令>`);
  console.log(`  B 建议长期使用  npm install --global rea-agents@${latest || "latest"}`);
  console.log("");
  console.log("为什么建议 B：用 npx 跑 setup 时，上游会把 MCP 注册写成当时那份");
  console.log("npx 缓存的绝对路径（mcpDoctor 里用的是 resolve(dispatcherPath)）。");
  console.log("缓存被 npm 清理后，客户端启动就找不到入口，工具会静默消失。");
  console.log("全局安装后注册指向稳定的全局路径，不受缓存回收影响。");
  console.log("");
  console.log("需要我装吗？确认后执行：node scripts/rea-update.mjs --install");
  line();
  process.exit(0);
}

console.log("");
console.log(`  本机运行   ${local.active.version}    来源 ${local.active.source}`);
const latestLabel = latest
  ? latest
  : source === "offline"
    ? "跳过（--offline 未联网）"
    : "未知（联网失败）";
console.log(`  线上最新   ${latestLabel}`);
if (latest && source === "cache") console.log(`  缓存时间   24 小时内已核对过，加 --fresh 可强制刷新`);

const otherVersions = local.found.filter((x) => x.version !== local.active.version);
if (otherVersions.length) {
  console.log("");
  console.log("  另有多份安装：");
  for (const x of otherVersions) console.log(`    ${x.version}   ${x.source}   ${x.dir}`);
}

console.log("");
if (status === "up_to_date") {
  console.log("  结论  已是最新，无需动作");
  console.log("");
  line();
  process.exit(0);
}

if (status === "unknown") {
  console.log(
    source === "offline"
      ? "  结论  本机版本已读到，线上核对按 --offline 跳过"
      : "  结论  本机版本已读到，线上版本没查到（网络不可达）",
  );
  console.log("");
  console.log("  这不影响干活。联网后重跑一次即可，或直接执行：");
  console.log(`    ${payload.installCommand}`);
  line();
  process.exit(0);
}

console.log(`  结论  有新版本可用（${distance(local.active.version, latest)}）`);
console.log("");
console.log("  是否更新由你决定，本脚本不会自动装。确认后执行：");
console.log(`    node scripts/rea-update.mjs --install`);
console.log("");
console.log("  或者直接手动：");
console.log(`    ${payload.installCommand}`);
console.log("");
console.log("  更新之后：");
console.log("    1 重启客户端，让 MCP 服务器用新版本重新拉起");
console.log("    2 跑 node scripts/rea-doctor.mjs 确认生效版本已变");
console.log("    3 注册条目若仍指向旧路径，用 rea-register.mjs --apply --force 重写");
console.log("");
console.log(`  不安装也能用新版：npx -y rea-agents@${latest} <命令>`);
line();
