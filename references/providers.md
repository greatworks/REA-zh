# 分析引擎配置

REA 自己不带反编译器。原生反编译要用你已有的 Hopper、Ghidra 或 IDA；Android
要用 JADX；固件解包要用 Binwalk 或 Unblob。REA 负责编排与证据规范化，不负责
安装这些软件。

先看清现状：

```bash
rea providers --json
rea doctor --provider ghidra --json
rea capabilities --json
```

`capabilities` 会列出每个引擎能做哪些操作、各自有什么副作用，比猜可靠。

## 选型建议

| 场景 | 建议 | 理由 |
| --- | --- | --- |
| 只想看 ELF 布局、符号、缓解措施 | 不用引擎，`inspect-binary-layout` | 离线、零配置 |
| macOS 上做原生反编译 | Hopper | 启动快，REA 桥接成熟 |
| 跨平台、要可脚本化 | Ghidra headless | 无界面、可批处理，Windows 也能跑（只读） |
| 已经有 IDA 工作流 | IDA | 复用既有数据库与习惯 |
| Android APK 方法级分析 | JADX | 唯一路径 |
| 固件解包 | Binwalk 或 Unblob | Linux 上由调用方提供 |

## Hopper

**平台**：macOS、Linux。**Windows 不支持**，`setup` 也不会在 Windows 装它。

**前置**：Hopper 是独立商业软件，自带许可。免费 demo 有厂商定义的调用限制。
自动安装器支持 macOS 12 以上、Ubuntu 24.04 以上、Fedora 41 以上、Nobara 44、
64 位 Arch、CachyOS、Omarchy；其他 Linux 只要你有可用的启动器，用
`HOPPER_LAUNCHER_PATH` 指过去即可。

**配置**

```bash
export HOPPER_LAUNCHER_PATH=/absolute/path/to/Hopper
export REA_HOPPER_STARTUP_TIMEOUT_MS=120000   # 默认 120000
rea doctor --provider hopper --json
```

**探测顺序**

- macOS：系统应用 → `~/Applications` 下由 `rea setup` 安装的 → `/Applications`
  与 `~/Applications` 下其它 `Hopper*.app`
- Linux：`/opt/hopper/bin/Hopper` → `~/.local/share/rea/hopper/bin/Hopper` →
  `/opt/hopper-v4/bin/hopper` → `/usr/bin/hopper`

**已知限制**

- macOS 当前不支持打开 `.hop` 数据库作为目标，请选原始可执行文件。
- Linux 上同一用户只允许一个 Hopper 应用实例。
- macOS 拒绝 Apple Events 时，要去「系统设置 → 隐私与安全性 → 自动化」里
  允许启动 REA 的那个应用。
- 看到 `Executing Python Script...` 覆盖层不代表卡死，结束时用 `close_binary`
  清理。

## Ghidra

**平台**：Linux x64/arm64、macOS x64/arm64、Windows x64（实验性 P0）。

**前置**

- 必须连接**已存在**的 Ghidra 安装，REA 不构建、不安装、不改 Gatekeeper 设置。
- 接受 Ghidra **12.1.x** 与安装声明的 64 位完整 JDK。12.1 需要 **JDK 21+**，
  已在 12.1.4 + JDK 21 上验证。
- 每个安装必须带宿主架构的原生反编译器
  （`Ghidra/Features/Decompiler/os/<platform>/`）。
- 需要 `support/analyzeHeadless` 与 `javac` 可用。
- 每次会话用临时项目与隔离的 home/cache/config，传 `-readOnly`、
  `-deleteProject`，从不打开你已有的用户项目。

**配置**

```bash
export GHIDRA_INSTALL_DIR=/absolute/path/to/ghidra_12.1.4_PUBLIC
export JAVA_HOME=/absolute/path/to/jdk-21        # java 在 PATH 上时可省
export REA_GHIDRA_STARTUP_TIMEOUT_MS=330000      # 默认 330000
export GHIDRA_HEADLESS_MAXMEM=512M               # 优先于 GHIDRA_MAXMEM，默认 2G
rea doctor --provider ghidra --json
```

Windows（PowerShell）：

```powershell
$env:GHIDRA_INSTALL_DIR = "C:\tools\ghidra_12.1.4_PUBLIC"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:GHIDRA_HEADLESS_MAXMEM = "1G"
rea doctor --provider ghidra --json
```

**能力边界**：Ghidra 提供 26 个只读操作（14 个清点、命名与搜索，12 个函数
分析）。Linux/macOS 上 `annotate_native_function`、`set_address_name`、
`set_addresses_names` 可以改会话内元数据，关闭会话即丢弃。**Windows P0 完全
只读，不能改数据库。**

