#!/usr/bin/env node
/**
 * rea-register.mjs — 把 REA 注册为 MCP 服务器
 *
 * 默认只打印计划，不落盘。确认后加 --apply 才写文件，并自动备份。
 *
 * 用法：
 *   node scripts/rea-register.mjs --client workbuddy
 *   node scripts/rea-register.mjs --client workbuddy --apply
 *   node scripts/rea-register.mjs --client cursor --apply --force
 *   node scripts/rea-register.mjs --client claude-code --apply
 *
 * 选项：
 *   --client <id>    workbuddy | cursor | claude-desktop | claude-code
 *   --apply          真正写入；不加则只出计划
 *   --force          覆盖已存在的 rea 条目
 *   --version <v>    没有本地安装时钉死的版本，默认 6.5.0
 *   --config <path>  自定义配置文件路径；给 claude-code 时改为直接改文件，绕过 claude CLI
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const IS_WIN = process.platform === "win32";
const HOME = os.homedir();

/* -------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const has = (name) => argv.includes(name);

const client = flag("--client");
const apply = has("--apply");
const force = has("--force");
const pin = flag("--version") || "6.5.0";
const configOverride = flag("--config");

const CLIENTS = {
  workbuddy: { label: "WorkBuddy", file: path.join(HOME, ".workbuddy", "mcp.json") },
  cursor: { label: "Cursor", file: path.join(HOME, ".cursor", "mcp.json") },
  "claude-desktop": {
    label: "Claude Desktop",
    file: IS_WIN
      ? path.join(HOME, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
      : path.join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
  },
  "claude-code": { label: "Claude Code", file: null },
};

if (!client || !CLIENTS[client]) {
  console.error("用法：node scripts/rea-register.mjs --client <workbuddy|cursor|claude-desktop|claude-code> [--apply]");
  process.exit(2);
}

/* ------------------------------------------------------------- find install */

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function versionOf(dir) {
  const pkg = readJson(path.join(dir, "package.json"));
  return pkg && pkg.name === "rea-agents" ? pkg.version : null;
}

// Windows 上 execFileSync 不能直接执行 npm.cmd（EINVAL），必须过一层 cmd.exe。
function npmRootGlobal() {
  try {
    const out = IS_WIN
      ? execFileSync("cmd.exe", ["/d", "/c", "npm root -g"], {
          encoding: "utf8",
          timeout: 15000,
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
        })
      : execFileSync("npm", ["root", "-g"], {
          encoding: "utf8",
          timeout: 15000,
          stdio: ["ignore", "pipe", "ignore"],
        });
    const line = String(out)
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .pop();
    return line && existsSync(line) ? line : null;
  } catch {
    return null;
  }
}

