---
name: rea-reverse-engineering-anything-zh
display_name: REA逆向工程-中文版
display_name_en: REA Reverse Engineering Anything
version: 1.0.0
category: development
author: 令狐杨过 JW（中国区中文版封装与维护）；原作 morluto（MIT 许可）
license: MIT
compatibility: 需要 Node.js 22.19 及以上或 24.11 及以上，不支持 23 与 25。原生反编译需自备 Hopper、Ghidra 或 IDA；Android 需自备 JADX 与 JDK 17 及以上；固件解包需 Binwalk 或 Unblob。纯静态 JavaScript 分析与 ZIP 清点不需要任何分析引擎。
description: 面向中文用户的 REA 逆向工程技能，利用Agent对任何内容进行逆向工程，从应用程序行为到原生二进制文件。让 AI 代理拆解已经发布的二进制文件、安装包、Electron 与 JavaScript 应用、Android APK、.NET 程序集、固件镜像与网页运行时，回答「这个功能究竟是怎么实现的」。触发场景包括逆向分析、逆向工程、反编译、反汇编、脱壳、混淆还原、二进制分析、看清某个 App 的功能实现、比较两个版本的行为差异、分析 APK 或 IPA 或 EXE 或 DLL 或 ELF 或 ASAR 或固件包、用 Ghidra 或 IDA 或 Hopper 或 JADX 做分析、抓取页面运行时行为并与静态证据对照。每一条结论都区分观测、推断与未知，并给出可引用的证据 ID。不适用于已有完整源码仓库的普通架构分析。
description_zh: 用 AI 代理做逆向工程，利用Agent代理对任何内容进行逆向工程，从应用程序行为到原生二进制文件。REA 官方中文版本，全中文环境适配，中文环境代理Agent适配，每次使用前核对版本并提示是否更新，持续维护。给它一个 exe、apk 或 asar，让 AI 说清楚这个功能是怎么实现的——并且告诉你哪部分是猜的。然后你可以让它复刻一个一模一样的出来。一条命令接通二进制、APK、Electron、固件与网页运行时。回答某个功能是怎么实现的，给出可引用证据并标明局限，结论区分观测、推断与未知。全中文文档，含 155 条命令索引、引擎配置与 Windows 实战说明。价值：一杯奶茶钱，带回一个真正意义上的数字员工，而且这个员工以一顶百（一个同类型的人类程序员2W起）。
description_en: Reverse engineer shipped binaries, APKs, Electron and JavaScript apps, firmware and browser runtimes with an agent. Explains how a feature works, cites evidence, and keeps observations, inferences and unknowns separate. Fully localized Chinese documentation with command index, provider setup and self-check scripts.
---

# REA 逆向工程（官方中文版） Reverse Engineering Anything

用 REA 处理那些「结论必须落在已发布产物上」的问题。判断标准很简单——
当答案需要来自二进制、安装包、反编译结果、被动运行时证据，或者需要与
源码无法证实的行为做对照时，就该用 REA。

反过来，如果手上就是一个完整源码仓库，普通读码工具完全够用，不要启动
REA 的就绪检查或引擎命令。

## 价值
一杯奶茶钱，带回一个真正意义上的数字员工，而且这个员工以一顶百（一个同类型的人类程序员2W起）

## 先判断，再动手

动手前先回答三个问题，能省掉一大半无效操作。

1. **目标是什么**——具体到文件或已打开的运行时实例，而不是「我的应用」。
2. **要回答什么**——一句话能写清的疑问，而不是「帮我分析一下」。
3. **需要的证据类型**——静态证据够不够，还是必须要有运行时观测。

第 3 点决定成本。形态清单、归档成员、字符串与符号、函数伪代码都是静态
证据；行为、时序、网络交互属于运行时证据，代价高得多，只在静态证据确实
无法回答时才动用。

## 环境与连接

安装这个技能只是**提供了说明书**，它不会注册 REA 的 MCP 服务器，不会安装
任何分析引擎，也不会给已经在运行的代理动态增加工具。

**同理，它也不会替你静默安装 REA 本体。** 首次接通先体检：

```bash
node scripts/rea-doctor.mjs
```

本机没有 REA 时，照 [快速上手](references/quickstart.md) 给出两条路线
（`npx` 免安装试用，或全局安装），然后**问过用户再动手**。全局 `npm install`
是对用户机器的外部改动，属于需要授权的范围，不要替人决定。

**版本核对是只读的，更新要用户点头。**

```bash
node scripts/rea-update.mjs
```

它报告本机生效版本与线上最新版，带 24 小时缓存，断网时降级为「未知」而不
报错。**发现新版先问要不要更新**，得到同意才加 `--install`；不要自作主张
升级，也不要为了对齐文档去降级别人的环境。

