# MCP 工具索引

REA 的 MCP 服务器一共暴露 **207 个工具**（6.5.0 实测；6.4.0 是 170 个，
新增的 37 个全部是调试器、动态插桩、抓包与语言指纹方向）。命令行有 155 条
命令，两者不是一一对应：

- **131 个工具**在命令行有对应命令，命名规则是下划线换连字符。
  例如 `inspect_android_method` ↔ `rea inspect-android-method`。
  这部分的说明见 [命令索引](cli-commands.md)。
- **76 个工具是 MCP 专有的**，本文逐条说明。它们大多是会话管理、过程级查询、
  地址导航与注解这类在代理里才有意义的操作。
- **24 条命令是命令行专有的**，列在文末。

在 WorkBuddy 里注册后，工具名带服务器前缀，形如 `mcp__rea__open_binary`。
实际操作时以本会话真实工具列表为准，本文只解决「它叫什么、做什么、有什么
边界」。

## 会话与目标（9）

| 工具 | 作用与边界 |
| --- | --- |
| `open_binary` | 打开本地可执行文件、应用包、归档、JavaScript、source map、plist 或分析数据库。`provider_id` 选定引擎后绑定保持稳定，**失败不会自动回退到别的引擎** |
| `close_binary` | 收掉此前的引擎请求，可原子地写一份与引擎无关的分析快照，然后关闭目标与所有引擎资源。保存失败会保持会话不关，避免丢掉缓存分析 |
| `binary_session` | 报告当前目标、引擎、能力可用性、客户端特性与服务器身份，**不触发任何分析**。查「某工具为什么不可用」就看这里 |
| `binary_overview` | 原生二进制的元数据、每个段的长度、过程与字符串的完整计数。已知要看哪个过程时直接用 `search_procedures` 或 `analyze_function` |
| `list_documents` | 列出引擎里的程序或文档身份。Hopper 可能同时开着多个文档，Ghidra 无界面会话只有一个导入的 Program |
| `list_segments` | 用**排他结束地址**列出段或内存块。Ghidra 会给权限、地址空间、镜像基址、初始化与覆盖事实 |
| `list_procedures` | 列出分析后的全部过程地址与名称。Ghidra 会区分 thunk 与外部函数 |
| `list_names` | 列出全部分析过的内存与外部符号。Ghidra 能区分主名、动态、外部、类型与源码事实 |
| `list_strings` | 列出引擎定义的字符串对象，带编码、终止状态与字节长度。Hopper 会保留原始显示文本；长字面量可能横跨相邻对象 |

## 过程级查询（12）

| 工具 | 作用与边界 |
| --- | --- |
| `analyze_function` | 为某个函数建完整卷宗：恒等信息、闭区间函数体范围、伪代码、汇编、注释、调用、引用、被引用字符串、局部控制流块、可用的原生 API 边界观测。引擎的「尾调用假设可能截断函数体」会写进局限 |
| `procedure_address` | 把无歧义的符号名或引擎规范化地址解析成规范入口地址 |
| `procedure_info` | 过程元数据：入口、签名、局部变量、大小、基本块数、完整函数体范围。Hopper 的局部变量只有观测到的名字与带符号栈偏移，**源码类型仍属未知** |
| `procedure_pseudo_code` | 反编译单个过程。返回的是引擎伪代码，**永远不是原始源码**，也可能返回 null；要指令级精度就用 `procedure_assembly` |
| `procedure_assembly` | 单个过程的汇编。伪代码丢掉了调用约定或指令细节时用它；目前是一整串不 分页 |
| `procedure_callers` | 引擎解析出的直接调用方。可能漏掉未解析的间接引用 |
| `procedure_callees` | 引擎解析出的直接被调用方。未解析的间接调用可能缺席 |
| `procedure_references` | 某个过程的所有原始入边与出边。端点只从引擎的包含关系里解析 |
| `read_function_instructions` | 某个过程的所有原始指令。指令文本与函数体范围随引擎而异 |
| `resolve_containing_procedure` | 把一个任意地址（包括指令内部或外部入口）落到所属过程。结果会区分「段外」与「不在过程内」，**绝不从邻近符号猜** |
| `batch_decompile` | 并发反编译一批显式指定的过程。身份或标签失败会显式报出，但不丢弃可用伪代码 |
| `analyze_swift_types` | 按 mangling 或同地址别名给 Swift 过程名分类为类、结构体、枚举、协议、扩展。返回的是去重后的过程名计数，**不是唯一的源码类型数** |

