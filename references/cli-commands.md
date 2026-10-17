# 命令索引（155 条）

REA 的命令行有 153 条分析命令加 2 条集成命令（rea-agents 6.5.0 实测）。
MCP 侧的工具另有 207 个，命名用下划线（`open_binary`），命令行用连字符
（`inspect-binary-layout`），两者是同一套能力的不同门面。

命令行**没有** `open-binary` 这个子命令。CLI 的每条命令自己接目标路径，
一次调用一个动作；MCP 侧才有 `open_binary`、`binary_session`、
`close_binary` 这类会话管理工具。混用时注意这个差别。

## 通用选项

| 选项 | 作用 |
| --- | --- |
| `--json` | 输出 JSON，脚本处理时几乎总要用 |
| `--format <toon\|json\|yaml\|md\|jsonl>` | 指定输出格式 |
| `--filter-output <键路径>` | 只保留关心的字段，例如 `foo,bar.baz,a[0,3]` |
| `--token-limit <n>` / `--token-offset <n>` | 按 token 截断或偏移，喂给模型时控制体积 |
| `--token-count` | 只返回输出的 token 数 |
| `--full-output` | 显示完整输出封套，不裁剪 |
| `--schema` | 打印该命令的 JSON Schema，确认参数后再调用 |
| `--llms` / `--llms-full` | 打印面向模型的清单，用于自助发现能力 |
| `--version` / `--update` | 版本号、自更新 |

大体量输出（JavaScript 分析、证据包）请重定向到文件再读，不要直接灌进上下文。

## 环境、集成与维护

| 命令 | 作用 |
| --- | --- |
| `capabilities` | 列出各分析引擎的能力与副作用 |
| `providers` | 列出已配置的分析引擎 |
| `doctor` | 检查 REA 是否就绪（可加 `--provider`、`--client`、`--skill`） |
| `setup` | 配置客户端集成与可选的分析引擎 |
| `update` | 更新当前 REA 安装并校验发布包 |
| `uninstall` | 移除 REA 写入的客户端配置与技能文件 |
| `completions` | 生成 shell 补全脚本 |
| `mcp` | 注册为 MCP 服务器（`add`、`doctor` 子动作） |

## 总览、函数与搜索

| 命令 | 作用 |
| --- | --- |
| `analyze` | 拿到应用的整体概览 |
| `inspect` | 带证据地检查应用概览 |
| `function` | 分析一个完整函数并给出证据 |
| `decompile` | 把应用的某一部分当代码读出来 |
| `instructions` | 读原始指令，不做反编译 |
| `search` | 搜索已分析的字符串或过程名 |
| `xrefs` | 列出指向某个地址的有限引用 |
| `trace` | 沿引用追踪一个具体功能 |
| `read-bytes` | 在分析地址处读取精确的内存字节 |
| `address-to-file-offset` | 把分析地址换算回原始文件字节偏移 |
| `annotate-native-function` | 编辑函数注解并返回刷新后的分析 |

## 离线二进制体检

不需要打开反汇编器数据库、不依赖引擎的检查。适合先摸清一个陌生文件。

| 命令 | 作用 |
| --- | --- |
| `inspect-binary-layout` | 看 ELF 的文件布局、符号、重定位、链接名与静态缓解措施 |
| `inspect-macho` | 不启动 Hopper 直接检查 Mach-O |
| `inspect-signature` | 不启动 Hopper 做签名检查 |
| `inspect-plist` | 解析 macOS/iOS 的 plist 元数据 |
| `inspect-keyed-archive` | 把 keyed archive 当作对象引用图来检查 |
| `inspect-asset-catalog` | 检查编译后的 Apple 资源目录元数据 |
| `decode-interface-builder` | 解码应用包里的 storyboard 与 nib 归档 |
| `demangle-swift` | 还原 Swift 符号名，不需要 Hopper |
| `list-architectures` | 不启动 Hopper 列出架构 |
| `inspect-recorded-crash` | 读 core 的寄存器、信号，可选补充调试器映射证据 |
| `inspect-pe-resources` | 看 PE 资源的类型、名称、语言树与图标组关系 |
| `inspect-native-load-image` | 核对已加载字节、源映射、重定位与入口点 |
| `inspect-native-instruction` | 检查单条原生指令与解码后的操作数事实 |
| `inspect-native-api` | 还原一个原生函数的 API 边界 |
| `inspect-native-data-type` | 检查一个已还原的数据库类型或带类型的数据对象 |
| `inspect-native-dispatch-metadata` | 检查带类型的 Objective-C 与 Swift 派发元数据 |

## 字节搜索、反汇编旁路与 WebAssembly

