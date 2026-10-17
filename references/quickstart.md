# 快速上手：安装、接入与排障

本技能只提供说明书。REA 本体、MCP 注册、分析引擎是三件独立的事，按顺序做
完才算能干活。

## 0. 先看环境够不够

| 项目 | 要求 |
| --- | --- |
| Node.js | 22.x（≥22.19）或 24.x（≥24.11）或 26+。**23、25 与预发布版不支持** |
| npm | 随 Node 自带即可 |
| 分析引擎 | 可选。纯静态 JavaScript 与 ZIP 清点不需要任何引擎 |

REA 从不自动升级 Node.js、npm、Homebrew、Java 或任何引擎。缺什么它会报错，
不会替你装。

一条命令看清现状：

```bash
node scripts/rea-doctor.mjs
```

它会检查 Node 版本、`rea` 是否可达、实际版本、已配置的引擎、以及各客户端
配置里有没有 REA 的注册，并给出中文修法。

## 1. 安装 REA

三条路，按需选一条。

**引导式（推荐，会顺带注册客户端与安装捆绑技能）**

```bash
npx rea-agents@latest setup
```

**全局安装（推荐长期使用，也是注册最稳的前置）**

```bash
npm install --global rea-agents
```

不加 `--global` 只会装进当前项目的 `node_modules/.bin`，`rea` 不会进 PATH。

为什么长期使用建议全局装，而不是每次 `npx`：上游 `setup` 写注册时用的是
**当时那份入口脚本的绝对路径**（`mcpDoctor` 里是 `resolve(dispatcherPath)`）。
走 `npx` 就会把 npx 缓存目录写进配置，缓存被回收后客户端找不到入口，工具
静默消失。全局安装的路径稳定，不受影响。

**Bun**

```bash
bunx rea-agents@latest setup
```

**只想先用一次、不落盘**

```bash
npx -y rea-agents@latest analyze ./some-app --json
```

## 2. 接入客户端

### WorkBuddy

rea-agents **6.5.0 及以上**原生支持 WorkBuddy。先全局安装再 `setup`，注册路径
才稳定：

```bash
npm install --global rea-agents@latest
rea setup --client workbuddy
```

也可以直接 `npx -y rea-agents@latest setup --client workbuddy`，注册会成功，
但按上一节说的原因，写进去的是 npx 缓存路径，属于会过期的那种注册。要么先
全局安装，要么改用本技能自带、能写「每次自解析」形态的注册助手。

注册后工具通常以 `mcp__rea__` 为前缀出现，例如 `mcp__rea__open_binary`。具体
前缀以实际工具列表为准。注册完成后重启会话，让客户端重新拉取工具列表。

老版本（6.4.x 及以下）不认识 `workbuddy` 这个客户端标识，会报未知客户端。
遇到这种情况先升级：

```bash
npm install --global rea-agents@latest
```

### Claude Code

```bash
npx rea-agents@latest setup --client claude_code
```

或手动注册到 local scope（Windows 原生需用 `cmd.exe /d /c` 包装 `npx`）：

```powershell
claude mcp add --scope local rea -- cmd.exe /d /c npx -y rea-agents@6.5.0 mcp
```

不要用 `--scope project`，那会把 `.mcp.json` 写进仓库，容易误提交。

### Cursor

```bash
npx rea-agents@latest setup --client cursor
```

### 手动写配置

任何支持 stdio MCP 的客户端都能用这个形态。持久注册请钉死一个确切版本：

```json
{
  "mcpServers": {
    "rea": {
      "command": "npx",
      "args": ["-y", "rea-agents@6.5.0", "mcp"]
    }
  }
}
```

Windows 上如果客户端起不来命令 shim，把 `command` 换成
`cmd.exe`，`args` 改成 `["/d", "/c", "npx", "-y", "rea-agents@6.5.0", "mcp"]`。

本技能附带一个写配置的助手，默认只出计划、不落盘：

```bash
node scripts/rea-register.mjs --client workbuddy
```

确认计划无误后再加 `--apply`，它会先备份原文件再合并 `rea` 条目，不动其他
服务器。几个要点：

- **找到全局安装就写全局入口的绝对路径**，不依赖客户端的 `PATH`；找不到才退回
  钉死版本的 `npx`。全局根是问 `npm root -g` 得到的，所以自定义前缀也能认。
- 已存在不同的 `rea` 条目时**默认拒绝改动**，确认要覆盖才加 `--force`。
- Claude Code 默认走 `claude mcp add`；不想用 CLI 或没有 CLI 时，用
  `--client claude-code --config ~/.claude.json --apply --force` 直接改文件。