function candidateDirs() {
  const dirs = [];
  // 先问 npm 真实的全局根：前缀可能被改到自定义目录（本机就是 managed node），
  // 只猜 Roaming/Program Files 会漏掉这种情况。
  for (const root of [npmRootGlobal()].filter(Boolean)) {
    dirs.push(path.join(root, "rea-agents"));
  }
  const globals = IS_WIN
    ? [
        path.join(HOME, "AppData", "Roaming", "npm", "node_modules", "rea-agents"),
        path.join(process.env.ProgramFiles || "C:\\Program Files", "nodejs", "node_modules", "rea-agents"),
      ]
    : ["/usr/local/lib/node_modules/rea-agents", "/usr/lib/node_modules/rea-agents"];
  for (const d of globals) if (existsSync(d)) dirs.push(d);

  for (const root of [
    path.join(HOME, "AppData", "Local", "npm-cache", "_npx"),
    path.join(HOME, ".npm", "_npx"),
  ]) {
    if (!existsSync(root)) continue;
    for (const e of readdirSync(root, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const d = path.join(root, e.name, "node_modules", "rea-agents");
      if (existsSync(d)) dirs.push(d);
    }
  }
  return [...new Set(dirs)].filter((d) => existsSync(path.join(d, "scripts", "rea.mjs")));
}

const all = candidateDirs();
// npx 缓存目录会被 npm 清理，不能作为持久注册目标；只认真正的全局安装。
const globalsOnly = all.filter((d) => !d.includes(`${path.sep}_npx${path.sep}`));
const local = globalsOnly
  .map((dir) => ({ dir, version: versionOf(dir) }))
  .sort((a, b) => String(b.version).localeCompare(String(a.version), undefined, { numeric: true }))[0];

let entry;
if (local) {
  // 全局安装：直接用 node 跑入口脚本，不依赖客户端的 PATH
  entry = { command: process.execPath, args: [path.join(local.dir, "scripts", "rea.mjs"), "mcp"] };
} else if (IS_WIN) {
  entry = { command: "cmd.exe", args: ["/d", "/c", "npx", "-y", `rea-agents@${pin}`, "mcp"] };
} else {
  entry = { command: "npx", args: ["-y", `rea-agents@${pin}`, "mcp"] };
}

/* -------------------------------------------------------------------- plan */

const target = configOverride || CLIENTS[client].file;
const lines = [];
lines.push("");
lines.push(`注册目标  ${CLIENTS[client].label}`);
lines.push(`配置文件  ${target || "（由 claude mcp add 管理，不直接改文件）"}`);
lines.push(
  `入口      ${local ? `本地安装 ${local.version}` : `npx 钉死 ${pin}`}`,
);
lines.push("");
lines.push("拟写入的条目：");
lines.push(
  JSON.stringify({ mcpServers: { rea: entry } }, null, 2)
    .split("\n")
    .map((l) => "  " + l)
    .join("\n"),
);

/* ------------------------------------------------------------ claude code */

if (client === "claude-code" && !configOverride) {
  const args = ["mcp", "add", "--scope", "user", "rea", "--", entry.command, ...entry.args];
  const shown = ["claude", ...args]
    .map((a) => (/\s/.test(a) ? JSON.stringify(a) : a))
    .join(" ");
  console.log(lines.join("\n"));
  console.log("");
  console.log("将执行：");
  console.log("  " + shown);
  if (!apply) {
    console.log("");
    console.log("这是计划。确认后加 --apply 执行。");
    process.exit(0);
  }
  try {
    execFileSync(IS_WIN ? "claude.cmd" : "claude", args, { stdio: "inherit" });
    console.log("\n已注册。重启客户端后生效。");
  } catch (e) {
    console.error("\n执行失败：claude CLI 不可用或拒绝执行。");
    console.error("可以改用 npx -y rea-agents@latest setup --client claude_code");
    process.exit(1);
  }
  process.exit(0);
}

/* --------------------------------------------------------------- file edit */

let cfg = {};
if (target && existsSync(target)) {
  cfg = readJson(target);
  if (!cfg || typeof cfg !== "object") {
    console.error(`\n配置文件无法解析，已中止，未做任何修改：\n  ${target}`);
    process.exit(1);
  }
}

cfg.mcpServers = cfg.mcpServers || {};
const existing = cfg.mcpServers.rea;

if (existing) {
  const same = JSON.stringify(existing) === JSON.stringify(entry);
  if (!same && !force) {
    console.log(lines.join("\n"));
    console.log("");
    console.log("已存在不同的 rea 条目：");
    console.log("  " + JSON.stringify(existing));
    console.log("");
    console.log("不改动。确实要覆盖请加 --force。");
    process.exit(1);
  }
  if (same) {
    console.log(lines.join("\n"));
    console.log("");
    console.log("当前条目与计划一致，无需改动。");
    process.exit(0);
  }
}

if (!apply) {
  console.log(lines.join("\n"));
  console.log("");
  console.log(
    existing
      ? "这是计划（将覆盖现有 rea 条目）。确认后加 --apply --force 执行。"
      : "这是计划。确认后加 --apply 执行。",
  );
  process.exit(0);
}

/* -------------------------------------------------------------- write+backup */

console.log(lines.join("\n"));
console.log("");

cfg.mcpServers.rea = entry;

if (target && existsSync(target)) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  const backup = `${target}.rea-backup-${stamp}`;
  copyFileSync(target, backup);
  console.log(`已备份  ${backup}`);
}

if (target) mkdirSync(path.dirname(target), { recursive: true });
const tmp = `${target}.tmp-${process.pid}`;
writeFileSync(tmp, JSON.stringify(cfg, null, 2) + "\n", "utf8");
renameSync(tmp, target);

console.log(`已写入  ${target}`);
console.log("重启客户端后，检查工具是否出现。");
if (client === "workbuddy") {
  console.log("若工具仍未出现，重启会话；仍不行则看客户端启动日志，不要重复注册。");
}