**其他有用的变量**

| 变量 | 作用 |
| --- | --- |
| `REA_ANALYSIS_PROVIDER=ghidra` | 同时装了多个引擎时明确选 Ghidra |
| `REA_GHIDRA_LANGUAGE_ID` | 强制指定处理器语言，如 `x86:LE:32:default` |
| `REA_GHIDRA_COMPILER_SPEC_ID` | 指定编译器规格，需要配合语言 |
| `REA_GHIDRA_SEED_FILE` | 种子文件，每行 `address<TAB>kind[<TAB>name]` |
| `REA_GHIDRA_DISABLED_ANALYZERS` | 逗号分隔，禁用指定分析器 |

**内存优先级**：`GHIDRA_HEADLESS_MAXMEM` → `GHIDRA_MAXMEM` → `2G`，最终成为
JVM 的 `-Xmx`。REA 会清掉继承来的 `_JAVA_OPTIONS`、`JAVA_TOOL_OPTIONS`、
`JDK_JAVA_OPTIONS`，自己拥有 `GHIDRA_HEADLESS_JAVA_OPTIONS`。

## IDA

**前置**：需要已有的 IDA 安装与 MCP 配置。REA 的注册与安装复用
[mrexodia/ida-pro-mcp](https://github.com/mrexodia/ida-pro-mcp)，不自己构建
组件。

**用法**：`open_binary` 传**原始输入二进制**，并设 `provider_id` 为 `ida`。
不要传 `.idb` 或 `.i64` 数据库。

- 传统「附加」档：按 SHA-256 绑定已经打开的 GUI 输入，并把它的数据库保持
  打开。
- 新的「无界面」档：创建并关闭一个自持的私有数据库，不保存。

打开后直接进 `analyze_function`、伪代码、函数与字符串搜索。**IDA 不提供
`binary_overview`。** 它的结果来自实时查询，不会从快照重放；不可用的部分
保持未知。

细节见上游的 [IDA provider 指南](https://github.com/morluto/rea/blob/main/docs/ida-provider.md)。

## JADX（Android）

**前置**

- 需要单独提供的无界面 JADX MCP JAR **0.7.1**，以及 **Java 17 或更高**。
- `REA_JADX_MCP_JAR` 指向该 JAR 的绝对路径；`JAVA_HOME` 用来选 Java。
- 需要完整 JDK（含 `jdk.compiler`）。Windows 上用 `JAVA_HOME` 选
  `bin\java.exe`。
- `rea setup` **不会**安装或配置这个 JAR，`doctor` 的 provider 检查也只覆盖
  Hopper 与 Ghidra，不含 JADX。缺什么就明说缺什么。

**配置**

```bash
export REA_JADX_MCP_JAR=/absolute/path/to/jadx-mcp.jar
export JAVA_HOME=/absolute/path/to/jdk-17
export REA_JADX_HEAP_MIB=2048              # 可选，JVM 堆上限
export REA_JADX_OPERATION_TIMEOUT_MS=120000  # 可选，单次操作超时
```

**过程边界**：Linux/macOS 用 POSIX 的自持进程边界；Windows x64 用自持的
Job Object 加双向 stdio，依赖包内匹配的原生控件。**APK 从不被启动，也不需要
模拟器。**

## 固件：Binwalk / Unblob

REA 只做编排，工具由你提供，且目前限定在 Linux 宿主上使用。

- 先看候选区域：`inspect-firmware-regions`（只找签名，不提取）
- 要落地文件：`extract-firmware`，输出目录必须由你指定为一个新的绝对路径

解包出的内容与原始镜像的对应关系会作为来源信息保留。不要用「解包出来的
文件结构」反推设备运行时的行为。

## Linux 通用前置

Linux 上 REA 的共享进程监督器在做归属检查前需要 `PATH` 里有兼容 procps 的
`ps`（Ghidra、JADX、固件工具、静态 JS/Electron 分析都会用到）。缺了会在子
进程启动前直接拒绝，错误码可能是 `capability_unavailable`、
`provider_unavailable` 或 `execution_failure`。

装发行版的 `procps` 或 `procps-ng` 即可。

## 不要做的事

- 不要为了修一次调用失败而重装引擎。先分辨是注册问题、客户端审批还是引擎
  缺失，三者修法完全不同。
- 不要让 REA 去装无关软件。它的 setup 只做被授权的范围。
- 不要在没有证据 ID 的情况下描述引擎「确认了」某个行为。
