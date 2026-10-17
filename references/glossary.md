# 术语与中英对照

本技能所有中文文档使用同一套译法。工具名、字段名、命令名、JSON 键与 URL
一律保留英文原样，不做翻译。

## 核心概念

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| Evidence | 证据、证据记录 | 工具产出的规范化结果记录，带唯一 `evidence_id` |
| Evidence bundle | 证据包 | 可导出的完整会话证据集合 |
| retained evidence | 留存证据 | 会话内仍可按 ID 引用的证据 |
| inline evidence | 内联证据 | 直接写在响应体里的完整证据 |
| evidence_id | 证据 ID | 字段名保留英文 |
| observation | 观测 | 工具实际读到的内容 |
| inference | 推断 | 由观测推出、尚未证实的结论 |
| unknown | 未知 | 既不能证实也不能证伪，**不等于不存在** |
| coverage | 覆盖范围 | 分析了多少，缺了什么 |
| limitation | 局限 | 方法本身无法到达的边界 |
| authority | 权威性、适用边界 | 某条证据能证到什么范围 |

## 目标与产物

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| artifact | 制品 | 被分析的文件、包或镜像 |
| target | 目标 | 当前绑定的分析对象 |
| archive / package | 归档包、安装包 | ZIP、APK、IPA、MSIX、AppX、DMG |
| member | 成员 | 归档内的单个条目 |
| inventory | 清点、盘点 | 成员与元数据的完整列表 |
| digest | 摘要 | 通常指 SHA-256 |
| managed assembly | 托管程序集 | .NET 的 PE/CLI 程序集 |
| native binary | 原生二进制 | 机器码目标 |
| firmware image | 固件镜像 | 需要解包的设备固件 |
| ASAR | ASAR 包 | Electron 的归档格式，不译 |
| pseudo-code | 伪代码 | 反编译器输出，不是源码 |
| basic block | 基本块 | 控制流单位 |
| callers / callees | 调用方、被调用方 | 入边、出边 |
| relocation | 重定位 | 加载期地址修正 |
| mitigation | 缓解措施 | 如 ASLR、NX、栈保护 |

## 分析引擎与进程

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| provider | 分析引擎（provider） | Hopper、Ghidra、IDA、JADX 等后端 |
| session | 会话 | 一次打开目标到关闭的周期 |
| owned process | 自持进程 | 由 REA 创建并负责回收的进程 |
| fail-closed | 失败即关闭 | 宁可报错也不给出不可靠结果（fail-closed） |
| bring-your-own | 自带（BYO） | 由用户自行提供的引擎或工具 |
| passive | 被动 | 只观察，不触发、不交互 |
| runtime observation | 运行时观测 | 目标真的跑起来后采集的证据 |
| process capture | 进程抓取 | 受控运行一次进程并记录 |

## 工作方式

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| summary-first | 摘要优先 | 先要汇总，再按需下钻 |
| page | 分页 | 按 offset/limit 取一页身份 |
| node_id | 节点 ID | 字段名保留英文，图里节点的稳定标识 |
| trace | 追踪 | 沿引用关系走一条路径 |
| reconciliation | 对齐 | 把静态证据与运行时证据对上 |
| residual unknown | 残留未知 | 调查结束后仍未解决的问题 |
| regress | 回退、退化 | 版本或行为上的倒退 |
| stale registration | 过期注册 | 配置还在但指向旧版本或旧路径 |

## 不翻译的清单

以下内容在任何文档里都保持英文原样：

- 所有工具名，如 `open_binary`、`inspect_analysis_view`
- 所有命令名，如 `inspect-binary-layout`、`analyze-javascript-application`
- 所有字段名与 JSON 键，如 `normalized_result`、`parent_evidence_id`
- 所有环境变量，如 `GHIDRA_INSTALL_DIR`、`REA_JADX_MCP_JAR`
- 所有客户端标识，如 `claude_code`、`workbuddy`
- 产品名与项目名，如 REA、Hopper、Ghidra、IDA、JADX、Binwalk、Unblob
- 文件路径、URL、代码块内容

## 写作约定

- 中文用全角标点，代码、字段、命令内部一律 ASCII。
- 首次出现的专有名词可在括号内附英文，例如「证据（Evidence）」，后文直接用中文。
- 「未知」不写成「没有」，两者在逆向里是完全不同的结论。
- 不写「显然」「肯定」这类词，除非有对应证据 ID 支撑。