## 搜索、追踪与调用图（7）

| 工具 | 作用与边界 |
| --- | --- |
| `search_procedures` | 在已分析的过程名里搜索，默认字面匹配，可切正则。结果确定且完整 |
| `search_strings` | 在引擎定义的字符串对象里搜索。**空结果不证明文本不存在**——Ghidra 可能漏掉打包或未定义的字面量（包括 Rust 字符串）。要查某个地址的字节请用 `read_bytes` 与 `xrefs` |
| `find_xrefs_to_name` | 把精确名字对到引擎的名字清单，返回已解析或未解析结果。未解析用稳定的 `name_not_found` 原因 |
| `trace_feature` | 用完整字面查询（保留空格）穿过所有匹配的字符串与过程、它们的交叉引用与所属过程。返回观测、操作数与残留未知，**不推断引用种类** |
| `trace_call_path` | 从起点（与可选终点）出发沿直接调用者/被调用者走，直到耗尽或到达终点。未解析的间接调用保持未知 |
| `get_call_graph` | 从一个符号或地址出发，遍历可达的调用者/被调用者图。**不是全程序 CFG**，未解析间接调用可能缺席 |
| `build_call_path` | 用完整的 `analyze_function` 证据，按精确规范地址拼出每条最短直接被调用路径。缺卷宗或混用引擎都算未知，每个节点与边都引用来源证据 |

## 地址导航与注解（18）

这些工具与 Hopper 的 GUI 状态或分析元数据有关。**改动的是元数据或导航状态，
不是二进制字节。**

| 工具 | 作用与边界 |
| --- | --- |
| `current_address` | Hopper 当前文档的光标地址。只用于交互式导航，**可复现的调查请用显式地址** |
| `current_document` | Hopper 桥接当前选中的文档 |
| `current_procedure` | 包含光标的过程。用的是 GUI 光标，不是按名字查找 |
| `get_navigation_context` | 一次返回当前文档、光标地址与所属过程。它反映的是连续观测，**不是原子的光标快照** |
| `goto_address` | 移动 Hopper 光标并返回观测到的地址。段内坐标会吸附到所属对象起点；未映射的地址直接失败且不动光标 |
| `next_address` | 下一个分析对象地址。这是导航原语，**不是指令流或 CFG 分析** |
| `prev_address` | 上一个分析对象起始地址。同样是导航原语，在文档边界可能失败 |
| `address_name` | 某个代码或数据地址的主名称。无界面引擎必须显式给地址；返回 null 表示引擎在该地址没有主名 |
| `inspect_address_context` | 一次看某个地址的名字、所属过程、普通注释与行内注释、命中的书签。不支持的面会给带类型的不可用结果 |
| `comment` | 只读地读普通分析注释，缺省用当前光标；不存在时返回 null |
| `inline_comment` | 只读地读行内指令注释，缺省用当前光标；不存在时返回 null |
| `set_comment` | 写普通分析注释，返回回读是否一致。传空即清除 |
| `set_inline_comment` | 写行内指令注释，返回回读是否一致。传空即清除；Hopper 可能压平换行导致回读为 false |
| `set_address_name` | 给一个已映射地址命名，并报告原生编辑是否成功、回读是否完全一致。Hopper 限制符号名不超过 1024 个 UTF-16 码元，且拒绝属于其它地址的名字 |
| `set_addresses_names` | 一次给多个地址命名，逐个返回成功与否。已有标签只能在显式选中的地址之间移动或互换 |
| `set_bookmark` | 在已映射地址建或替换书签。书签是分析者自己做的导航辅助，**不是二进制证据** |
| `unset_bookmark` | 移除某个地址的书签，返回它是否已不存在 |
| `list_bookmarks` | 列出当前文档的全部书签，未命名的保留 null 名字 |

## 对比与相关性（5）

