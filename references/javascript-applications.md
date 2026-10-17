# JavaScript 与 Electron 应用制品

直接在操作者提供的 ASAR 或解包后的目录树上使用 `analyze_javascript_application`。
当大小未知或较大、且所连接的 schema 声明了 `detail` 时，请求 `detail: "summary"`。
这会返回一条 `inspect_analysis_view` 证据记录，其 ID 独立，并带有指向完整留存应用分析的
`normalized_result.parent_evidence_id`。源码映射的内容属于该静态分析的一部分。先阅读发现、覆盖范围、
局限与未知，然后针对某个具体的未解答问题继续跟进。不支持 `detail` 的旧版服务器在内容放得下时
会以内联方式返回完整的应用证据。

当所连接的 schema 声明了 `max_heap_mb` 与 `analysis_timeout_ms` 时，这两个参数用于选择隔离的源码分析器的
老年代堆与按源码计算的截止时间。默认值分别为 1024 MiB 与 300000 ms。它们不会改变 MCP
进程的堆。受资源限制的分析会保留已完成的静态事实，并报告带有具体未知范围的局部语义覆盖范围；这并不
意味着源码格式有误。在重试某个源码之前，先检查这些限制。
当展开的关系超出父级可用内存时，检查该文件的模块条目视图，以获取留存的 `static_analysis` 与
`semantic_module_analysis`。即使图链接为未知，它们的事实仍然可用。累计结果耗尽可能导致分析在
每个文件都被检查之前就停止；清单与剩余的未知范围可区分该情形。
源码分析开始之后的超时或取消，会在同一会话中保留部分证据。返回的 `error.details.partial_observation`
引用可以直接提供给 `inspect_analysis_view`。如果 SDK 在本地取消，则先从
证据包中取回其记录的 ID，再检查该部分分析。

## 在不重复分析的情况下读取模块

在同一连接上，使用实际返回的父 ID 作为 `source.evidence_id`。
下列 ID 是占位符，需替换为实际返回的值。当模块的节点 ID 尚不可知时，先对身份标识分页，再选择条目。
分页只返回节点 ID、路径与角色；选择一个合适的页大小，并在需要另一页时跟进
`coverage.next_offset`：

```json
{
  "source": {
    "kind": "retained-evidence",
    "evidence_id": "ev_ACTUAL_PARENT_ID"
  },
  "view": { "kind": "page", "collection": "modules", "offset": 0, "limit": 16 }
}
```

按其确切的 `node_id` 与记录的角色选择相关的分页条目：

```json
{
  "source": {
    "kind": "retained-evidence",
    "evidence_id": "ev_ACTUAL_PARENT_ID"
  },
  "view": {
    "kind": "item",
    "collection": "modules",
    "selector": { "node_id": "jag_node_ACTUAL_NODE_ID" }
  }
}
```

模块分页包含资产、打包与源码模块这三类角色，因此同一个路径可能对应多个条目。仅在唯一性已确立时才使用
`selector.path`；返回的节点 ID 使得无需完整清单即可证明唯一性。在存在歧义时，
从分页或错误的候选项中选出匹配的节点 ID。当需要另一页时跟进
`next_offset`。条目会展示该模块节点所记录的观测、身份标识、哈希、导出与源码范围；它并不
包含每一个子级语法观测、关联边或原始源码文件。
条目中缺失的某项事实，并不构成该事实在整个应用中不存在的证据。

## 只追踪尚未解答的问题

针对某个字面的节点 ID、路由、字符串、API、IPC 通道、模块或原生导出，在父应用证据上使用
`trace_application_feature`。对指向种子的关系选择 `incoming`，对离开种子的关系选择
`outgoing`，当问题两者都需要时选择 `both`。追踪遍历包含包含关系，因此即便种子很窄也可能展开出
许多节点；双向追踪可能触及无关的兄弟模块。当模块条目或分页的观测已经能回答问题时，
优先使用它们。不要把所有被触及的节点都当作该特性的参与者。