| 命令 | 作用 |
| --- | --- |
| `search-bytes` | 在已初始化的引擎内存里找带掩码的字节模式 |
| `inspect-with-objdump` | 用 GNU objdump 检查本地制品，原始输出留存为证据 |
| `list-objdump-architectures` | 列出已安装 objdump 支持的 BFD 目标架构 |
| `inspect-wasm-artifact` | 用 WABT 检查一个显式的本地 WASM 制品 |
| `compare-wasm-interfaces` | 对比两份精确检查证据里的核心 WASM 接口 |

## 语言与框架指纹

这几条都在**不执行目标**的前提下读编译器与框架留下的痕迹。

| 命令 | 作用 |
| --- | --- |
| `inspect-go-binary` | 读内嵌的 Go 编译器版本、模块与构建设置 |
| `inspect-rust-binary` | 读 cargo-auditable 留下的 Rust 依赖清单 |
| `inspect-electron-fuses` | 读打包后的 Electron fuse 字节，不启动应用 |
| `identify-flutter-build` | 纯解析 APK 得到 Dart snapshot 哈希与引擎事实 |
| `inspect-dart-aot` | 检查某个 ABI 的 Dart AOT 快照：段、头与字符串池 |

## 原生分析深入

| 命令 | 作用 |
| --- | --- |
| `trace-native-values` | 追踪有界的原生 def-use 与调用依赖 |
| `resolve-native-call-targets` | 解析一个静态原生调用点 |
| `trace-dylib-resolution` | 追踪 dyld 的加载路径解析，包括每个可执行文件 |
| `observe-native-calls` | 在 LLDB 下启动 Mach-O，记录进入指定函数或方法的调用 |

## 原生 UI 观测

| 命令 | 作用 |
| --- | --- |
| `observe-native-ui` | 在某个确切的原生窗口里观测或执行一个场景 |
| `capture-native-ui-scenario` | 同上，侧重截取与场景结果 |
| `trace-native-ui-action` | 把编译后的 UI 动作选择器追到原生处理函数与直接被调用方 |

## 托管程序集（.NET / PE-CLI）

| 命令 | 作用 |
| --- | --- |
| `inspect-managed-artifact` | 不加载目标代码，检查 PE/CLI 身份 |
| `inspect-managed-members` | 检查元数据成员、签名与 CIL 锚点 |
| `inspect-managed-native-boundaries` | 检查 PInvoke 与原生实现的边界声明 |
| `compare-managed-members` | 按声明的类型、名称、签名对比成员清单，名称本身从不构成匹配 |
| `import-managed-reconstruction` | 把反编译器产出的托管重建导入并对照静态成员证据 |
| `verify-managed-native-boundaries` | 用原生证据校验 PInvoke 声明 |
| `project-managed-application-graph` | 把托管静态证据投影成应用图 |

## 归档、制品与固件

| 命令 | 作用 |
| --- | --- |
| `inspect-artifact` | 检查一个制品，返回全部可用观测与下一步探针 |
| `extract-artifact` | 安全地提取所有常规文件内容 |
| `inspect-firmware-regions` | 只找固件签名候选，不做提取 |
| `extract-firmware` | 提取指定固件字节，返回已校验文件与来源 |
| `project-apple-application-graph` | 把认证过的 IPA 或 macOS 应用清点证据投影成 Apple 应用图 |

## JavaScript / Electron 静态分析

| 命令 | 作用 |
| --- | --- |
| `analyze-javascript-application` | 静态重建本地 JavaScript/Electron 应用 |
| `recover-javascript-sources` | 还原可读模块，带源码来源与已校验文件 |
| `analyze-web-bundle` | 抓取并静态分析一个页面 bundle |
| `export-web-scripts` | 把留存的站点脚本导出到一个不存在的目录 |
| `compare-javascript-export-shapes` | 不执行代码，对比导出返回值的精确形状 |
| `trace-javascript-semantics` | 在认证过的应用证据里追踪有界静态语义关系 |
| `trace-web-module-imports` | 把一个脚本的原生导入追到 URL 与源码候选 |
| `trace-web-source-location` | 用指定的本地 source map 追踪脚本位置 |

## 浏览器、Electron 与运行时观测

