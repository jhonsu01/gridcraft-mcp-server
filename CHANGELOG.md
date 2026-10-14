# Changelog

## [1.0.0] - 2026-10-14
### Added
- First release: 9 tools over GridCraft's headless engine (`gridcraft-cli mcp`) for Windows, macOS and Linux:
  `create_workbook`, `edit_workbook`, `read_workbook`, `convert_workbook`, `get_workbook_info`,
  `list_gridcraft_catalog`, `run_gridcraft_commands`, `open_in_gridcraft` and `get_gridcraft_status`.
- Workbooks from sheets of values and live formulas: header styling, Excel tables, totals rows, number formats, fonts,
  colours, borders, merges, conditional formatting, drop-down lists, notes, charts (17 types), frozen panes, print setup,
  PivotTables on their own named sheet, themes and samples.
- Edits of existing xlsx / ods / csv files: values and formulas, find and replace, rows and columns, sort, duplicates,
  sheets, formats, tables, charts and PivotTables; reading computed values or formulas and evaluating formulas without
  changing the file. Results include the computed first rows of every sheet and any formula errors.
- Output to xlsx, csv, tsv, json, html and pdf (one sheet or every sheet).
- Packages: `gridcraft-mcp-server.mcpb` (Claude Desktop, Sunsam Code) and `gridcraft-mcp-server-<version>-codex.zip`
  (Codex and DeepSeek Harness, also published in the Craft Bridges marketplace).
### Verified
- GridCraft 0.6.1 on Windows 11 (25 end-to-end checks plus 2 driving the live app) and on Debian 12 in Docker, headless
  (25/25); the `.mcpb` tested unpacked. macOS is supported by the path logic but not yet tested on a Mac.
