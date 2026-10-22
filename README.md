# REA 逆向工程（中文版）

逆向一切你想逆向的软件工程。让 AI 代理拆解已发布的软件，回答「这个功能是怎么实现的」，并且每一条结论都
能挂回可引用的证据。

底层是 [REA](https://github.com/morluto/rea) —— 一个把二进制、安装包、
Electron、APK、固件与浏览器运行时的分析能力统一成 MCP 服务器与命令行的
工具。本技能是其中文封装：把英文方法论完整汉化，并补上安装接入、引擎配置、
命令索引与自检脚本。

## 适合谁

- 看到别人的产品有个好功能，想知道它是怎么做到的
- 手上只有装好的软件，没有源码，却要维护或替换它
- 需要判断两个版本之间到底改了什么
- 要做兼容实现，必须先看清对方的调用约定与数据格式
- 做安全评估，需要把「观测到的事实」和「猜测」分清楚

## 能分析什么

| 类型 | 例子 |
| --- | --- |
| 原生二进制 | EXE、DLL、SO、DYLIB、Mach-O、ELF |
| 托管程序集 | .NET PE/CLI 程序集、NativeAOT |
| 安装包与归档 | ZIP、APK、IPA、MSIX、AppX、DMG、ASAR |
| JavaScript / Electron | ASAR 包、已解包目录树、网页 bundle |
| Android | APK 的清单、类、方法与静态引用、设备文件 |
| 移动与桌面运行时 | 已打开的浏览器页面、Electron 应用、原生窗口 |
| 固件 | 固件镜像的签名区域定位与提取 |
| 其他 | HAR 抓包、Linux core、PE 资源、EVM 字节码、Swift 符号 |

## 三步上手

**第一步，装运行时。** 需要 Node.js 22.19+ 或 24.11+（不支持 23、25）。

```bash
npm install --global rea-agents@latest
```

**第二步，把 REA 接入你的客户端。** WorkBuddy 用 6.5.0 及以上支持直接注册：

```bash
rea setup --client workbuddy
```

Cursor、Claude Code 等把 `workbuddy` 换成对应标识即可。不建议用 `npx` 跑
`setup`：它会把注册写成 npx 缓存的绝对路径，缓存被回收后工具会静默消失。
不确定环境齐不齐，先跑体检：

```bash
node scripts/rea-doctor.mjs
```

**第三步，直接提问。**

```text
用 REA 看一下这个 Electron 应用的「导出为 PDF」是怎么实现的，
给出调用链和证据 ID，静态看不到的部分标明未知。目标在 D:\Downloads\App
```

## 这个包里有什么

```text
SKILL.md                        主文件：判断顺序、路由、工作法、证据纪律
README.md                       本文件
NOTICE.md                       来源、改动与不含内容声明
LICENSE                         MIT
references/
  quickstart.md                 安装、客户端接入、Windows 实战
  target-routing.md             给什么目标，第一步调什么
  evidence-discipline.md        观测、推断、未知三分类与自检清单
  providers.md                  Hopper、Ghidra、IDA、JADX、Binwalk 配置
  cli-commands.md               155 条命令的中文索引
  mcp-tools.md                  207 个 MCP 工具索引（含 76 个专有工具）
  glossary.md                   术语中英对照
  native-and-artifacts.md       原生、托管与打包制品
  javascript-applications.md    JavaScript 与 Electron 应用
  android-applications.md       Android APK
  runtime-observation.md        浏览器与 Electron 被动观测
  evidence-workflows.md         证据、对比与验证
  connection-and-recovery.md    连接与排障
scripts/
  rea-doctor.mjs                环境体检，输出中文报告
  rea-update.mjs                版本核对与更新提示，默认只读，--install 才装
  rea-register.mjs              注册 MCP，默认只出计划，写入前备份
```

## 它是怎么工作的

**先路由。** 拿到目标先认形态，选对第一条命令。`.apk` 和 `.asar` 该走完全
不同的路，选错了后面全是返工。

**摘要优先。** 体量大的目标先要汇总，再按需下钻。模块按 `node_id` 取，不按
路径猜。同一次分析不重跑。

**证据三分类。** 每条结论都标明是观测、推断还是未知，并引用证据 ID。未知
不等于不存在——没找到不等于没有。

**边界清楚。** 静态分析不等于运行时观测；符号名不构成行为证据；覆盖面不全
就只说未知。

## 边界与前提

- **不含运行时。** 本技能只提供说明书与工具，REA 本体从 npm 安装，分析引擎
  自备。包里没有任何二进制、依赖或授权。
- **引擎按需。** 纯静态 JavaScript、ZIP 清点、离线 ELF 体检不需要任何引擎。
  原生反编译要 Hopper、Ghidra 或 IDA；Android 要 JADX 与 JDK 17+；固件解包
  要 Binwalk 或 Unblob，且限 Linux。
- **平台差异。** Hopper 不支持 Windows；Ghidra 在 Windows 上是实验性只读
  档位。
- **合规使用。** 请只分析你拥有或已获授权的软件，遵守当地法律与软件许可
  协议。本技能不提供绕过授权、破解付费功能或规避技术保护措施的方法。

## 常见问题

**第一次用，要不要自己装 REA？**
要装，但不必你自己去翻文档。装上技能后先跑 `node scripts/rea-doctor.mjs`；
本机缺 REA 时它会摆出两条路线——`npx` 免安装试跑，或全局安装长期使用——
**你确认之后才动手**，它不会静默替你装。

**有新版本会提醒吗？**
分两层看。**REA 运行时**（真正会变、也最容易破坏兼容的那层）：会。每次使用
技能时核对一次 `node scripts/rea-update.mjs`，有新版就在对话里问你要不要更新。
**技能本体**（这些中文文档与脚本，当前 1.0.0）：看已安装技能详情页的版本号；
技能没有后台进程，无法自己检查自己，换版以市场页面的版本号为准。

**装了技能，为什么代理还是说没有 REA 工具？**
技能只是说明书，MCP 要单独注册。跑 `node scripts/rea-register.mjs --client
workbuddy`，确认后加 `--apply`，然后重启会话。注册后如果又突然没了，先跑
`node scripts/rea-doctor.mjs` 看「客户端注册」那一行：它会标出入口版本，写过期
路径的会直接显示「入口已不存在」或「入口 6.4.0」。

**一定要装 Ghidra 吗？**
不一定。先看 `references/target-routing.md`，很多问题用离线体检就能回答。

**需要联网吗？**
分析在本地做。首次安装 REA 需要联网拉 npm 包。

**分析结果可靠吗？**
可靠的是「有证据支撑的部分」，不确定的部分我们要求它明说。任何声称百分之百
确定的逆向结论都值得怀疑。

## 来源与许可

基于 morluto 的 REA（MIT）。上游版权声明原样保留，改动范围见 `NOTICE.md`。
上游项目主页 https://github.com/morluto/rea 。
