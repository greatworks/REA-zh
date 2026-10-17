# 原生、托管与打包制品

## 已记录的 Linux 崩溃

使用 `inspect_recorded_crash`，并显式给出 Linux x86-64 ELF core 路径，以检查历史线程寄存器、信号、原始 note 与原始文件区间。它独立于当前活动的反汇编器目标。与来源绑定的寄存器值和 note 字节属于观测；缺失的 note、信号与线程的关联，以及当前可执行文件/库身份，仍属未知。PID 是历史元数据，绝不用作授权实时附加或控制的依据。

可选的 `include_debugger_context` 切面会在一个自持的、仅针对 core 的会话中，通过调用方提供的 GDB/pwndbg 补充映射候选。显示名称不能确立当前文件身份；上报的标志为零时，权限仍属未知。请求了不可用的上下文会失败，并给出安装配置指引。关于精确的上游 profile、边界与验证覆盖范围，见[已记录的崩溃](https://github.com/morluto/rea/blob/main/docs/recorded-crashes.md)。

## 离线 ELF 布局

使用 `inspect_binary_layout`，并显式给出本地 ELF 路径，可在不打开反汇编器目标的情况下获得由文件支撑的节、符号、重定位、链接名，以及静态缓解措施推断。当该完整记录已被留存时，改用 `inspect_analysis_view` 获取摘要、缓解措施或链接切面、单个节或符号，或一个稳定的分页。不要为了读取单个对象而重跑解码器。

## 原生目标

在 `open_binary` 之后，直接使用定向的搜索、过程或函数工具。当目标元数据或清点上下文有助于回答问题时，使用 `binary_overview`。优先使用字面搜索、名称、反编译、调用方、被调用方与交叉引用。地址与还原出的伪代码属于分析观测，而非原始源码。分析引擎（provider）不可用与不受支持的元数据仍属未知，而不是「假」。

对于已完成的 `analyze_function` 分析卷宗，使用 `inspect_analysis_view`，传入 `view: {kind: "native", facet: "value_flow_operations", offset: 0, limit: 32}` 与精确留存的证据 ID，即可在不再分析的前提下读取选定事实。原生切面还包括过程、伪代码、汇编、基本块、注释、调用方/被调用方、引用、未解析调用、被引用的字符串与名称、原生 API 记录，以及值流摘要。伪代码的 offset 与 limit 以 UTF-16 码元计数；续读时使用返回的 `next_offset`。分析引擎的局限与不可用事实保持显式说明；完整的父证据会被留存。

要查看 Mach-O 在一次运行中实际调用了哪些函数或 Objective-C 方法，使用 `observe_native_calls`，并显式给出断点以及有界的 `duration_ms`/`max_events`。它会在 LLDB 下启动一个新进程，因此目标会运行，可能改动文件或使用网络。启用加固运行时的目标需要 `get-task-allow` 权限。

不带参数调用 `binary_session`，可检查当前打开的目标、选中的分析引擎与对齐情况。其默认的 `result.tool_availability` 包含完整的工具清点，连同可用性原因与补救方式。选择工具时，以该结果中对应的条目为准；当目标或分析引擎状态发生变化时，`tools/list` 保留完整目录。

## 配合 Ghidra 的 DOS MZ

对于已准入的 DOS MZ 目标，使用 `inspect_native_load_image` 将实测的已加载字节、文件映射、重定位与入口点同不可变快照进行核对。`mismatch` 与 `unsupported` 须保持显式。经验证的导入覆盖的是所报告的静态镜像，而不是运行时 DOS 或 PC-98 硬件行为。

使用 `read_bytes` 读取已初始化的分析内存，使用 `address_to_file_offset` 将某一个观测到的地址锚定到原始文件字节。加载器修正可能改动某个字；源偏移并不蕴含字节相等。完整函数体范围采用闭区间端点，且可能包含空洞。不要把外层跨度当作代码。对于加壳目标，需保留原始制品与单独派生出的制品身份；反编译解包 stub 并不能还原已解包的程序。

读取 Objective-C 派发元数据时，要区分类实现方法与协议要求：类方法上报的 requirement 标志为 null，而解码后的协议声明会保留 required 与 optional 事实。属性特性保持为原始的名称/值 token；要得到解码后的 `N` 标记或默认原子行为，请使用属性的 `atomicity` 字段。类/元类标志、ivar 数量、原子性或只读值为 null，意味着所选分析引擎未确立该事实。仅凭符号名称不能证明某个类是根类，也不能证明它没有 ivar。

## 托管 PE/CLI

从 `inspect_managed_artifact` 开始。REA 的规范托管检查是不执行任何代码的：不要声称它加载、反射、执行或解析了该程序集。托管与原生之间的边界，以及不可用的重建事实，须保持显式。自带（BYO）的重建 oracle 与规范解析器相互独立，且不得成为隐式的安装依赖。

### .NET NativeAOT

NativeAOT 二进制包含原生机器码，因此普通的 CIL 反编译器无法还原原始方法体。当托管元数据/CIL 缺失时，应将其归类为原生分析路线，而不是声称完成了源码还原。用选定的深度分析引擎打开该原生镜像，检查函数、字符串、调用与引用；把反编译器输出描述为伪代码与推断。

NativeAOT 镜像可以是 PE/COFF、ELF 或 Mach-O 的可执行文件与共享库。识别它们应依据文件字节与加载器元数据，而不是后缀。对于打包应用，使用 REA 的制品工具进行清点/提取，并保留其中所含镜像的精确身份。PDB、ELF debug 或 dSYM 附属文件，只有在分析引擎接受且匹配它们时，才构成额外证据。

如需更深入的类型还原，可选用第三方 [Ghidra NativeAOT analyzer](https://github.com/Washi1337/ghidra-nativeaot)，它会重建 ReadyToRun 元数据，可还原方法表、类型关系、冻结对象与字符串。这是一个 Ghidra 扩展，有各自的安装方式与交互式工作流；它目前不属于 REA 的托管解析器，也不属于无头 Ghidra 桥接。把它的标注视为分析证据，保留二进制身份，并且不要把还原出的类型当作原始源码呈现。头部的发现可能需要一个符号，或由分析人员自行指明 ReadyToRun 头部，具体取决于二进制与分析器版本。

## 包与提取

当制品图与发现有助于回答问题时，对应用包、归档包、ZIP/APK/IPA/MSIX/AppX、ASAR 或 DMG 输入使用 `inspect_artifact`。它会以内联方式返回完整的制品图。使用图中的 manifest ID 时，须予以引用。

对于 IPA，或 macOS 的 `.app`、ZIP、DMG，把清点证据传给 `project_apple_application_graph`。它按路径约定报告应用根与嵌套 bundle：app extension、XPC service、framework、登录项、系统扩展与驱动扩展，以及插件。它还会列出特权 helper、launchd plist、符号链接，以及每个 bundle 的 `info_plist_path` 与可执行文件候选。角色依据的是路径约定，而不是解析后的 plist；列出的 plist 需用 `inspect_plist` 读取。

对 `.app` 或 Mach-O 执行 `open_binary` 后，使用 `trace_dylib_resolution`，可查看该 bundle 中每个可执行文件的每一条 `@rpath`、`@loader_path` 与 `@executable_path` 加载最终到达哪个文件。它还会列出缺失或弱链接的加载，以及缺席的更早 `@rpath` 候选。用 `roots` 或 `architecture` 收窄大型 bundle。系统路径仍无法确定，因为它们由 dyld 共享缓存提供。

需要将文件实体化时，使用 `extract_artifact`。它不接受参数，会把所有常规文件实体化到由 REA 选定的一个全新临时目录中。符号链接与加密条目属于清点事实，不是可提取的文件。结果会报告实体化后的目录；调用方不选定目标位置。无需单独授予权限。

原生 DMG 遍历在受支持的 macOS 主机上会自动采用只读挂载，并使用自持的临时挂载目录与清理流程。它不需要审批标志。不受支持的主机或挂载失败仍属显式局限；当只有根身份可用时，不要声称已获得子项清点。提取是另一项会写入文件系统的操作。

对于无头部的 DOS COM，需用 `format: "dos-com"` 显式打开（CLI 为 `--target-format dos-com`）。在信任函数分析之前，先检查加载镜像：入口为 `0x10100`，文件偏移为零，并带有强制施加的实模式段上下文。PSP/栈/设备状态仍未被建模。参见 [DOS 指南](https://github.com/morluto/rea/blob/main/docs/ghidra-dos.md)。

### Ghidra 中的函数标注

使用 `annotate_native_function` 设置单个函数名和/或入口注释，且至少包含一处显式改动。查看其标注回读与刷新后的分析卷宗，二者均为内联返回。改动是原子的，且作用域限于会话；空注释会清除它们，省略的字段则保留原值。后续 MCP 调用在关闭之前都能观测到这些编辑。CLI 的 `annotate-native-function` 会在丢弃会话之前返回更新后的分析。原始可执行文件字节不变；编辑会使不可变快照失效。Windows P0 不允许对数据库做改动。若仅需命名，`set_address_name` / `set_addresses_names` 同样可用于 Ghidra：它们为函数入口或数据地址（主标签）命名，并返回按地址给出的紧凑成功布尔值，而不是分析卷宗。

## 离线 PE 资源清点

使用 `inspect_pe_resources` 并传入绝对 `path`，或运行 `rea inspect-pe-resources ./selected.exe --json`，即可在不打开原生目标的情况下进行可移植的 PE32/PE32+ 资源检查。保留返回的证据：类型/名称/语言 ID 与 UTF-16 名称、原始目录/数据/负载区间、代码页、负载哈希与静态图标组引用。同语言图标解析是显式的；缺失的引用与大小不匹配仍然可见。其他负载是不透明的，本操作不解码图像，也不模拟 Windows 资源加载。预算与受支持的树 profile 参见[离线二进制诊断](https://github.com/morluto/rea/blob/main/docs/binary-diagnostics.md)。