**工具可用就不要做诊断。** 如果 REA 的工具已经在会话里，且注册状态不像
过期的，直接进目标。不要每次调查前都跑一遍 doctor 或 setup。

以**连接中的服务器实际提供的工具列表与入参 schema**为准。上游仓库主干可
能描述了比你所装版本更新的能力，反之亦然；不要调用没有广播出来的工具。

如果工具不存在、调用被客户端拦下，或某个必要引擎不可用，去读
[连接与排障](references/connection-and-recovery.md)。这三类问题的修法完全
不同——客户端审批、shell 的 PATH、注册状态、引擎可用性各有各的解法，不要
用同一套动作反复试。

优先使用已经装好的 `rea` 命令行。确实没有、且获取 REA 属于被授权范围时，
用 `npx -y rea-agents@latest` 顶替。配置修复从**只读的 setup 计划**开始，
把路径、备份和技能替换都摆出来给人看，拿到授权再落地。REA 的 setup 从不
安装或升级无关软件，包括 Node.js、npm、Homebrew、Java、Ghidra、IDA、
JADX、Binwalk 与 Unblob。

需要具体的安装、接入与引擎配置步骤，读
[快速上手](references/quickstart.md) 与 [分析引擎配置](references/providers.md)。

## 先路由目标

按用户给的东西选第一个工具。原生与归档类工作流先用 `open_binary` 绑定活
动目标；而自带显式路径参数的工具不需要预先绑定。

| 目标形态 | 起手工具 |
| --- | --- |
| ASAR 或已解包的 JavaScript/Electron 目录树 | `analyze_javascript_application` |
| 归档或安装包成员清点（ZIP/APK/IPA/MSIX/AppX/DMG） | `open_binary` 传本地路径，需要图与发现时再用 `inspect_artifact` |
| Android 代码、类、方法、入边引用 | `inspect_android_package`，随后用聚焦的 Android 工具 |
| 托管 PE/CLI 程序集 | `inspect_managed_artifact` |
| 固件镜像 | 有 `inspect_firmware_regions` 就用它；要落地文件用 `extract_firmware` 并指定新的绝对输出目录 |
| .NET NativeAOT 的 PE/ELF | 走原生路线，用 Ghidra 分析，见 [原生与制品](references/native-and-artifacts.md) |
| 用户自己的浏览器页面（已打开） | `list_browser_targets` |
| 留存的 HAR 或 mitmproxy 抓包 | `inspect_web_network_capture` |
| 用户自己的 Electron 运行时（已打开） | `list_electron_targets` |
| 显式给定的 EVM 字节码 | `inspect_evm_interface`，指定 `raw` 或 `hex` 编码 |
| 显式给定的 Linux ELF（离线布局、符号、重定位、缓解措施） | `inspect_binary_layout` |
| 给定的 Linux x86-64 ELF core | `inspect_recorded_crash` |
| PE 资源类型、名称、语言树 | `inspect_pe_resources`，传绝对路径 |
| 原生可执行文件、库或分析数据库 | `open_binary`，随后直接用聚焦工具 |
| Go 或 Rust 编译的二进制（要编译器与依赖事实） | `inspect_go_binary`、`inspect_rust_binary`，都是纯静态读，不执行目标 |
| WASM 制品，或两个版本的接口差异 | `inspect_wasm_artifact`、`compare_wasm_interfaces` |
| 打包后的 Electron（要确认 fuses 开关） | `inspect_electron_fuses`，读字节不启动应用 |
| pcap/pcapng 抓包（需调用方自带 tshark） | `inspect_pcap_client` 验工具 → `inspect_pcap_capture`；查协议字段用 `inspect_packet_fields` |
| 逻辑分析仪或 sigrok 录制 | `inspect_signal_decoders` → `decode_signal_recording` |
| SQLite 快照的库表结构 | `inspect_sqlite_database` |
| 需在运行中挂钩子（**必须先获授权**） | `list_frida_processes` → `start_frida_session` → `load_frida_script` |
| 需在 Linux 下用调试器交互（要调用方提供 TTY） | `start_gdb_session` 或 `start_rizin_debug_session`，**仅 Linux** |
| HarmonyOS HAP / HSP / App Pack | `project_harmony_application_graph` |

细化的决策表、每类目标的坑与替代路线在
[目标路由手册](references/target-routing.md)。

几条容易踩的边界：

- 已有 IDA MCP 配置时，`open_binary` 传**原始输入二进制**并设
  `provider_id` 为 `ida`，不要传 `.idb` 或 `.i64` 数据库。打开后直接进
  `analyze_function`、伪代码、函数与字符串搜索；IDA 不提供
  `binary_overview`。