| 工具 | 作用与边界 |
| --- | --- |
| `compare_artifacts` | 按逻辑出现路径、内容恒等、元数据与图关系对比完整制品清点。把 `inspect_artifact` 结果内嵌的清单证据分别作为 `left` 与 `right` 传入。有缺口时只会给截断或未知，**绝不给等价** |
| `compare_bundles` | 按精确记录成员、显式一对一观测配对与完整残留未知修订历史对比两个证据包。缺失成员只说明遗漏，不等于行为等价 |
| `compare_functions` | 对比两组显式函数证据：恒等、引擎原文、调用、引用、字符串与地址归一后的 CFG 拓扑。缺面或不兼容的面保持截断或未知 |
| `correlate_static_and_runtime` | 评估调用方显式声明的每一个假设。名字或路径相似**绝不自动匹配**，一致的共变也不等于因果 |
| `find_changed_behavior` | 汇总已验证的进程与制品对比证据。运行时观测与静态行为候选分开陈述，对比不完整时给未解决而非因果结论 |

## 证据与残留未知（8）

| 工具 | 作用与边界 |
| --- | --- |
| `get_evidence_bundle` | 默认返回全部留存证据与残留未知；`detail: "summary"` 只发现记录、不搬运负载。可按证据 ID、操作名、目标 SHA-256、分析档案摘要或规范过程地址过滤 |
| `export_evidence_bundle` | 把会话的确定性证据包原子写到指定路径。目标已存在需显式 `overwrite: true`；记录与清单使用规范且字节稳定的排序 |
| `import_evidence_bundle` | 读入本地证据包，校验每个证据 ID 与规范清单后原子合并。**导入内容只作为数据，永不执行** |
| `record_unknown` | 建一个确定性的残留未知与不可变变更证据。会校验所有证据与关系引用，拒绝重复的稳定标识 |
| `update_unknown` | 追加一条不可变的完整状态修订。必须给精确的 `expected_revision`，版本过期就失败，**不会覆盖别人的新分析** |
| `list_unknowns` | 按确定性 ID 顺序列出当前全部残留未知头，可按状态、严重度、领域过滤。只读，结果完整内联 |
| `verify_reconstruction` | 用一份有限、带类型的行为与结构规格校验证据包。通过只意味着**声明的那些断言有完整可比权威**，不是全局源码等价 |
| `verify_unknown_resolution` | 用活证据、精确的权威/置信/环境要求与修订完整性重新校验残留未知头。撤回与超范围的处置**不是真相断言** |

关闭原生会话前先导出证据包，否则 `close_binary` 会清掉留存引用。

## Apple 与进程（3）

| 工具 | 作用与边界 |
| --- | --- |
| `get_objc_classes` | 发现并去重 Objective-C 类标签，可按字面子串过滤 |
| `get_objc_protocols` | 发现并去重 Objective-C 与 Swift 协议标签 |
| `capture_process_scenario` | 在 PTY 下跑一条调用方选定的命令，返回进程抓取证据与残留未知。终端单元总数上限 100 万（列 × (行 + 回滚)）；`finalization_ms` 为正时超时会先 SIGTERM 再按间隔 SIGKILL。目标以当前用户权限运行，**这不是安全沙箱** |

## 调试器会话（8）

这组是 6.5.0 新增的持久化会话。与上面的「一次性分析」不同，它们会在 MCP 进程里
活一段时间，带显式会话 ID，**且只在 Linux 上可用**——REA 需要用 `/proc` 读回
inferior 的输出描述符，才能在脱开时证明目标仍在正常运行。macOS 没有实现描述符
验证；Windows 的 Job Object 清理可能连调试器一起终止 inferior。