| 命令 | 作用 |
| --- | --- |
| `list-browser-targets` | 列出回环 CDP 浏览器里的页面目标，可按来源过滤 |
| `inspect-web-page` | 通过 CDP 被动检查一个页面 |
| `capture-web-screenshot` | 在指定来源范围内截取一个可见视口 |
| `capture-browser-scenario` | 跑一个有界的 Playwright 场景并返回证据 |
| `observe-web-execution` | 观测精确的页面执行，会重置计数器并临时关闭优化 |
| `observe-web-session` | 在选定窗口内观测用户自己驱动的页面导航 |
| `inspect-web-event-listeners` | 检查首个主文档 CSS 匹配处的原生监听器位置 |
| `discover-webmcp-tools` | 被动发现页面声明的 WebMCP 工具（不可信，绝不调用） |
| `inspect-web-network-capture` | 检查留存的 HAR 或 mitmproxy 记录，不抓取录下的 URL |
| `compare-web-captures` | 对比两份归一化被动抓取或录制的浏览器场景 |
| `compare-web-screenshots` | 对比两份自校验的 PNG 制品 |
| `list-electron-targets` | 列出指定 Electron CDP 端点暴露的本地文件页面 |
| `inspect-electron-page` | 被动检查一个 Electron 文件页面 |
| `capture-electron-scenario` | 在自持的 Electron 实例里跑可取消的场景 |
| `list-javascript-runtime-targets` | 列出 Node/Electron 的 V8 Inspector 目标 |
| `observe-javascript-runtime` | 被动观测一个确切的 Inspector 目标 |
| `reconcile-javascript-runtime` | 把静态应用证据与被动运行时证据对齐 |
| `capture-process` | 抓取一个由调用方选定的进程场景 |
| `compare-process-captures` | 对比两份进程抓取证据 |

## 调试器会话（GDB / Rizin / Cutter）

这三个引擎都是**临时会话**：一次调用开、跑完关，不留下常驻进程。

| 命令 | 作用 |
| --- | --- |
| `debug-with-gdb` | 在临时 MI 会话里跑一条 GDB 控制台命令；要给 inferior 一个 TTY，才能安全脱开活目标 |
| `debug-with-rizin` | 在临时会话里跑一条 Rizin 调试器命令 |
| `execute-rizin-command` | 对本地制品执行一条 Rizin 命令 |
| `cutter-command` | 在选定的活动 Cutter 实例里执行一条 Rizin 命令 |
| `list-cutter-sessions` | 列出通过 REA Python 插件桥接的活动 Cutter 实例 |

宿主限制：持久化的 GDB 会话只在 Linux 可用；Frida 与 Rizin 视引擎安装情况而定。

## 动态插桩（Frida）

| 命令 | 作用 |
| --- | --- |
| `instrument-with-frida` | 对选定进程跑一个 Frida 脚本，跑完即脱开 |
| `list-frida-devices` | 列出本地 Frida 设备，可选远端端点 |
| `list-frida-processes` | 列出某个 Frida 设备可见的进程 |

脚本能读写目标内存、改变目标行为，也能借用目标进程的权限。**这是唯一会主动
改变运行中目标状态的一组命令**，用之前先确认你已获得授权。

## 抓包与信号解码

这两族都要求调用方**自带**工具链（TShark、sigrok），REA 只负责解析与留存证据。

| 命令 | 作用 |
| --- | --- |
| `inspect-pcap-client` | 检查调用方给的 tshark 与 capinfos，不读任何抓包 |
| `inspect-pcap-capture` | 检查一份 pcap/pcapng：端点、DNS、TLS SNI 与协议分布 |
| `inspect-packet-capture` | 用调用方给的 TShark 检查一份既有抓包 |
| `inspect-packet-fields` | 搜索已安装 TShark 的协议与字段定义 |
| `inspect-signal-decoders` | 搜索已安装的 sigrok 解码器或选定解码器的帮助 |
| `decode-signal-recording` | 用调用方给的 sigrok 解码一份既有信号录制 |

## 数据与平台制品

| 命令 | 作用 |
| --- | --- |
| `inspect-sqlite-database` | 检查 SQLite 的库表结构，可选读出普通表的行 |
| `project-harmony-application-graph` | 把认证过的 HarmonyOS HAP/HSP/App Pack 清点证据投影成应用图 |

## Android

| 命令 | 作用 |
| --- | --- |
| `inspect-android-package` | 不执行 APK，检查声明与解码后的清单 |
| `search-android-classes` | 搜索 APK 类名，空查询等于全量清点 |
| `inspect-android-class` | 检查某个确切类的成员清单 |
| `inspect-android-method` | 反编译某个 APK 方法，需显式选择重载 |
| `trace-android-references` | 追踪入边的类或唯一方法引用 |
| `decode-android-resources` | 用 apktool 解码清单、元数据与字符串资源 |
| `inspect-apktool-client` | 检查调用方给的 apktool 启动器，不解码任何东西 |
| `project-android-application-graph` | 把认证过的 APK 清点证据投影成 Android 应用图 |
| `compare-source-to-bundle` | 把已提交的历史源码与认证过的应用证据对照 |

### ADB 设备操作

