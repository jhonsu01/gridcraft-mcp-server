import { readFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdvancedTools } from './tools/advanced.js';
import { registerWorkbookTools } from './tools/workbooks.js';
import { LINK_INSTRUCTIONS } from './links.js';

/** serverInfo.version comes from package.json (reachable as ../package.json from dist/ and src/). */
export function readPackageVersion(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.resolve(dir, '../package.json'), 'utf-8')) as { version?: unknown };
    if (typeof pkg.version === 'string' && pkg.version) return pkg.version;
  } catch {
    // package.json not shipped next to the bundle: still start
  }
  return '0.0.0-unknown';
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'gridcraft-mcp-server', version: readPackageVersion() },
    {
      instructions:
        'Builds, edits, reads and converts spreadsheets with the engine of the locally installed GridCraft (Windows, macOS, Linux), an ' +
        'open-source Excel-class spreadsheet app: workbooks from sheets of values and live formulas (500+ Excel functions, dynamic ' +
        'arrays), header styling, tables, totals rows, number formats, colours, borders, merges, conditional formatting, drop-down lists, ' +
        'notes, charts (17 types), PivotTables, frozen panes and print setup; edits of existing xlsx / ods / csv files (values, find and ' +
        'replace, rows and columns, sort, duplicates, sheets, formats); reading computed values and evaluating formulas without changing ' +
        'anything; conversion between xlsx, csv, tsv, json, html and pdf. Cells use A1 notation; quote sheet names with spaces in formulas ' +
        "('My sheet'!A1). Results include the computed values of the first rows and any formula errors to check the work. All paths must " +
        'be absolute; inputs are only read; files are never overwritten unless overwrite is true. The engine runs headless and never ' +
        'touches the GridCraft app unless live=true. list_gridcraft_catalog lists commands and functions; run_gridcraft_commands runs any ' +
        'engine command.' +
        ' ' +
        LINK_INSTRUCTIONS,
    },
  );
  registerWorkbookTools(server);
  registerAdvancedTools(server);
  return server;
}