- 改完重启客户端。若工具仍不出现，先跑体检看「入口」那一行，别重复注册。

### 受支持的客户端标识

`claude_code`、`claude_desktop`、`codex`、`cursor`、`gemini_cli`、`windsurf`、
`devin`、`opencode`、`antigravity`、`copilot_cli`、`commandcode`、`qwen_code`、
`vscode`、`grok_build`、`omp`、`pi`、`hermes`、`qoder`、`droid`、`trae`、
`workbuddy`、`zcode`、`dsh`。

其中 `droid`、`dsh`、`kimi`、`qoder`、`trae`、`workbuddy`、`zcode` 需要
rea-agents 6.5.0 以上。`grok_bot` 走聊天侧托管连接器，不写本地 `mcp.json`。

## 3. 确认真的通了

```bash
rea doctor --json
rea doctor --client workbuddy --json
rea doctor --skill --json
rea providers --json
```

`doctor` 只验证**注册**是否正确，不能证明当前会话真的连上了。工具仍不出现
时，看客户端的启动错误，而不是反复跑 `setup`。

## Windows 实战

1. **用 PowerShell，不要用 cmd** 设环境变量：

   ```powershell
   $env:GHIDRA_INSTALL_DIR = "C:\tools\ghidra_12.1.4_PUBLIC"
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
   rea doctor --json
   ```

2. **注册要包一层 `cmd.exe /d /c`**，否则客户端可能找不到 `npx` 的 shim。

3. **Hopper 在 Windows 上不可用**，`setup` 也不会尝试安装它。

4. **Ghidra 的 Windows 支持是实验性只读档位（P0）**，只认 PE 应用与 DLL，
   限于固定本地 NTFS 卷，且不能改数据库。

5. **Claude Desktop 在审批前要完全退出**，否则注册会被运行中的进程覆盖。

## 版本与更新

```bash
node scripts/rea-update.mjs            # 只读核对，带 24 小时缓存
node scripts/rea-update.mjs --fresh    # 忽略缓存，强制联网
node scripts/rea-update.mjs --json     # 给代理判断用
node scripts/rea-update.mjs --offline  # 断网环境只看本机
node scripts/rea-update.mjs --install  # 用户同意之后才用
```

三种结论：

| 结论 | 含义 | 下一步 |
| --- | --- | --- |
| 已是最新 | 本机生效版本不低于线上 | 无动作 |
| 有新版本 | 附落后幅度与升级命令 | 问用户，同意后 `--install` |
| 未知 | 联网失败，版本没查到 | 不影响干活，联网后重跑 |

**它不会自动安装。** 技能没有后台常驻进程，所谓「提示更新」指的是**每次使用
技能时核对一次**：有新版就在对话里问一句，装不装由人决定。`--install` 只是
把 `npm install --global` 跑出来，仍然要人先点头。

**和 `rea update` 的分工**：`rea update` 更新当前这份 REA 安装并校验发布包；
本脚本只负责「发现版本 + 提示 + 可选地调用 npm」，不碰引擎、不改配置、不
动数据目录。

## 常见故障对症表

| 现象 | 真正的原因 | 怎么处理 |
| --- | --- | --- |
| 会话里根本没有 REA 工具 | 只装了技能，没注册 MCP | 跑第 2 步的注册命令 |
| 注册在，工具不来 | 注册过期或客户端没重启 | 重启客户端；看启动日志 |
| 版本对不上、参数报错 | 装的版本比文档旧 | `node scripts/rea-update.mjs` 看差多少，再 `rea update` 或换钉死版本的 `npx` |
| 注册过一阵子后工具突然没了 | 注册指向 npx 缓存，缓存被回收 | 全局安装后重跑 `setup`，或用 `rea-register.mjs --apply --force` 重写。体检的「客户端注册」会直接标出「入口已不存在」或「入口 6.4.0」这类过期信号 |
| `provider_unavailable` | 引擎没装或路径没配 | 看 [分析引擎配置](providers.md) |
| 某次调用被客户端拦下 | 客户端审批策略，不是 REA 的问题 | 用客户端的审批流程，别重装引擎 |
| 子 shell 里找不到 `rea` | PATH 里没有前缀安装目录 | 用绝对路径调用，或 `npx` 顶替 |

更系统的判断见 [连接与排障](connection-and-recovery.md)。

## 回滚与卸载

```bash
npm install --global rea-agents@6.4.0   # 退回旧版
rea uninstall                            # 移除 REA 写入的配置与技能
rea uninstall --purge-data               # 连同 ~/.rea 下的缓存与状态
```

`uninstall` 不会碰 Hopper、Node.js、证据文件、抓取数据、无关技能与其他 MCP
服务器。
