# 连接与任务恢复

仅在观察到连接、命令、审批或分析引擎（provider）阻断时阅读本指南。始终以用户的目标和问题为中心。说明是什么阻断了操作，以及下一项有用的步骤；修复后，继续调查。

下列命令使用已安装的 `rea`。若不可用，在获得获取 REA 的授权时，使用 `SKILL.md` 中的包调用方式。应遵循所连接服务器的 schema 与已安装 CLI 的帮助信息，而不要假定仓库主分支与较旧版本暴露相同的参数。

## 根据观察到的故障选择补救措施

| 观察到的现象                                                    | 含义与下一步                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 活动会话中没有 REA 工具                                         | 用 `rea doctor --client codex --json` 检查注册。仅安装 skill 并不会注册 MCP。                                                                                                                                    |
| 注册缺失、格式错误或过期                                        | 准备一份限定范围的 setup 计划；只应用已授权的变更，并做好备份。                                                                                                                                                  |
| 注册一致，但没有已连接的工具                                    | 重启/重新连接客户端。doctor 检查的是注册；它无法建立当前 agent 的连接。若重新连接失败，检查客户端的启动错误。                                                                                                     |
| `MCP tool call requires approval, but approval policy is never` | Codex 在 REA 执行之前拒绝了该调用。不要通过安装引擎或重复 setup 来解决这一客户端策略决定。参见下文审批一节。                                                                                                     |
| REA 返回 `provider_unavailable` 或某个不可用的工具条目          | 读取该操作的分析引擎（provider）诊断信息，或 `binary_session.result.tool_availability`。只解决该任务所需的前置条件；工具目录完整并不意味着每个操作都可用。                                                        |
| 子 shell 中缺少 `rea`，或 Node 不兼容                           | 检查实际的 shell PATH 与启动器/运行时。前缀安装可能不在登录 shell 的 PATH 中；这并不能证明 MCP 注册已损坏。                                                                                                      |

若客户端无法启动其 shell/沙箱辅助程序，或无法读取已安装的 skill，请检查其启动诊断信息。例如，当 `CODEX_HOME` 位于 `/tmp` 之下时，Codex 可能拒绝辅助程序别名；请使用操作系统临时目录之外的已授权 profile。REA setup 无法修复客户端的执行器。请保留沙箱，而不要为了跑通一条分析命令而静默禁用它。

静态 JavaScript 与普通 ZIP 清点既不需要 Hopper 也不需要 Ghidra。HAR 检查是离线的，不需要活动浏览器。原生反编译、Android 分析与固件提取各有其自带的前置条件。当受支持的清点/静态证据能回答部分问题时，就使用它，并单独指明不可用的证据。不要替换为另一个目标。将来自普通 shell 工具的观察结果如实标注；只有实际的 REA 输出才构成 REA 证据。

## 在需要时修复注册

对于 Codex：

```bash
rea doctor --client codex --json
rea setup --client codex --dry-run --json
```

使用当前受支持客户端的 ID：`claude_code`、`claude_desktop`、`codex`、`cursor`、`gemini_cli`、`windsurf`、`devin`、`opencode`、`antigravity`、`copilot_cli`、`commandcode`、`qwen_code`、`vscode`、`grok_build`、`omp`、`pi`、`hermes` 或 `grok_bot`。若不确定，在选择范围之前先检查 `doctor --json`。`grok_bot` 使用聊天注册步骤，而不是本地 `mcp.json`。对于不受支持的客户端，使用固定版本的手动 stdio 注册或 CLI。

展示该计划的确切路径、备份、变更以及捆绑 skill 的替换。当该具体范围尚未获得授权时，先取得写入审批，然后用 `rea setup --client codex --yes` 应用同一范围。仅在单独需要且已明确批准时，才添加 `--install-hopper`。不要安装或升级无关的前置条件。重启/重新连接，确认工具确实出现，并恢复原任务。若工具仍然缺失，检查启动失败原因，而不是反复执行 setup。

## Codex 工具审批独立于 REA 就绪状态

REA 工具没有权限授予握手流程。Codex 仍可能要求审批，因为某项操作会创建归属资源、启动辅助程序或产生清理影响。已通告的工具或成功的 doctor 结果不会覆盖该客户端策略。仅 `workspace-write` 不能解决 MCP 审批拒绝，且 `approval_policy = "never"` 并不意味着每个 MCP 工具都已预先批准。

当交互式审批可用时，对所需操作使用客户端的审批流程。在无人值守运行中，若执行环境允许，则通过已授权的 CLI 工作流继续；否则报告被阻断的操作以及继续所需的审批。不要重试同一个被拒绝的调用，不要静默扩大审批范围，也不要把 MCP 的作用改写为只读。

对于明确希望在一次性的 Codex profile 中预先批准具名操作的操作者，当前 Codex 支持按工具配置。例如，打开与关闭分析会话可以独立限定范围：

```toml
[mcp_servers.rea.tools.open_binary]
approval_mode = "approve"

[mcp_servers.rea.tools.close_binary]
approval_mode = "approve"
```

使用实际的服务器 ID，并且只包含其作用已获批准的操作；本示例并不批准检查、提取或运行时执行。在写入之前，展示拟议的配置修改，并保留无关条目与备份。托管策略可能约束客户端设置。有关已安装客户端支持的设置，请查阅 [Codex 配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)。这是一个可选的恢复选择，而不是每个 REA 任务的前置条件。

## 通过已安装的 CLI 继续

仅在启动器失败时才检查命令环境：

```bash
command -v rea
command -v node
node --version
rea --version
```

当子 shell 丢失前缀安装时，使用位于已知安装路径的公共启动器，并配合 PATH 上受支持的现有 Node。避免使用内部 `dist/cli.js` 入口，或更改全局工具链。即使某个 shell 无法解析 `rea`，MCP 也可能拥有自己有效的启动器。

对于用户提供的 JavaScript 目录树或 ASAR，在已授权的工作区中选择输出文件，并在读取视图之前保存完整的证据：

```bash
rea analyze-javascript-application /absolute/path/to/app --json > app-evidence.json
jq -c '{source: {kind: "inline", evidence: .}, view: {kind: "summary"}}' app-evidence.json > app-view.json
rea inspect-analysis-view app-view.json
```

这些命令不会注册 MCP，也不会安装分析引擎。CLI 的 JavaScript JSON 是完整的，且可能非常大；应将其重定向到文件，而不是加载到上下文中。若 `jq` 不存在，使用现有的 JSON 处理器，而不要仅为这一操作流程安装一个。使用同一内联来源与 [JavaScript 配方](javascript-applications.md) 检查模块页面或条目。保留图覆盖范围、局限与未知项。原生 CLI 分析仍需要其选定的引擎，且所有 CLI 操作都保留主机的执行权限。
