<p align="center"><img src="icon.png" width="120" alt="GridCraft Bridge 图标"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <b>简体中文</b> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  让 Claude 使用你电脑上安装的 <b>GridCraft</b> 创建和读取电子表格 —— <b>Windows、macOS 和 Linux</b>：<br>
  带实时公式的工作表、表格、格式、条件格式、图表和数据透视表，计算结果，xlsx、csv、json、html 和 pdf。
</p>

---

## 为什么

[GridCraft](https://github.com/storytold/gridcraft) 是一款开源的 Excel 级电子表格应用，带有无界面 CLI（`gridcraft-cli`）、339 条命令、513 个工作表函数（包括动态数组）、以 XLSX 为原生格式以及 MCP 模式。本 [Model Context Protocol](https://modelcontextprotocol.io) 服务器把这个引擎变成 Claude 可用的 **“文件进 / 文件出”工具**，你可以这样提问：

> *“做一个带公式、汇总表和图表的月度预算工作簿，输出 XLSX 和 PDF。”*
> *“读取 `销售.xlsx`，告诉我各地区的合计和最好的月份。”*
> *“给这个工作簿加一个按地区和产品统计收入的数据透视表。”*
> *“把 `D:\报表` 中所有工作簿里的 '2025' 换成 '2026' 并保存副本。”*
> *“把这个 CSV 转成带格式表格的 Excel，并把这个文件夹里的所有工作簿转成 CSV。”*

同系列项目： [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) 和 [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 平台

| 系统 | 需要安装的 GridCraft 包 | 服务器自动查找的位置（无需配置） | 状态 |
| --- | --- | --- | --- |
| **Windows** 10/11（x64、x86、arm64） | MSI 或便携 zip | `C:\Program Files\GridCraft`、`%LOCALAPPDATA%\Programs\GridCraft`、`PATH` | ✅ 已验证（Windows 11） |
| **Linux**（x86_64、aarch64） | `.deb`、`.rpm` 或 `.tar.gz` | `/usr/bin`、`/usr/local/bin`、`/opt/gridcraft/bin`、`~/.local/bin`、`PATH` | ✅ 已验证（Debian 12，无界面） |
| **macOS** 11+（Apple 芯片和 Intel） | `.dmg`（应用）**加上** `gridcraft-cli-<版本>-macos-universal.zip` | `/Applications/GridCraft.app`、`/usr/local/bin`、`/opt/homebrew/bin`、`~/.local/bin`、`~/bin`、`PATH` | 🟡 已支持，尚未在 Mac 上测试 |

全部下载：[GridCraft 发布页](https://github.com/storytold/gridcraft/releases)（另有 FreeBSD 的 tar.gz，将 `GRIDCRAFT_DIR` 指向它即可）。其他位置：设置 `GRIDCRAFT_DIR`（文件夹、`.tar.gz` 根目录或 `GridCraft.app`）或 `GRIDCRAFT_CLI`。

- **macOS：** DMG 只包含应用。解压单独的 `gridcraft-cli` zip，把 `gridcraft-cli` 移到 `/usr/local/bin`（或用 `GRIDCRAFT_CLI` 指向它）。首次运行会联网检查 Apple 公证。
- **Linux：** AppImage 和 Flatpak 只包含应用，不含 `gridcraft-cli`；请使用 deb、rpm 或 tar.gz。若应用是 AppImage，请设置 `GRIDCRAFT_APP`，以便 `open_in_gridcraft` 能启动它。在没有 GPU 的服务器上，已验证的环境安装了 `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`。

## 工作原理

| 组成部分 | 说明 |
| --- | --- |
| **GridCraft 引擎**（`gridcraft-cli mcp`） | GridCraft 自己的引擎：单元格、拥有 513 个函数的计算引擎、样式、数字格式、表格、条件格式、数据验证、图表、数据透视表以及 XLSX / CSV / JSON / HTML / PDF 写出器。每个任务都以全新的**无界面**方式启动，绝不会碰到 GridCraft 应用或已打开的工作簿。 |
| **MCP 服务器**（Node.js） | 9 个高层工具。根据对工作表的简单描述（数据和公式、表头、表格、汇总行、格式、规则、图表）构建工作簿，为数据透视表工作表命名，提前检查每个输出，并返回每个工作表前几行的**计算结果**以及所有公式错误，让助手看到公式算出的值。 |
| **实时应用**（可选） | `open_in_gridcraft control=true` 以仅限本机的控制通道（端口 7979）启动应用，`run_gridcraft_commands live=true` 对其进行操作。用完请关闭应用。 |

## 工具

| 工具 | 功能 |
| --- | --- |
| `create_workbook` | 根据工作表新建工作簿（或使用示例：budget、sales、grades）：数值和公式、表头样式、Excel 表格、汇总行、数字格式、字体、颜色、边框、合并单元格、条件格式（突出显示、数据条、色阶、图标集）、下拉列表、批注、图表（17 种）、冻结窗格、打印设置；数据透视表；主题和属性 |
| `edit_workbook` | 单个工作簿、列表或文件夹：写入数值和公式，查找替换，插入或删除行列，排序，删除重复项，添加、重命名或删除工作表，格式、条件格式、表格、图表、数据透视表；另存为新副本 |
| `read_workbook` | 读取区域或工作表的计算结果、公式或显示文本，并在不修改工作簿的情况下计算公式 |
| `convert_workbook` | 单个工作簿、列表或文件夹 → xlsx、csv、tsv、json、html、pdf（单个工作表或全部） |
| `get_workbook_info` | 工作表的已用区域、表格、图表、合并、筛选、冻结窗格、规则、数据验证、批注；定义的名称；前几行的计算结果；公式错误 |
| `list_gridcraft_catalog` | 339 条命令及参数、513 个工作表函数及其语法、图表类型、示例、格式 |
| `run_gridcraft_commands` | 在一个会话中运行任意引擎命令以及 `write_range`、`read_range`、`set_cell`、`evaluate_formula`、`format_range`、`insert_chart`...（支持 `$steps[N].字段` 引用），无界面或实时模式，然后保存 |
| `open_in_gridcraft` | 在 GridCraft 应用中打开工作簿（或示例），可选启用控制通道 |
| `get_gridcraft_status` | 平台、安装、版本、命令、函数、应用 / 控制端口 |

| | |
| --- | --- |
| **打开** | xlsx、xlsm、xls（数值、公式、数字格式）、xlsb 和 ods（数据）、csv、tsv、txt、json |
| **保存** | xlsx（所有工作表、公式、样式、表格、图表、数据透视表）、csv、tsv、json、html、pdf |

单元格使用 **A1** 表示法（`B2`、`A1:D10`）；在公式中，带空格的工作表名要加单引号（`'我的表'!A1`）。以 `=` 开头的文本是公式；`12%` 或 `2026-03-01` 这样的文本按输入时的方式解析。

## 示例

```json
{
  "name": "Sales 2026",
  "sheets": [
    {
      "name": "Data",
      "data": [
        ["Region", "Product", "Units", "Price", "Total"],
        ["North", "A", 10, 12.5, "=C2*D2"],
        ["South", "A", 8, 12.5, "=C3*D3"],
        ["North", "B", 12, 20, "=C4*D4"],
        ["South", "B", 9, 20, "=C5*D5"]
      ],
      "table": true,
      "totals_row": ["none", "none", "sum", "average", "sum"],
      "formats": [{ "range": "D2:E6", "number_format": "Currency" }],
      "conditional_formats": [{ "range": "E2:E5", "type": "data_bar" }],
      "validations": [{ "range": "A2:A5", "list": ["North", "South", "East", "West"] }],
      "charts": [{ "range": "A1:A5", "type": "column", "title": "Units", "at": "G2" }]
    },
    {
      "name": "By region",
      "data": [["Region", "Total"], ["North", "=SUMIFS(Data!E:E,Data!A:A,A2)"], ["South", "=SUMIFS(Data!E:E,Data!A:A,A3)"]],
      "formats": [{ "range": "B2:B3", "number_format": "Currency" }],
      "charts": [{ "range": "A1:B3", "type": "pie", "title": "Sales by region", "at": "D2" }]
    }
  ],
  "pivots": [{ "source": "Data!A1:E5", "rows": ["Region"], "columns": ["Product"], "values": [{ "field": "Total", "func": "sum" }] }],
  "formats": ["xlsx", "pdf"],
  "output_dir": "C:\\Sheets"
}
```

## 要求

- 带 `gridcraft-cli` 的 **GridCraft**（已用 **0.6.1** 测试）；见[平台](#平台)
- Node.js ≥ 20（通过 `.mcpb` 安装时由 Claude Desktop 自带）

## 安装

### Claude Desktop（推荐，所有平台）

1. 从[最新发布](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)下载 `gridcraft-mcp-server.mcpb`。
2. 双击它（或拖入 Claude Desktop → *设置 → 扩展*），然后点击 **安装**。
3. 可选：如果 GridCraft 不在标准位置，在扩展设置中填写其文件夹或 `gridcraft-cli` 的路径。

### Sunsam Code

从 [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) 插件市场安装 **GridCraft Bridge**，或把 `.mcpb` 拖到 *MCP → 安装扩展*。

### Codex（OpenAI）

**推荐 —— 插件市场（可获得更新）：** *插件 → 添加 → 添加插件市场*，来源 `jhonsu01/craft-marketplace`，引用 `main`，然后从 **Craft Bridges** 安装 **GridCraft Bridge**（[craft-marketplace](https://github.com/jhonsu01/craft-marketplace)）。刷新插件市场即可获得新版本。或者上传 zip（Codex 会把它保存在你的账户中，并拒绝同名的新版 zip）：

1. 从[最新发布](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)下载 `gridcraft-mcp-server-<版本>-codex.zip`。
2. 在 Codex 中：*插件 → 添加 → 新插件*，选择该 zip，然后点击 **添加插件**。
3. Codex 用 `node` 启动服务器，因此 `PATH` 中必须有 Node.js ≥ 20。如果 GridCraft 不在标准位置，请把 `GRIDCRAFT_DIR` 或 `GRIDCRAFT_CLI` 设为系统环境变量（Codex 没有本地插件的设置表单）。

### DeepSeek Harness

1. *Plugins → Add plugin*，输入 `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server`，点击 **Install**，再点击 **Enable now**。
2. Harness 用自带的 MCP 客户端和 `node`（`PATH` 中需有 Node.js ≥ 20）启动服务器；工具显示为 `mcp__gridcraft__<工具>`，输出文件显示为可在 Harness 中打开的卡片。
3. Harness 目前不会自动更新插件：要更新，请卸载插件后用同一地址重新安装。

### Claude Code / 其他 MCP 客户端

```bash
git clone https://github.com/jhonsu01/gridcraft-mcp-server.git
cd gridcraft-mcp-server
npm install
npm run build
```

Windows：

```bash
claude mcp add gridcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux：

```bash
claude mcp add gridcraft -- node "$PWD/dist/bundle.cjs"
```

## 配置

| 变量 | 含义 |
| --- | --- |
| `GRIDCRAFT_DIR` | GridCraft 文件夹、其中某个可执行文件、`.tar.gz` 根目录（含 `bin/`）或 `GridCraft.app`。默认：自动检测 |
| `GRIDCRAFT_CLI` | `gridcraft-cli` / `gridcraft-cli.exe` 的路径（优先于 `GRIDCRAFT_DIR`） |
| `GRIDCRAFT_APP` | 桌面应用在其他位置时的路径（例如 Linux 的 AppImage） |
| `GRIDCRAFT_CONTROL_PORT` | 桌面应用的控制端口（默认 7979） |
| `GRIDCRAFT_MCP_TIMEOUT` | 每次调用引擎的最长秒数（默认 3600） |

## 安全

- 除非设置 `overwrite: true`，否则**绝不覆盖**文件：在文件夹中会使用空闲的名称（`_2`），已存在的 `output_path` 会报错。输入文件只读；编辑后的文件只会另存为新副本（`_edited`）。
- 所有路径必须是绝对路径。引擎以无界面方式运行，除非 `live: true`，绝不会影响 GridCraft 应用。
- 一切都在本地运行，不访问网络。每个任务使用独立引擎，运行在结束后会被删除的临时文件夹中。

## 开发

```bash
npm run build       # TypeScript + 单文件 bundle（dist/bundle.cjs）
npm test            # 单元测试（Windows、macOS 和 Linux 路径逻辑）
npm run test:e2e    # 25 项端到端检查（`E2E_LIVE=1` 时 27 项），通过真实 MCP stdio 运行（合成 CSV）
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 插件 zip
```

在 Docker 中测试 Linux（先解压 `gridcraft-<版本>-linux-x86_64.tar.gz`）：

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## 许可证

Apache-2.0。GridCraft 版权归其作者（Storytold）所有，采用 MIT 或 Apache-2.0。
本项目与 GridCraft 或 Storytold 无关，也未获其认可。Excel 是 Microsoft 的商标。
