<p align="center"><img src="icon.png" width="120" alt="GridCraft Bridge icon"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <b>English</b> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Let Claude build and read spreadsheets with the <b>GridCraft</b> installed on your computer — <b>Windows, macOS and Linux</b>:<br>
  sheets with live formulas, tables, formats, conditional formatting, charts and PivotTables, computed values, xlsx, csv, json, html and pdf.
</p>

---

## Why

[GridCraft](https://github.com/storytold/gridcraft) is an open-source, Excel-class spreadsheet app with a headless CLI (`gridcraft-cli`), 339 commands, 513 worksheet functions (dynamic arrays included), XLSX as its native format and an MCP mode. This [Model Context Protocol](https://modelcontextprotocol.io) server turns that engine into **file-in / file-out tools** for Claude, so you can ask things like:

> *"Build a monthly budget workbook with formulas, a summary sheet and a chart, as XLSX and PDF."*
> *"Read `sales.xlsx` and tell me the total by region and the best month."*
> *"Add a PivotTable of revenue by region and product to this workbook."*
> *"In every workbook in `D:\Reports`, replace '2025' with '2026' and save copies."*
> *"Convert this CSV to Excel with a formatted table, and every workbook in this folder to CSV."*

Sibling of [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) and [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Platforms

| OS | GridCraft package to install | Where the server finds it (no setup needed) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI or portable zip | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Verified (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` or `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verified (Debian 12, headless) |
| **macOS** 11+ (Apple silicon and Intel) | `.dmg` (the app) **plus** `gridcraft-cli-<version>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Supported, not yet tested on a Mac |

All downloads: [GridCraft releases](https://github.com/storytold/gridcraft/releases) (there is also a FreeBSD tar.gz; set `GRIDCRAFT_DIR` to it). Anywhere else: set `GRIDCRAFT_DIR` (folder, `.tar.gz` root or `GridCraft.app`) or `GRIDCRAFT_CLI`.

- **macOS:** the DMG contains only the app. Unzip the separate `gridcraft-cli` zip and move `gridcraft-cli` to `/usr/local/bin` (or point `GRIDCRAFT_CLI` at it). The first run checks Apple's notarization online.
- **Linux:** the AppImage and Flatpak contain only the app, not `gridcraft-cli`; use the deb, rpm or tar.gz. For an AppImage app, set `GRIDCRAFT_APP` so `open_in_gridcraft` can start it. On a server without a GPU, the verified setup used `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## How it works

| Part | What it is |
| --- | --- |
| **GridCraft engine** (`gridcraft-cli mcp`) | GridCraft's own engine: cells, the calculation engine with 513 functions, styles, number formats, tables, conditional formats, validation, charts, PivotTables and the XLSX / CSV / JSON / HTML / PDF writers. Started fresh and **headless** for each job, so it never touches the GridCraft app or an open workbook. |
| **MCP server** (Node.js) | 9 high-level tools. Builds workbooks from a simple description of sheets (data and formulas, header, table, totals row, formats, rules, charts), names PivotTable sheets, checks every output first and returns the **computed values** of the first rows of every sheet plus any formula errors, so the assistant sees what the formulas give. |
| **Live app** (optional) | `open_in_gridcraft control=true` starts the app with its loopback-only control channel (port 7979) and `run_gridcraft_commands live=true` drives it. Close the app when you are done. |

## Tools

| Tool | What it does |
| --- | --- |
| `create_workbook` | A new workbook (or a sample: budget, sales, grades) from sheets: values and formulas, header styling, Excel tables, totals rows, number formats, fonts, colours, borders, merges, conditional formatting (highlights, data bars, colour scales, icon sets), drop-down lists, notes, charts (17 types), frozen panes, print setup; PivotTables; theme and properties |
| `edit_workbook` | One workbook, a list or a folder: write values and formulas, find and replace, insert or delete rows and columns, sort, remove duplicates, add, rename or delete sheets, formats, conditional formats, tables, charts, PivotTables; written as a new copy |
| `read_workbook` | Computed values, formulas or display text of a range or sheet, and formulas evaluated against the workbook without changing it |
| `convert_workbook` | One workbook, a list or a folder → xlsx, csv, tsv, json, html, pdf (one sheet or every sheet) |
| `get_workbook_info` | Sheets with used ranges, tables, charts, merges, filters, frozen panes, rules, validations, notes; defined names; first rows as computed values; formula errors |
| `list_gridcraft_catalog` | 339 commands with parameters, 513 worksheet functions with signatures, chart types, samples, formats |
| `run_gridcraft_commands` | Any engine commands plus `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... in one session (`$steps[N].field` references), headless or live, then save |
| `open_in_gridcraft` | Open workbooks (or a sample) in the GridCraft app, optionally with the control channel |
| `get_gridcraft_status` | Platform, installation, version, commands, functions, app / control port |

| | |
| --- | --- |
| **Opens** | xlsx, xlsm, xls (values, formulas, number formats), xlsb and ods (data), csv, tsv, txt, json |
| **Saves** | xlsx (every sheet, formulas, styles, tables, charts, PivotTables), csv, tsv, json, html, pdf |

Cells use **A1** notation (`B2`, `A1:D10`); quote sheet names with spaces in formulas (`'My sheet'!A1`). Strings starting with `=` are formulas; text like `12%` or `2026-03-01` is read as typed.

## Example

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

## Requirements

- **GridCraft** with `gridcraft-cli` (tested with **0.6.1**); see [Platforms](#platforms)
- Node.js ≥ 20 (bundled with Claude Desktop for `.mcpb` installs)

## Installation

### Claude Desktop (recommended, all platforms)

1. Download `gridcraft-mcp-server.mcpb` from the [latest release](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Double-click it (or drag it into Claude Desktop → *Settings → Extensions*) and click **Install**.
3. Optional: if GridCraft is not in a standard location, fill in its folder or the `gridcraft-cli` path in the extension settings.

### Sunsam Code

Install **GridCraft Bridge** from the [Sunsam Code marketplace](https://github.com/jhonsu01/marketplace-SunsamCode), or drop the `.mcpb` into *MCP → Install extension*.

### Codex (OpenAI)

**Recommended — the marketplace (gets updates):** *Plugins → Add → Add marketplace*, source `jhonsu01/craft-marketplace`, reference `main`, then install **GridCraft Bridge** from **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). New versions arrive by refreshing the marketplace. Or upload the zip (Codex then keeps it in your account and refuses a newer zip with the same name):

1. Download `gridcraft-mcp-server-<version>-codex.zip` from the [latest release](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. In Codex: *Plugins → Add → New plugin*, choose the zip and click **Add plugin**.
3. Codex starts the server with `node`, so Node.js ≥ 20 must be on `PATH`. If GridCraft is not in a standard location, set `GRIDCRAFT_DIR` or `GRIDCRAFT_CLI` as system environment variables (Codex has no settings form for local plugins).

### DeepSeek Harness

1. *Plugins → Add plugin*, enter `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` and click **Install**, then **Enable now**.
2. Harness runs the server with its own MCP client and `node` (Node.js ≥ 20 on `PATH`); the tools appear as `mcp__gridcraft__<tool>` and the output files as cards that open in Harness.
3. Harness does not update plugins by itself yet: to upgrade, uninstall the plugin and install it again with the same address.

### Claude Code / other MCP clients

```bash
git clone https://github.com/jhonsu01/gridcraft-mcp-server.git
cd gridcraft-mcp-server
npm install
npm run build
```

Windows:

```bash
claude mcp add gridcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux:

```bash
claude mcp add gridcraft -- node "$PWD/dist/bundle.cjs"
```

## Configuration

| Variable | Meaning |
| --- | --- |
| `GRIDCRAFT_DIR` | GridCraft folder, one of its executables, a `.tar.gz` root (with `bin/`) or `GridCraft.app`. Default: auto-detect |
| `GRIDCRAFT_CLI` | Path of `gridcraft-cli` / `gridcraft-cli.exe` (wins over `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Path of the desktop app when it lives elsewhere (e.g. a Linux AppImage) |
| `GRIDCRAFT_CONTROL_PORT` | Control port of the desktop app (default 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | Maximum seconds per engine call (default 3600) |

## Safety

- Files are **never overwritten** unless `overwrite: true`: a free name (`_2`) is used in folders and an existing `output_path` is an error. Inputs are only read; an edited file is saved only as a new copy (`_edited`).
- All paths must be absolute. The engine runs headless and never touches the GridCraft app unless `live: true`.
- Everything runs locally with no network access. Each job uses a private engine in a temporary folder that is deleted at the end.

## Development

```bash
npm run build       # TypeScript + single-file bundle (dist/bundle.cjs)
npm test            # unit tests (Windows, macOS and Linux path logic)
npm run test:e2e    # 25 end-to-end checks (27 with `E2E_LIVE=1`) over real MCP stdio (synthetic CSV)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness plugin zip
```

Linux test in Docker (unpack `gridcraft-<version>-linux-x86_64.tar.gz` first):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## License

Apache-2.0. GridCraft is © its authors (Storytold), MIT or Apache-2.0.
This project is not affiliated with or endorsed by GridCraft or Storytold. Excel is a trademark of Microsoft.