| 命令 | 作用 |
| --- | --- |
| `list-adb-devices` | 列出已连接设备，含序列号、状态、传输方式与推断类型 |
| `inspect-adb-client` | 检查调用方选定的 adb 客户端，不接触设备 |
| `inspect-adb-device` | 通过固定的 getprop 白名单检查设备构建身份 |
| `inspect-adb-display` | 报告屏幕声明的尺寸与密度 |
| `inspect-adb-window` | 报告窗口管理器的当前焦点声明 |
| `list-adb-packages` | 列出已安装包及其基础 APK 设备路径 |
| `resolve-adb-packages` | 按大小写不敏感的子串查找已安装包 |
| `inspect-adb-package` | 通过 dumpsys 看包版本、安装器与标志 |
| `pull-adb-package` | 拉取某包的完整 APK 集，带 SHA-256 摘要 |
| `install-adb-package` | 安装本地 APK，`--replace` 保留应用数据重装 |
| `uninstall-adb-package` | 卸载包并删除设备上的数据 |
| `start-adb-app` | 解析并启动某包的启动器 Activity |
| `stop-adb-app` | 强制停止某包的所有进程 |
| `start-adb-activity` | 用 `am start` 启动一个 intent |
| `list-adb-directory` | 列设备目录，带类型、权限与大小 |
| `push-adb-file` | 推文件到设备，目标已存在时需 `--overwrite` |
| `pull-adb-file` | 拉取单个设备文件，带 SHA-256 摘要 |
| `read-adb-logcat` | 读某个缓冲区有界的日志 |
| `read-adb-setting` | 读 system、secure 或 global 的一个设置值 |
| `collect-adb-bugreport` | 收集并摘要一份设备生成的 bugreport |
| `list-adb-features` | 列出设备声明的软硬件特性 |
| `list-adb-services` | 列出设备的 binder 服务与接口 |
| `list-adb-processes` | 按 `ps -A` 的报告列出运行进程 |
| `capture-adb-screen` | 抓一帧屏幕并给出 PNG |

## 证据、对比与重建

| 命令 | 作用 |
| --- | --- |
| `evidence-export` | 校验并原子地导出规范证据 JSON |
| `evidence-import` | 校验并导入一个有界的本地证据包 |
| `inspect-evidence-bundle` | 看本地证据包的完整或选定发现元数据 |
| `inspect-analysis-view` | 把已完成的证据投影成摘要、分页或单个条目 |
| `compare` | 对比两份规范证据包 |
| `compare-application-versions` | 对比两个认证过的应用图版本 |
| `trace-application-feature` | 从一个带类型的种子出发追踪应用证据 |
| `build-reconstruction-obligation-ledger` | 生成确定性的、带证据的重建义务账本页 |
| `evaluate-reconstruction-coverage` | 评估内联的失败即关闭式重建覆盖 |
| `import-reference-source` | 把源码树导入为仅作历史参考 |

## 其他引擎与格式

| 命令 | 作用 |
| --- | --- |
| `inspect-jeb-client` | 检查运行中的 JEB MCP 客户端，不打开目标 |
| `list-jeb-units` | 按路径与类型列出 JEB 项目单元 |
| `open-jeb-project` | 从制品或 `.jdb2` 数据库打开/新建 JEB 项目 |
| `decompile-jeb-item` | 把 JEB 的类型或方法反编译成引擎伪代码 |
| `inspect-evm-interface` | 从本地 EVM 字节码推断接口候选，需要 `raw` 或 `hex` |

## 按场景挑命令

- 只想快速知道一个二进制是什么 → `inspect-binary-layout`
- 想知道某个功能在原生代码里怎么实现 → `analyze` → `search` → `function` → `decompile`
- 想看清一个 Electron 应用的主流程 → `analyze-javascript-application`
- 想比较两个版本改了什么 → 先各分析一次，再 `compare-application-versions`
- 想看 Android 某方法干了什么 → `inspect-android-package` → `inspect-android-method`
- 想确认某个界面行为真的发生了 → 用 `capture-browser-scenario` 或 `capture-electron-scenario`，再用 `reconcile-javascript-runtime` 与静态证据对齐
- 拿到一个不知语言的二进制 → 先 `inspect-go-binary`、`inspect-rust-binary`、`inspect-with-objdump` 打指纹，再决定用不用 Ghidra
- 要看清 Electron 应用的开关状态 → `inspect-electron-fuses`，这是纯读字节，不启动应用
- 拿到一份抓包或逻辑分析仪录制 → `inspect-pcap-capture`（要 tshark）或 `inspect-signal-decoders`（要 sigrok）
- 需要在运行中挂钩子 → `list-frida-processes` → `instrument-with-frida`，前提是已获授权

不确定参数时先 `rea <命令> --schema`，比读文档快。
