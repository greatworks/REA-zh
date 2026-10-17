# 目标路由手册

第一条命令选错，后面全是返工。这一篇只解决一件事——**给你手上这个目标，
第一步该调什么。**

## 先认形态，再选工具

| 你手上的东西 | 第一步 | 为什么是它 |
| --- | --- | --- |
| 一个 `.exe` / `.dll` / `.so` / `.dylib` / 无后缀可执行文件 | `open_binary` | 原生分析的会话入口 |
| 一个 `.apk` | `inspect_android_package` | 先拿清单与类清点，再决定要不要反编译 |
| 一个 `.ipa`、`.app`、`.dmg` | `open_binary`，随后 `inspect_artifact` | 先当归档看结构，再进原生 |
| 一个 `.zip` / `.msix` / `.appx` | `open_binary`，或直接 `inspect_artifact` | 成员清点本身就是答案时不必开目标 |
| 一个 `.asar` 或已解包的 Electron 目录 | `analyze_javascript_application` | 静态重建，不需要引擎 |
| 一个 `.js` bundle 或网页产物 | `analyze_web_bundle` | 抓取并静态分析 |
| 一个托管 `.dll` / `.exe`（.NET） | `inspect_managed_artifact` | 不加载代码即可看身份与成员 |
| 一个固件 `.bin` / `.img` | `inspect_firmware_regions` | 先只找签名，不急着解包 |
| 一个 HAR 或 mitmproxy 记录 | `inspect_web_network_capture` | 离线，不需要真浏览器 |
| 一个已经打开的浏览器页面 | `list_browser_targets` | 被动，先枚举再选 |
| 一个已经打开的 Electron 应用 | `list_electron_targets` | 同上 |
| 一个 `.core`（Linux x86-64） | `inspect_recorded_crash` | 离线读寄存器与信号 |
| 一段 EVM 字节码 | `inspect_evm_interface` | 明确编码后推断接口候选 |
| 一个 ELF，只想看布局与缓解措施 | `inspect_binary_layout` | 不打开反汇编器，最轻 |
| 一个 PE，只想看资源与图标 | `inspect_pe_resources` | 便携、零引擎 |

## 原生目标的推进顺序

1. `open_binary` 绑定目标，确认 `provider` 与架构。
2. 需要全局印象时 `binary_overview`（IDA 没有这个工具，直接跳过）。
3. 用 `search` 找字符串或过程名，或用 `xrefs` 从已知地址反查引用。
4. `analyze_function` 拿完整函数卷宗，需要伪代码时 `decompile`。
5. 追数据流用 `trace_native_values`，追调用点用
   `resolve_native_call_targets`。
6. 调查结束 `close_binary`。

**别跳步。** 没看总览就直接 `analyze_function`，通常会在错误的地址上浪费
几轮。

## Android 的推进顺序

1. `inspect_android_package` —— 包身份、清单声明、覆盖范围。
2. `search_android_classes` —— 空查询等于全量清点，先建立地图。
3. `inspect_android_class` —— 看某个类的成员。
4. `inspect_android_method` —— 反编译，方法重载有歧义时用 `overload_index`
   明确选择，不要猜。
5. `trace_android_references` —— 查谁调用它。

每一步都自己接 APK 路径，**不要**先开原生会话。

## JavaScript / Electron 的推进顺序

1. `analyze_javascript_application`，体量不明时先 `detail: "summary"`。
2. 用 `inspect_analysis_view` 分页看模块身份，记下 `node_id`。
3. 选定模块后按 `node_id` 取条目，不要按路径猜。
4. 追某个功能用 `trace_application_feature`，从文字串、路由、IPC 通道、
   模块名里挑一个种子。
5. 比对版本先各分析一次，再 `compare_application_versions`。

**双向追踪会膨胀。** 它包含「包含关系」，一次 `both` 可能把一堆无关兄弟模块
拉进来。能用模块条目回答的问题，不要用追踪。

## 运行时观测的前提

只有在静态证据确实答不了、且宿主有对应运行时权限时才做。做之前先想清楚：

- 浏览器 / Electron：需要回环 CDP 端点，且页面或应用是你自己的、已打开的。
- 原生调用：`observe_native_calls` 会**真的启动**一个新进程跑起来，目标可能
  改文件、走网络。加固运行时的目标需要 `get-task-allow`。
- 进程抓取：是「需显式开启」的行为证据，不是安全沙箱。

观测拿到的结论必须与静态证据分开陈述，需要对齐时用
`reconcile_javascript_runtime`。

## 常见误判

| 看起来该这样 | 实际上应该这样 |
| --- | --- |
| 用户说「分析我的应用」，先去满盘搜索 exe | 先问是哪个应用，再定位到唯一制品 |
| 有 IDA 就传 `.idb` 给 `open_binary` | 传原始输入二进制，并设 `provider_id: "ida"` |
| 把 `.zip` 解压到临时目录再用原生工具分析 | 先 `inspect_artifact` 看清成员，再挑真正要分析的那个 |
| 用 `analyze_javascript_application` 分析源码仓库 | 源码仓库用普通读码工具，REA 不解决这个问题 |
| 看到函数名像什么就下结论 | 符号名不构成行为证据，要看调用与数据流 |
| 拿 `.node` 文件名当作已验证的原生导出 | 静态语法观测而已，运行时可达性未知 |
| 比对结果里没看到差异就说「没变」 | 覆盖面不全时只能说未知 |

## 一份能直接照抄的起手式

```text
目标：/path/to/App.app
问题：这个应用的「导出为 PDF」是怎么实现的
证据需求：静态调用链为主，必要时再补运行时
```

对应的动作序列大致是：`open_binary` → `search` 找 "PDF" 相关字符串 →
`xrefs` 看谁引用 → `analyze_function` 顺着调用链往上 →
需要伪代码时 `decompile` → 收尾 `close_binary`。

把这段写成给代理的任务说明，比「帮我分析一下这个 app」有效得多。
