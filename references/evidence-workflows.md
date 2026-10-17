# 证据、对比与验证工作流

产出证据的工具会把完整的 Evidence 记录直接返回在 MCP `structuredContent` 与 CLI JSON 中。读取 `normalized_result` 以获取操作数据，并在其他工具或你的解释需要稳定引用时引用 `evidence_id`。保留权威性、局限、覆盖范围与残留未知。如果结果不完整或已分页，仅在剩余数据对任务仍有意义时继续获取；不要仅仅为了读取已经内联返回的结果而去拉取 bundle 或资源。当完整的 `inspect_binary_layout` 或 `analyze_javascript_application` 证据已经保留时，改为调用 `inspect_analysis_view` 获取摘要、单个 section/symbol/module 或稳定分页，而不是重复调用产出方。

使用 `record_unknown` 追踪用户调查中尚未解决的问题，并指明仍然需要的权威来源或环境。提供支持性与矛盾性的证据 ID。它会直接更新会话注册表。使用 `update_unknown` 时带上当前修订版本；遇到版本陈旧时应重新读取，而不是盲目重试。只有合格的观测证据才能验证一项解决。

在声称等价或缺失时，应使用页面集合完整且相互兼容的对比：

- `compare_artifacts` 按出现路径、内容、元数据与图关系对比清单页面。
- `compare_functions` 对比显式的函数证据，而不是模糊的整二进制匹配。
- `compare_bundles` 对比规范化 bundle 成员关系与未知历史。
- `find_changed_behavior` 组合已有的对比；静态差异仍然只是候选，而不是因果证明。
- `build_call_path` 需要来自同一构件／提供方的显式函数分析卷宗；前沿不完整会使缺失成为未知。
- `correlate_static_and_runtime` 使用显式映射；模式匹配只是假设，而不是因果关系。
- `verify_reconstruction` 评估一个有穷的类型化规范。一次通过只覆盖已声明的可对比主张，而不是全局等价。

进程抓取是需显式开启的行为证据，而不是安全沙箱。V3 抓取无法升级为 V4；应重新运行原始场景。区分根进程退出与后代进程收尾，并在任务需要时要求新鲜度。一个必须在超时阈值内写出最终报告的目标需要 `finalization_ms`：REA 向被抓取的根进程发送 SIGTERM，继续观测，并且仅当目标在该区间结束时仍未退出，才发送一次 SIGKILL。`exit.finalization.signals` 列出每次尝试及其投递结果；观测到的退出信号保留在 `exit.signal` 中，`exit.code` 在每一次超时阈值退出中均为 null，而自行退出的终结器其代码位于 `exit.finalization.exit_code`（信号退出时为 null，或未观测到退出时为 null）。
