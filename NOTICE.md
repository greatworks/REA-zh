# 来源与改动声明

本技能是 [REA](https://github.com/morluto/rea) 官方技能
`reverse-engineer-anything` 的简体中文本地化版本，面向 WorkBuddy 应用市场
分发。

## 上游

| 项目 | 内容 |
| --- | --- |
| 仓库 | https://github.com/morluto/rea |
| npm 包 | `rea-agents` |
| 许可证 | MIT（Copyright (c) 2026 morluto） |
| 汉化依据版本 | 6.4.0（本机安装版本）与 6.5.0（当前 npm 最新版）的官方技能文档 |
| 中文版维护 | 令狐杨过 JW |

## 改了什么

**只改语言与呈现，不改工具契约。**

1. `references/` 下 6 篇工作流文档由英文原文逐段译为中文：代码块、JSON 示例、
   工具名、命令名、字段名、环境变量、路径与 URL 一律保持原样，未做任何改写。
2. `SKILL.md` 依据上游结构中文重写，保留其判断顺序、边界与禁止项，并按中文
   表达习惯重组了行文。
3. 新增下列原创内容，这些不是翻译，是本版本的工作量所在：
   - `references/quickstart.md` 安装、客户端接入与 Windows 实战
   - `references/providers.md` Hopper、Ghidra、IDA、JADX、Binwalk 的配置与边界
   - `references/target-routing.md` 目标路由决策手册
   - `references/evidence-discipline.md` 证据三分类与自检清单
   - `references/cli-commands.md` 155 条命令的中文索引
   - `references/glossary.md` 术语与中英对照
   - `scripts/rea-doctor.mjs` 中文环境体检
   - `scripts/rea-register.mjs` MCP 注册助手（默认只读计划，写入前备份）

## 没有包含什么

本包**不含** REA 的运行时本体、`dist/` 构建产物、`node_modules` 依赖或任何
分析引擎。运行时通过 npm 安装：

```bash
npm install --global rea-agents@latest
# 或
npx -y rea-agents@latest <命令>
```

这意味着本技能买到的是中文方法论、路由手册、命令索引与自检工具，运行时本体
仍来自上游的公开 MIT 包。这一点在商品页上也应当说明，不要让人误以为购买
包含引擎或授权。

## 商标与第三方

REA 为其作者的项目名。Hopper、IDA、Ghidra、JADX、Binwalk、Unblob、Node.js、
Claude、Cursor、WorkBuddy 等名称归各自权利人所有。本技能不包含、也不再分发
这些软件的任何部分，仅提供配置说明。

## 许可证

本包整体沿用上游的 MIT 许可证，全文见 `LICENSE`。上游版权声明已原样保留。