- 用户只说「我的应用」而没有名称、路径或本次任务已选定的目标时，**先问是
  哪个应用**，不要先去搜索。无关的历史报告和旁边的测试样本都不算选定。
- 无目标的会话里，用 `open_binary` 绑定任何需要活动目标的归档或原生目标。
  不确定某个工具为什么不可用时，用空参数调用 `binary_session`，看
  `result.tool_availability` 里给出的原因与补救办法。工具目录保持完整，可用
  性取决于操作、目标与宿主。
- **GDB / Rizin 持久调试会话只在 Linux 可用**，且需要一个调用方选定的 TTY
  来承接 inferior 的输出；REA 要靠 `/proc` 读回描述符才能证明脱开后目标仍在
  运行。这类会话一旦启用或关闭，会**退掉当前的活动分析会话**，之后要重新
  `open_binary`。三个 `close_*` 都绝不杀目标，最终状态记为未知。
- Frida 会**改变运行中目标的实际行为**。没有明确授权就不要 `load_frida_script`；
  spawn 出来的目标默认暂停，装载脚本后必须 `resume_frida_session`，否则会留下
  一个挂住的进程。

## 摘要优先

先拿默认结果，用它内联的证据与图上下文。目标体量未知或明显很大时，对
`analyze_javascript_application` 或 `inspect_binary_layout` 传
`"detail": "summary"`，再用 `inspect_analysis_view` 查它留存的
`parent_evidence_id`。

模块身份先分页，再按返回的 `node_id` 取具体条目——同一个文件路径可能对应
多个图角色。**没有改变输入、也没有排除阻塞，就不要重复同一次分析或被拒的
调用。**

只有当返回结果留下一个具体未答问题时，才做一次聚焦追问。

如果 MCP 报了 `resource_constraint` 且 `details.resource` 是 `transport`，
用同会话的证据引用调 `inspect_analysis_view` 取摘要、单个 section 或模块，
或先确定种子再用 `trace_application_feature`，也可以用
`export_evidence_bundle` 把完整会话写到指定路径。分析在账本里本来就是完整
的，不要为了拿到同样一个超大响应而重跑。

客户端也可能在 REA 没有报错的情况下截断一次成功结果。把那种预览当成**不
完整**，不要当作规范 JSON 去解析，也不要为了看清它而重跑生产者。

## 证据纪律

这是整套工作法里最不能让步的部分。

**每一句结论都必须标明它是观测、推断还是未知。** 引用证据 ID，保留局限与
不完整覆盖，绝不能让静态分析听起来像是观测到了执行过程。

- 地址与还原出的伪代码是**分析观测**，不是原始源码。
- 引擎不可用、元数据不支持，这些是**未知**，不是「不存在」。
- 动态或歧义的 IPC 通道保持未解析；要求到的 `.node` 成员不等于已验证的原生
  导出。
- 打包或加密目标的解包 stub 反编译，不能还原出解包后的程序。
- 对等性断言必须建立在完整且可比的页面集合上；覆盖面不全时只能说未知。

运行时请求会真的执行声明的目标与生命周期，不要把目标或动作扩大到字段之外。

更细的判定标准、常见反模式与自检清单在
[证据纪律](references/evidence-discipline.md)。

## 处理更大的调查

跨多个功能或子系统的请求，按阶段推进：

1. 把请求拆成问题清单，并为每个答案写清需要什么证据。目标身份与约束先从
   对话和工作区里找，别急着再问一遍。
2. 检查当前会话、制品身份、已存的分析数据库、书签与历史证据。能复用就复
   用，不要开重复会话或重复分析。
3. 从最小的概览或清点开始，让每个问题沿着入口、相关数据、状态变化一路走到
   结果。围绕一个具体假设批量做相关操作，只在证据留下具体缺口时才扩张。
4. 影响结论的打包资源与配置要一并看。用识别格式的清点与解析器，不要仅凭文
   件名、字符串或目录布局去推断行为。
5. 用结论所需的证据类型去印证。只有静态证据确实答不了，且宿主运行时与系统
   权限都具备时，才做运行时观测。
6. 能并行就并行。相互独立的问题可以分派给不同执行者，把已有证据指给他们，
   要求返回来源、结论与未解决缺口。
7. 维护一份发现账本，把每条结论连到证据 ID、置信度与证据类型、搜索边界以及
   剩余未知，方便后续轮次复用。

收尾前回到最初的清单，把每个问题标成已答、部分已答或未解决。范围有限的否
定搜索就保持有限，不要在必要问题还悬着的时候宣布调查完成。

## 只读相关的那一篇