当服务器声明支持时，复用留存的父证据，或以内联方式提供完整证据。
仅当其制品摘要完全匹配时，才纳入 Hopper 或 Ghidra 证据。

## 恢复超大显示

超大响应会报告 `resource_constraint` 与 `details.resource: "transport"`。
复用 `details.reported_limits.evidence_reference` 配合 `inspect_analysis_view`，
以获取摘要、单个模块或模块身份标识的稳定分页。
`export_evidence_bundle` 会将完整的规范会话写入调用方选定的文件。
这些工作流保留原始证据与覆盖范围；宽泛的后续请求同样可能超出组帧限制。

客户端可能在其文本封装内截断一个成功的结果，而不产生 REA 的 `resource_constraint`。将截断提示或
不完整的 JSON 视为显示局限；不要声称已检查了完整记录。复用已知的
父 ID 以获取更小的视图，或在会话仍然打开时把完整证据导出到选定的文件。如果父 ID 从预览中丢失，
使用先前的分析摘要或显式的账本条目将其找回；不要为了重现同一显示而虚构 ID 或重跑分析。

BrowserWindow 偏好设置、preload 与 contextBridge 的暴露面、IPC 注册、
utility 进程以及原生绑定请求都是静态语法观测。只有唯一的、确切的字面 IPC 通道匹配，
才支持推断出的配对。动态或存在歧义的通道仍属未解决。被请求的 `.node` 成员
并不是已验证的原生导出。绝不要根据静态分析声称运行时可达性、注册、默认值或策略执行情况。

进行版本比较时，先对每个版本各分析一次，然后调用 `compare_application_versions`。
只接受其摘要、源码映射、结构指纹或非模块的语义匹配。模块序号与压缩后的名称
不是持久身份标识。仅在具备完整的对侧覆盖范围时报告新增或移除；否则报告为未知。

当问题问的是某个确切的导出可调用对象所返回的对象形状如何变化时，先对每个版本各分析一次，然后调用
`compare_javascript_export_shapes`，并给出显式的模块路径与导出名。
使用同一连接上、来自两次分析调用的返回 ID，或完整的内联证据记录。
仅通过该工具唯一的、确切的字面判别式来接受变体配对。在把 `unknown` 当作“该名称未被观测到”之前，
先阅读 `property_inventories` 以及每项变更的 `presence`：清单会列出已观测到的属性名，
即使其值仍为未知，并为每个已配对或未配对的变体给出 `source_range`。
数组空洞与因变更而失效的槽位不属于已观测属性。
完整的父级覆盖范围会独立于未解决的值，报告仅表示存在性的 `added`/`removed`。
引用比较证据并报告 JSON Pointer 变化；动态值、存在歧义的变体以及不完整的父属性覆盖范围仍属未知。
这是静态推断，而非运行时行为。当需要运行时语义时，针对相关的应用版本运行行为探针，
并通过可用的浏览器、Electron 或进程工作流将其捕获。

## 复用应用证据

当所连接的服务器声明支持时，应用追踪与比较工具接受完整的内联证据或
`{"kind":"retained-evidence","evidence_id":"ev_<64 lowercase hex characters>"}`
作为其应用输入（`application`，或 `left`/`right`）。`inspect_analysis_view`
在 `source` 中使用同样的留存引用形式，或可移植的内联证据，
来投影出摘要、模块分页，或带有其记录观测的单个模块。该表示法
是模板：请用实际返回的 ID 替换它。4.1.0 之前的版本只接受完整的
内联证据。使用生产者在同一 MCP 连接上返回的确切 ID。解析不会运行
分析，也不会选择分析引擎（provider）；发现结果仍保持内联。原生观测
数组仍然接收完整证据。`close_binary` 会清除留存引用；
在关闭之前导出证据包，或在另一个连接中提供可移植的内联证据。缺失的引用会包含其 ID 与恢复指引。
