#!/usr/bin/env node
/**
 * rea-doctor.mjs — REA 环境体检（中文报告）
 *
 * 用法：
 *   node scripts/rea-doctor.mjs           人类可读报告
 *   node scripts/rea-doctor.mjs --json    机器可读，便于代理接手
 *
 * 只读。不安装、不写配置、不启动任何分析引擎。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const JSON_OUT = process.argv.includes("--json");
const HOME = os.homedir();
const IS_WIN = process.platform === "win32";

const report = {
  node: {},
  rea: { found: [], active: null },
  providers: {},
  clients: [],
  blockers: [],
  hints: [],
};

/* ------------------------------------------------------------------ helpers */

function run(file, args) {
  try {
    return execFileSync(file, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 15000,
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
}

// Windows 上 execFileSync 无法直接执行 .cmd / .bat 外壳脚本（会抛 EINVAL），
// 必须过一层 cmd.exe。否则 npm root -g 与 rea --version 都会静默失败，
// 表现为「全局安装看不见、版本号显示未知」。
function runShell(bin, args) {
  if (!IS_WIN) return run(bin, args);
  const quoted = [bin, ...args]
    .map((a) => (/\s/.test(a) ? `"${a}"` : a))
    .join(" ");
  return run("cmd.exe", ["/d", "/c", quoted]);
}

function which(bin) {
  return run(IS_WIN ? "where" : "which", [bin]);
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readPkgVersion(dir) {
  const pkg = readJson(path.join(dir, "package.json"));
  return pkg && pkg.name === "rea-agents" ? pkg.version : null;
}

// 从入口脚本往上找 package.json，判断这条注册到底指向哪个版本。
function pkgVersionForScript(script) {
  let dir = path.dirname(script);
  for (let i = 0; i < 4; i += 1) {
    const ver = readPkgVersion(dir);
    if (ver) return ver;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

/* --------------------------------------------------------------------- node */

const nodeVer = process.versions.node;
const [major, minor] = nodeVer.split(".").map(Number);
const nodeOk =
  (major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26;
const nodeForbidden = major === 23 || major === 25;

report.node = {
  version: nodeVer,
  ok: nodeOk,
  forbidden: nodeForbidden,
  hint: nodeOk
    ? null
    : nodeForbidden
      ? `Node ${major} 是不受支持的分支，请换到 22.19+ 或 24.11+`
      : "需要 Node 22.19+、24.11+ 或 26+",
};
if (!nodeOk) report.blockers.push("Node 版本不满足 REA 要求");

/* ---------------------------------------------------------------------- rea */

function scanNpxCaches() {
  const roots = [
    path.join(HOME, "AppData", "Local", "npm-cache", "_npx"),
    path.join(HOME, ".npm", "_npx"),
  ];
  const out = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    let entries = [];
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const dir = path.join(root, e.name, "node_modules", "rea-agents");
      const ver = existsSync(dir) ? readPkgVersion(dir) : null;
      if (ver) out.push({ source: "npx 缓存", version: ver, dir });
    }
  }
  return out;
}

function scanGlobalRoots() {
  const out = [];
  const roots = new Set();
  const npmRoot = runShell(IS_WIN ? "npm.cmd" : "npm", ["root", "-g"]);
  if (npmRoot && existsSync(npmRoot)) roots.add(npmRoot);
  if (IS_WIN) {
    roots.add(path.join(HOME, "AppData", "Roaming", "npm", "node_modules"));
    const pf = process.env.ProgramFiles;
    if (pf) roots.add(path.join(pf, "nodejs", "node_modules"));
  } else {
    roots.add("/usr/local/lib/node_modules");
    roots.add("/usr/lib/node_modules");
  }
  for (const root of roots) {
    const dir = path.join(root, "rea-agents");
    const ver = existsSync(dir) ? readPkgVersion(dir) : null;
    if (ver) out.push({ source: "全局安装", version: ver, dir });
  }
  return out;
}

const onPath = which("rea");
if (onPath) {
  const ver = runShell("rea", ["--version"]);
  report.rea.found.push({
    source: "PATH",
    version: (ver || "").replace(/[^\d.]/g, "") || "未知",
    dir: onPath.split(/\r?\n/)[0],
  });
}
report.rea.found.push(...scanGlobalRoots());
report.rea.found.push(...scanNpxCaches());

// PATH 命中的往往就是全局安装本身，同版本时不再重复列一遍
const pathEntry = report.rea.found.find((x) => x.source === "PATH");
if (pathEntry && pathEntry.version !== "未知") {
  const deduped = [];
  for (const x of report.rea.found) {
    if (x.source === "全局安装" && x.version === pathEntry.version) continue;
    deduped.push(x);
  }
  report.rea.found = deduped;
}

if (report.rea.found.length === 0) {
  report.blockers.push("没有找到 rea-agents，MCP 与命令行都无法使用");
  report.hints.push(
    "安装：npm install --global rea-agents@latest，或用 npx -y rea-agents@latest 临时运行",
  );
} else {
  // 优先 PATH，其次全局，最后缓存
  const order = { PATH: 0, 全局安装: 1, "npx 缓存": 2 };
  report.rea.found.sort(
    (a, b) => (order[a.source] ?? 9) - (order[b.source] ?? 9),
  );
  report.rea.active = report.rea.found[0];
  if (!onPath) {
    report.hints.push(
      "rea 不在 PATH 里，终端无法直接敲 rea；用全局安装或始终走 npx",
    );
  }
  const latest = report.rea.found
    .map((x) => x.version)
    .sort(cmpVer)
    .pop();
  const newest = report.rea.found.find((x) => x.version === latest);
  if (newest && newest !== report.rea.active) {
    report.hints.push(
      `本机存在更新的 ${latest}（${newest.source}），当前生效的是 ${report.rea.active.version}`,
    );
  }
}

function cmpVer(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/* ---------------------------------------------------------------- providers */

const ghidraDir = process.env.GHIDRA_INSTALL_DIR;
const javaHome = process.env.JAVA_HOME;
const hopperLauncher = process.env.HOPPER_LAUNCHER_PATH;
const jadxJar = process.env.REA_JADX_MCP_JAR;

function headlessIn(dir) {
  if (!dir || !existsSync(dir)) return false;
  return ["analyzeHeadless", "analyzeHeadless.bat"].some((f) =>
    existsSync(path.join(dir, "support", f)),
  );
}

report.providers = {
  ghidra: {
    env: ghidraDir || null,
    usable: headlessIn(ghidraDir),
    note: ghidraDir
      ? headlessIn(ghidraDir)
        ? "已配置"
        : "GHIDRA_INSTALL_DIR 指向的目录里没有 support/analyzeHeadless"
      : "未配置，Windows 上为实验性只读档位",
  },
  java: {
    env: javaHome || null,
    usable: Boolean(javaHome && existsSync(javaHome)) || Boolean(which("javac")),
    note: "Ghidra 12.1 需要 JDK 21+；JADX 需要 JDK 17+ 与 jdk.compiler",
  },
  hopper: {
    env: hopperLauncher || null,
    usable: IS_WIN
      ? false
      : Boolean(hopperLauncher && existsSync(hopperLauncher)) ||
        Boolean(which("Hopper")),
    note: IS_WIN ? "Windows 不支持 Hopper" : "macOS/Linux 可用",
  },
  jadx: {
    env: jadxJar || null,
    usable: Boolean(jadxJar && existsSync(jadxJar)),
    note: "需要无界面 JADX MCP JAR 0.7.1 与 JDK 17+",
  },
  binwalk: { usable: Boolean(which("binwalk")), note: "固件解包，限 Linux 宿主" },
  adb: { usable: Boolean(which("adb")), note: "Android 设备操作需要 adb" },
};

if (!report.providers.ghidra.usable && !report.providers.hopper.usable) {
  report.hints.push(
    "没有可用的原生分析引擎：原生反编译会不可用，但静态 JavaScript、ZIP 清点与离线 ELF 体检不受影响",
  );
}

/* ------------------------------------------------------------------ clients */

const CLIENT_TARGETS = [
  { name: "WorkBuddy", file: path.join(HOME, ".workbuddy", "mcp.json") },
  { name: "Cursor", file: path.join(HOME, ".cursor", "mcp.json") },
  { name: "Claude Code", file: path.join(HOME, ".claude.json") },
  {
    name: "Claude Desktop",
    file: IS_WIN
      ? path.join(HOME, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
      : path.join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
  },
];

for (const t of CLIENT_TARGETS) {
  if (!existsSync(t.file)) {
    report.clients.push({ name: t.name, file: t.file, state: "未安装或未使用" });
    continue;
  }
  const cfg = readJson(t.file);
  if (!cfg) {
    report.clients.push({ name: t.name, file: t.file, state: "配置文件无法解析" });
    continue;
  }
  const servers = cfg.mcpServers || {};
  const key = Object.keys(servers).find((k) => k === "rea");
  const entry = key ? servers[key] : null;
  const script =
    entry && Array.isArray(entry.args)
      ? entry.args.find((a) => typeof a === "string" && /\.(?:mjs|cjs|js)$/i.test(a))
      : null;
  const entryExists = script ? existsSync(script) : null;
  report.clients.push({
    name: t.name,
    file: t.file,
    state: key ? "已注册 rea" : "未注册 rea",
    command: entry ? entry.command : null,
    args: entry ? entry.args : null,
    script,
    entryExists,
    entryVersion: script && entryExists ? pkgVersionForScript(script) : null,
  });
}

if (!report.clients.some((c) => c.state === "已注册 rea")) {
  report.hints.push(
    "没有任何客户端注册了 REA。WorkBuddy 用 npx -y rea-agents@latest setup --client workbuddy，或跑本技能 scripts/rea-register.mjs --client workbuddy",
  );
}

// 注册过期是最高频的「工具突然消失」原因：入口写的是绝对路径，
// npx 缓存被回收或版本升级后，这条路径就指向旧版本或干脆不存在。
const activeVer = report.rea.active?.version || null;
const brokenEntry = report.clients.filter(
  (c) => c.state === "已注册 rea" && c.entryExists === false,
);
if (brokenEntry.length) {
  report.hints.push(
    `${brokenEntry.map((c) => c.name).join("、")} 的注册指向的入口已不存在（多为 npx 缓存被回收），需重写：node scripts/rea-register.mjs --client <名称> --apply --force`,
  );
}
const staleEntry = report.clients.filter(
  (c) =>
    c.state === "已注册 rea" &&
    c.entryVersion &&
    activeVer &&
    c.entryVersion !== activeVer,
);
if (staleEntry.length) {
  report.hints.push(
    `${staleEntry.map((c) => `${c.name}（${c.entryVersion}）`).join("、")} 的注册版本与当前生效的 ${activeVer} 不一致，客户端会继续用旧版：node scripts/rea-register.mjs --client <名称> --apply --force`,
  );
}

/* -------------------------------------------------------------------- print */

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.blockers.length ? 1 : 0);
}

const ok = (b) => (b ? "✓" : "✗");
const lines = [];
lines.push("");
lines.push("REA 环境体检");
lines.push("=".repeat(52));
lines.push("");
lines.push(`Node.js  ${report.node.version}  ${ok(report.node.ok)}`);
if (!report.node.ok) lines.push(`         ${report.node.hint}`);
lines.push("");

lines.push("REA 安装");
if (report.rea.found.length === 0) {
  lines.push("  ✗ 没有找到 rea-agents");
} else {
  for (const f of report.rea.found) {
    const mark = f === report.rea.active ? "→" : " ";
    lines.push(`  ${mark} ${f.version.padEnd(8)} ${f.source}`);
    lines.push(`    ${f.dir}`);
  }
}
lines.push("");

lines.push("分析引擎");
const prov = report.providers;
lines.push(`  ${ok(prov.ghidra.usable)} Ghidra    ${prov.ghidra.note}`);
if (prov.ghidra.env) lines.push(`             GHIDRA_INSTALL_DIR=${prov.ghidra.env}`);
lines.push(`  ${ok(prov.java.usable)} Java      ${prov.java.note}`);
if (prov.java.env) lines.push(`             JAVA_HOME=${prov.java.env}`);
lines.push(`  ${ok(prov.hopper.usable)} Hopper    ${prov.hopper.note}`);
lines.push(`  ${ok(prov.jadx.usable)} JADX      ${prov.jadx.note}`);
lines.push(`  ${ok(prov.binwalk.usable)} Binwalk   固件解包，限 Linux 宿主`);
lines.push(`  ${ok(prov.adb.usable)} adb       Android 设备操作`);
lines.push("");

lines.push("客户端注册");
for (const c of report.clients) {
  let suffix = "";
  if (c.state === "已注册 rea") {
    if (c.entryExists === false) suffix = "   入口已不存在";
    else if (c.entryVersion) suffix = `   入口 ${c.entryVersion}`;
  }
  lines.push(`  ${ok(c.state === "已注册 rea")} ${c.name.padEnd(14)} ${c.state}${suffix}`);
  if (c.state === "已注册 rea") lines.push(`    ${c.file}`);
}
lines.push("");

if (report.hints.length) {
  lines.push("建议");
  for (const h of report.hints) lines.push(`  · ${h}`);
  lines.push("");
}
if (report.blockers.length) {
  lines.push("必须先解决的问题");
  for (const b of report.blockers) lines.push(`  ! ${b}`);
  lines.push("");
}

lines.push("-".repeat(52));
lines.push(
  report.blockers.length
    ? "结论：还差关键条件，按下面对症处理"
    : "结论：环境可用，可以直接分析目标",
);
console.log(lines.join("\n"));
process.exit(report.blockers.length ? 1 : 0);