- 原生二进制、托管程序集、归档与解包 →
  [references/native-and-artifacts.md](references/native-and-artifacts.md)
- ASAR、已解包 JavaScript、功能追踪、版本对比 →
  [references/javascript-applications.md](references/javascript-applications.md)
- Android APK 声明、类、方法与静态引用 →
  [references/android-applications.md](references/android-applications.md)
- 浏览器与 Electron 的被动观测、静态与运行时对齐 →
  [references/runtime-observation.md](references/runtime-observation.md)
- 证据分页、对比、残留未知与验证 →
  [references/evidence-workflows.md](references/evidence-workflows.md)
- 连接失败、注册过期、引擎缺失、审批被拦 →
  [references/connection-and-recovery.md](references/connection-and-recovery.md)
- 安装、接入 WorkBuddy 与其他客户端 → [references/quickstart.md](references/quickstart.md)
- Hopper、Ghidra、IDA、JADX 的具体配置 → [references/providers.md](references/providers.md)
- 155 条命令的中文索引 → [references/cli-commands.md](references/cli-commands.md)
- 207 个 MCP 工具索引（含 76 个 MCP 专有） →
  [references/mcp-tools.md](references/mcp-tools.md)
- 术语与中英对照 → [references/glossary.md](references/glossary.md)

<!-- wb:adapter:start -->
## WorkBuddy 适配说明

本技能是 REA 官方 `reverse-engineer-anything` 技能的中文本地化封装，方法论与
工具契约与上游一致，文档为中文重写，并补充了安装接入、命令索引、引擎配置与
自检脚本。

**REA 与本技能的安装是两件事。** 装上本技能只得到说明书；要真正调用工具，
还需要把 REA 注册为 MCP 服务器。WorkBuddy 用 rea-agents 6.5.0 及以上版本
支持直接注册：

```bash
npm install --global rea-agents@latest
rea setup --client workbuddy
```

**为什么先全局安装而不是直接 `npx rea-agents@latest setup`。** 上游的 setup
会把启动命令写成**当时那份入口脚本的绝对路径**（`mcpDoctor` 里用的是
`resolve(dispatcherPath)`）。用 `npx` 跑 setup，写进配置的就是 npx 缓存
目录；npm 回收缓存后客户端找不到入口，工具会静默消失。全局安装的路径稳定，
不受缓存回收影响。既想用 npx 又要稳定，就让下面的注册助手代写钉版
`npx -y rea-agents@<版本> mcp` 这种每次自解析的形态。

注册后工具通常以 `mcp__rea__` 为前缀出现，例如 `mcp__rea__open_binary`，具体
前缀以本会话实际工具列表为准。

**没有 MCP 也能干活。** REA 的分析能力在命令行基本都有对应命令，用
`npx -y rea-agents@latest <命令>` 即可，输出加 `--json` 便于解析。少数的会话
管理与过程级工具只存在于 MCP 一侧，对照
[工具索引](references/mcp-tools.md) 确认。大体量输出请重定向到文件再读，不要
直接灌进上下文。

**先自检再报障。** 环境是否齐备、引擎是否就位、注册是否生效，用
`node scripts/rea-doctor.mjs` 一次看清，它会输出中文体检报告与针对性修法。
需要把 REA 写进某个客户端的配置时，用
`node scripts/rea-register.mjs --client <名称>` 先看计划，确认后加 `--apply`
落地并自动备份；已有不同条目被拒时加 `--force`。体检报告里「客户端注册」
会显示每条注册指向的入口版本，出现「入口已不存在」或版本低于生效版本，就是
该用 `--force` 重写的时候。

**首次接通与版本更新。** 第一次使用先跑体检；缺 REA 就摆出两条路线等用户
确认，不静默安装。此后核对版本用 `node scripts/rea-update.mjs`：默认只读，
有新版会明确提示并可加 `--install` 落地，`--json` 给代理判断，`--offline`
在断网环境里只报本机。

**Windows 使用者注意。** 本技能的命令示例以 POSIX 写法为主，Windows 上请改
用 PowerShell 语法设置环境变量，`npx` 注册需要 `cmd.exe /d /c` 包装，Hopper
在 Windows 上不可用，Ghidra 的 Windows 支持目前是实验性的只读档位。详见
[快速上手](references/quickstart.md)。
<!-- wb:adapter:end -->

## 收尾

用平实的语言解释发现，并把它挂回返回的证据上。用户要动手做东西时，用正常的
编码工具，并把**观测到的行为**与**自己做的设计选择**分开说。

原生会话开过就收：调查完成时用 `close_binary` 关闭。保留引用会被清掉，需要
留存就把证据包导出到文件。