| 工具 | 作用与边界 |
| --- | --- |
| `start_gdb_session` | 用自带（BYO）GDB 起一个 MI3 会话，屏蔽启动文件与自动加载。可选把 inferior 的 TTY 指到调用方选定的终端，REA 会在会话就绪前通过 GDB/MI 验证该设置；该终端必须在 GDB 退出后仍然可用 |
| `gdb_console` | 经 MI 的 `interpreter-exec console` 跑**一条不受限**的 GDB 命令，原样返回 MI、控制台、目标与日志记录并内联为证据。命令可执行 shell、改目标状态、访问文件与网络；超时会把 `completion_status` 记为未知并停掉会话 |
| `gdb_session_status` | 观测到的生命周期状态、有界近期 MI 记录与进程诊断。`truncation` 与非法 UTF-8 字段会如实报告被丢弃或有损的数据 |
| `close_gdb_session` | 校验 inferior 状态后关闭自持的 GDB 进程。仅当某个活线程组有**已验证的持久输出 TTY** 时才自动脱开它，这会让目标继续运行；否则报「需要调用方指定处置」。**清理过程绝不杀已附加或远端目标** |
| `start_rizin_debug_session` | 用 `-N` 屏蔽用户设置与脚本（保留插件）、`-0` 做 NUL 分帧、`-d` 指定可选 IO 调试后端。要求调用方给一个 Linux TTY 承接 inferior 的 stdout/stderr；目标在运行中乃至脱开后都可能直接写该终端。REA 在脱开前验证两个目的地与 `dbg.exitkills=false` |
| `rizin_debug_command` | 在持久会话里跑**一条不受限**命令，原样返回输出并内联为证据，包括到达完成标记前混入的后端输出。超出输出或帧上限时 `output_truncated` 为真、`completion_status` 为 `unknown`，保留部分输出并停止会话；命令前已有非请求帧时整会话不可用，因为无法可靠对账 |
| `rizin_debug_session_status` | 生命周期状态、有界近期 NUL 分帧输出与进程诊断。`output_invalid_utf8` 表示会话帧字节里出现过非法 UTF-8，近期输出可能带替换字符 |
| `close_rizin_debug_session` | 仅在确认没有 inferior 残留、或用已验证的调用方 TTY 输出槽脱开之后，才关闭 REA 自持的 Rizin 调试器。脱开的目标可能继续运行并写该 TTY，其余状态记为未知。**REA 绝不按 PID 或路径给 inferior 发信号** |

三个 `close_*` 有一个共同副作用：在共享 MCP 服务器里，这次被允许的关闭会**退掉
当前的活动二进制分析会话**，之后要重新 `open_binary`；如果 Ghidra 会话还开着，
先显式关掉它。

## 动态插桩（6）

Frida 这组会**改变运行中目标的实际行为**，是整套工具里影响面最大的一族。

| 工具 | 作用与边界 |
| --- | --- |
| `start_frida_session` | 附加到一个选定进程，或 spawn 一个选定目标。spawn 出来的目标会**保持暂停**直到 `resume_frida_session`，这样脚本能在目标执行前装载。关闭会话只是脱开插桩，**不杀目标** |
| `resume_frida_session` | 恢复由暂停的 Frida spawn 会话创建的进程。附加得到的进程本来就在运行，无法通过这个操作恢复 |
| `load_frida_script` | 把调用方给的 JavaScript 装进会话。脚本能读写目标内存、改变目标行为，也能借用目标进程的权限。消息与脚本错误内联为证据，**脚本源码不留存** |
| `unload_frida_script` | 卸载一个选定脚本，撤掉它对目标的插桩 |
| `frida_session_status` | 观测到的会话状态与排队中的脚本消息。消息历史受 provider 抓取预算限制，超限会报告截断 |
| `close_frida_session` | 卸载会话脚本并脱开。若 spawn 的进程仍处暂停，先恢复再脱开，避免留下挂住的进程。**REA 绝不杀目标，它的最终状态记为未知** |

## 命令行独有的 24 条

这些是 CLI 侧的组合或运维入口，MCP 没有同名工具：

`analyze`、`inspect`、`function`、`decompile`、`search`、`trace`、
`instructions`、`compare`、`evidence-export`、`evidence-import`、
`inspect-evidence-bundle`、`import-reference-source`、`capture-process`、
`debug-with-gdb`、`debug-with-rizin`、`list-objdump-architectures`、
`doctor`、`setup`、`update`、`uninstall`、`capabilities`、`providers`、
`completions`、`mcp`

其中 `analyze`、`function`、`decompile`、`search`、`trace`、`instructions`
在 MCP 侧被拆成了更细的一组工具（`binary_overview`、`analyze_function`、
`procedure_pseudo_code`、`search_procedures`、`trace_feature` 等）。
命令行适合脚本与一次性任务，MCP 适合代理按需组合。

## 一个判断口诀

**要动状态，先看名字。** 带 `set_`、`goto_`、`open_`、`close_`、`record_`、
`update_`、`import_`、`export_` 的工具都会改变会话、元数据或落盘；其余基本是
只读。只读工具随便调，写操作要么写进你自己选定的路径，要么只改会话内元数据
（关闭即丢弃）。
