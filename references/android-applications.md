# Android 应用制品

使用所连接服务器公布的 Android 工具。仓库 main 分支与 npm 4.1.0 包含该工具族。仅安装技能无法将其添加到较旧的服务器。

从调用方 APK 路径上的 `inspect_android_package` 开始，以获取包标识、清单声明、覆盖范围与内联证据。使用 `search_android_classes` 查找候选项，使用 `inspect_android_class` 获取单个类的成员，使用 `inspect_android_method` 进行反编译，使用 `trace_android_references` 获取入向静态引用。每次调用各自接收自己的 APK 路径与显式选择器；不要先打开原生会话。当方法存在歧义时，从类清单中选择 `overload_index`，而不要猜测。

分析引擎（provider）要求另行提供的无界面（headless）JADX MCP JAR 0.7.1 以及 Java 17 或更高版本。`REA_JADX_MCP_JAR` 选择 JAR 的绝对路径；`JAVA_HOME` 可以选择 Java。REA 的安装配置不会安装或配置该 JAR，且 doctor 的 provider 作用域覆盖的是 Hopper/Ghidra 而非 JADX。使用现有工具，并针对 Android 任务专门报告缺失的前置条件。

Linux 与 macOS 使用 POSIX 自持进程（owned-process）边界。Windows x64 需要与之匹配的随附原生控制组件，并使用带双向 stdio 的自持 Job Object。每台主机都需要完整 JDK，包括 `jdk.compiler`；Windows 下 `JAVA_HOME` 选择 `bin\java.exe`。实际的宿主机验证覆盖范围请查阅 Android 指南。调用使用单个工作进程与 provider 截止时间；可选的 `REA_JADX_HEAP_MIB` 选择 JVM 堆。APK 从不被执行，也不需要模拟器。

清单条目与反编译文本是静态观测，而不是执行或策略生效。入向引用是恢复出的静态关系；反射、动态加载与未解析的调用保持未知。保留制品摘要、位置、诊断信息与不完整的覆盖范围。若要处理归档成员而非进行代码分析，请使用 `open_binary` 与 `inspect_artifact`。
