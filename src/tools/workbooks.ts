import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GridCraftSession, withSession } from '../engine.js';
import { toEnginePath } from '../paths.js';
import { READ, WRITE, collectInputs, errorResult, json, needDir, outputSchema, size, targetFor } from './common.js';

// ---------------------------------------------------------------- formats

export const BOOKS = ['xlsx', 'xlsm', 'xls', 'xlsb', 'ods', 'csv', 'tsv', 'txt', 'json'];
export const OUTPUTS = ['xlsx', 'csv', 'tsv', 'json', 'html', 'pdf'] as const;
export type Output = (typeof OUTPUTS)[number];
const NAME_EXTS = [...BOOKS, 'html', 'pdf'];
/** Formats that hold one sheet (the active one, or every sheet as its own file with all_sheets). */
const ONE_SHEET: Output[] = ['csv', 'tsv', 'pdf'];

export const formatsSchema = z
  .array(z.enum(OUTPUTS))
  .min(1)
  .max(6)
  .describe('Outputs: xlsx (Excel, every sheet, formulas, styles, tables, charts), csv / tsv (values of one sheet), json, html and pdf (one sheet, print layout).');

const exportSchema = {
  all_sheets: z.boolean().default(false).describe('csv / tsv / pdf: write every sheet as its own file (<name>_<sheet>.csv) instead of only the first sheet.'),
};

export const CHART_TYPES = ['column', 'bar', 'line', 'pie', 'doughnut', 'area', 'scatter', 'bubble', 'radar', 'combo', 'histogram', 'waterfall', 'funnel', 'treemap', 'sunburst', 'boxWhisker', 'stock'] as const;
export const SAMPLES = ['budget', 'sales', 'grades'] as const;

// ---------------------------------------------------------------- A1 helpers

/** 0 → A, 25 → Z, 26 → AA. */
export function colName(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** "B3" → {col: 1, row: 2} (0-based). */
export function parseCell(cell: string): { col: number; row: number } {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(cell.trim());
  if (!m) throw new Error(`Bad cell "${cell}" (use A1 style, e.g. B3).`);
  const col = [...m[1].toUpperCase()].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
  return { col, row: Number(m[2]) - 1 };
}

/** The range rows × cols starting at `start`, e.g. ("A1", 5, 4) → "A1:D5". */
export function rangeFrom(start: string, rows: number, cols: number): string {
  const { col, row } = parseCell(start);
  return `${colName(col)}${row + 1}:${colName(col + Math.max(1, cols) - 1)}${row + Math.max(1, rows)}`;
}

/** A sheet-qualified reference: 'My sheet'!A1 (quotes always, doubled inside). Leaves a reference that already names a sheet alone. */
export function ref(sheet: string | undefined, r: string): string {
  if (!sheet || r.includes('!')) return r;
  return `'${sheet.replace(/'/g, "''")}'!${r}`;
}

// ---------------------------------------------------------------- schemas

const cellValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const formatSchema = z.object({
  range: z.string().describe('A1 range on this sheet, e.g. "A1:D1", "C:C".'),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  font: z.string().optional(),
  size: z.number().min(1).max(409).optional(),
  font_color: z.string().optional().describe('#RRGGBB'),
  fill_color: z.string().optional().describe('#RRGGBB or "none"'),
  number_format: z.string().optional().describe('General, Number, Currency, Accounting, Percentage, Short Date, Long Date, Time, Fraction, Scientific, Text, or a code like "#,##0.00" / "0%" / "yyyy-mm-dd".'),
  align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  wrap: z.boolean().optional(),
  borders: z.enum(['all', 'outside', 'thickOutside', 'bottom', 'top', 'left', 'right', 'thickBottom', 'doubleBottom', 'topBottom', 'inside', 'none']).optional(),
});

const chartSchema = z.object({
  range: z.string().describe('Source data with headers on this sheet, e.g. "A1:C13" (first column = categories, first row = series names).'),
  type: z.enum(CHART_TYPES).default('column'),
  subtype: z.enum(['clustered', 'stacked', 'stacked100', 'markers']).optional(),
  title: z.string().optional(),
  at: z.string().optional().describe('Top-left cell of the chart (default: right of the data).'),
  width: z.number().positive().optional().describe('Points.'),
  height: z.number().positive().optional().describe('Points.'),
  legend: z.enum(['none', 'bottom', 'top', 'left', 'right']).optional(),
  data_labels: z.boolean().optional(),
});

const conditionalSchema = z.object({
  range: z.string(),
  type: z
    .enum(['greater_than', 'less_than', 'between', 'equal', 'contains', 'duplicates', 'unique', 'top', 'bottom', 'above_average', 'below_average', 'color_scale', 'data_bar', 'icon_set', 'formula'])
    .describe('Rule kind.'),
  value: z.union([z.string(), z.number()]).optional().describe('greater_than / less_than / equal / between (low) / contains (text) / top / bottom (count) / formula (e.g. "=$C2>100").'),
  value2: z.union([z.string(), z.number()]).optional().describe('between: the high value.'),
  style: z.enum(['lightRedFill', 'redText', 'yellowFill', 'greenFill', 'redBorder', 'lightRedFillDarkRedText']).default('lightRedFillDarkRedText').describe('Highlight style of cell rules.'),
  color: z.string().optional().describe('data_bar colour.'),
  colors: z.array(z.string()).max(3).optional().describe('color_scale: 2 or 3 colours, low → high.'),
});

const pivotSchema = z.object({
  source: z.string().describe('Data with headers, e.g. "Sales!A1:E200" or a table name.'),
  rows: z.array(z.string()).max(10).default([]).describe('Header names of the row fields.'),
  columns: z.array(z.string()).max(10).default([]),
  values: z.array(z.object({ field: z.string(), func: z.enum(['sum', 'count', 'average', 'max', 'min', 'product']).default('sum') })).min(1).max(10),
  filters: z.array(z.string()).max(10).optional(),
  destination: z.string().default('new').describe('"new" (a new sheet) or a cell like "Summary!A3".'),
  name: z.string().optional().describe('PivotTable name.'),
  sheet_name: z.string().min(1).max(31).optional().describe('destination "new": name of the new sheet (default "Pivot 1", "Pivot 2"...).'),
});

export const sheetSchema = z.object({
  name: z.string().min(1).max(31).describe('Sheet name.'),
  data: z.array(z.array(cellValue)).max(100000).default([]).describe('Rows of cells: numbers, text, booleans, null (empty) or formulas starting with "=" ("=SUM(B2:B9)"). Text like "12%" or "2026-03-01" is read as typed.'),
  start: z.string().default('A1').describe('Top-left cell of `data`.'),
  header: z.boolean().default(true).describe('The first data row is a header: bold, coloured and frozen.'),
  header_color: z.string().optional().describe('Header fill (#RRGGBB; default the theme\'s dark blue).'),
  table: z.union([z.boolean(), z.object({ name: z.string().optional(), style: z.string().optional().describe('TableStyleMedium2 (default), TableStyleLight9...') })]).optional().describe('Format the data as an Excel table (filter buttons, banded rows).'),
  totals_row: z.array(z.enum(['sum', 'average', 'count', 'max', 'min', 'none'])).optional().describe('A totals row under the data, one function per column ("none" for a label column; the first "none" gets "Total").'),
  column_widths: z.record(z.string(), z.number().positive()).optional().describe('Column letter → width in characters, e.g. {"A": 24}. Other columns fit their content.'),
  formats: z.array(formatSchema).max(200).optional(),
  conditional_formats: z.array(conditionalSchema).max(50).optional(),
  charts: z.array(chartSchema).max(20).optional(),
  merges: z.array(z.string()).max(100).optional().describe('Ranges to merge and center, e.g. "A1:D1".'),
  freeze: z.string().optional().describe('Freeze rows above and columns left of this cell, e.g. "B2" (default "A2" with a header).'),
  validations: z.array(z.object({ range: z.string(), list: z.array(z.string()).min(1).max(200) })).max(50).optional().describe('Drop-down lists.'),
  notes: z.array(z.object({ cell: z.string(), text: z.string() })).max(200).optional(),
  tab_color: z.string().optional(),
  orientation: z.enum(['portrait', 'landscape']).optional().describe('Print / PDF orientation.'),
  fit_to_width: z.boolean().optional().describe('Print / PDF: fit every column on one page width.'),
});
export type SheetSpec = z.infer<typeof sheetSchema>;

// ---------------------------------------------------------------- building

const RULES: Record<string, (c: z.infer<typeof conditionalSchema>) => Record<string, unknown>> = {
  greater_than: (c) => ({ type: 'cellIs', operator: 'greaterThan', value: String(c.value), preset: c.style }),
  less_than: (c) => ({ type: 'cellIs', operator: 'lessThan', value: String(c.value), preset: c.style }),
  equal: (c) => ({ type: 'cellIs', operator: 'equal', value: String(c.value), preset: c.style }),
  between: (c) => ({ type: 'cellIs', operator: 'between', value: String(c.value), value2: String(c.value2), preset: c.style }),
  contains: (c) => ({ type: 'containsText', text: String(c.value), preset: c.style }),
  duplicates: (c) => ({ type: 'duplicate', preset: c.style }),
  unique: (c) => ({ type: 'unique', preset: c.style }),
  top: (c) => ({ type: 'top10', rank: Number(c.value ?? 10), preset: c.style }),
  bottom: (c) => ({ type: 'top10', rank: Number(c.value ?? 10), bottom: true, preset: c.style }),
  above_average: (c) => ({ type: 'aboveAverage', preset: c.style }),
  below_average: (c) => ({ type: 'aboveAverage', below: true, preset: c.style }),
  color_scale: (c) => ({ type: 'colorScale', ...(c.colors?.length ? { colors: c.colors } : {}) }),
  data_bar: (c) => ({ type: 'dataBar', ...(c.color ? { color: c.color } : {}) }),
  icon_set: () => ({ type: 'iconSet' }),
  formula: (c) => ({ type: 'expression', formula: String(c.value), preset: c.style }),
};

export async function applyFormat(s: GridCraftSession, sheet: string | undefined, f: z.infer<typeof formatSchema>): Promise<void> {
  await s.json('format_range', {
    range: ref(sheet, f.range),
    ...(f.bold !== undefined ? { bold: f.bold } : {}),
    ...(f.italic !== undefined ? { italic: f.italic } : {}),
    ...(f.underline !== undefined ? { underline: f.underline } : {}),
    ...(f.font ? { fontName: f.font } : {}),
    ...(f.size ? { fontSize: f.size } : {}),
    ...(f.font_color ? { fontColor: f.font_color } : {}),
    ...(f.fill_color ? { fillColor: f.fill_color } : {}),
    ...(f.number_format ? { numberFormat: f.number_format } : {}),
    ...(f.align ? { horizontalAlign: f.align } : {}),
    ...(f.wrap !== undefined ? { wrapText: f.wrap } : {}),
    ...(f.borders ? { borders: f.borders } : {}),
  });
}

export async function addChart(s: GridCraftSession, sheet: string | undefined, c: z.infer<typeof chartSchema>): Promise<number> {
  const r = await s.json('insert_chart', { range: ref(sheet, c.range), type: c.type, ...(c.subtype ? { subtype: c.subtype } : {}), ...(c.title ? { title: c.title } : {}), ...(c.at ? { at: c.at } : {}) });
  const id: number = r?.chart;
  const set: Record<string, unknown> = {};
  if (c.width) set['width'] = c.width;
  if (c.height) set['height'] = c.height;
  if (c.legend) set['legend'] = c.legend;
  if (c.data_labels !== undefined) set['dataLabels'] = c.data_labels;
  if (Object.keys(set).length) await s.cmd('chart.set', { chart: id, ...set });
  return id;
}

export async function addConditional(s: GridCraftSession, sheet: string | undefined, c: z.infer<typeof conditionalSchema>): Promise<void> {
  if (['greater_than', 'less_than', 'equal', 'contains', 'formula'].includes(c.type) && c.value === undefined) throw new Error(`conditional ${c.type} needs a value.`);
  if (c.type === 'between' && (c.value === undefined || c.value2 === undefined)) throw new Error('conditional between needs value and value2.');
  await s.cmd('home.conditionalFormat', { range: ref(sheet, c.range), rule: RULES[c.type](c) });
}

export async function addPivot(s: GridCraftSession, p: z.infer<typeof pivotSchema>): Promise<Record<string, unknown>> {
  const r = await s.cmd('insert.pivotTable', {
    source: p.source,
    destination: p.destination,
    rows: p.rows,
    columns: p.columns,
    values: p.values.map((v) => ({ field: v.field, func: v.func })),
    ...(p.filters?.length ? { filters: p.filters } : {}),
    ...(p.name ? { name: p.name } : {}),
  });
  // a new sheet gets a generic name (Sheet1...): name it after the pivot
  if (p.destination === 'new' && r?.sheet) {
    const names = await sheetNames(s);
    let name = p.sheet_name;
    for (let i = 1; !name || (names.includes(name) && name !== r.sheet); i++) name = p.sheet_name && i === 1 ? p.sheet_name : `Pivot ${i}`;
    if (name !== r.sheet) {
      await s.cmd('sheet.rename', { sheet: r.sheet, name });
      r.sheet = name;
    }
    // the engine puts the new sheet before the current one: move it after the data
    await s.cmd('sheet.move', { sheet: r.sheet, to: names.length - 1 }).catch(() => undefined);
  }
  return r;
}

/** Fill the active sheet (already named) from its description. */
export async function buildSheet(s: GridCraftSession, sh: SheetSpec, warnings: string[]): Promise<{ range?: string }> {
  const name = sh.name;
  const rows = sh.data.length;
  const cols = sh.data.reduce((m, r) => Math.max(m, r.length), 0);
  let range: string | undefined;
  if (rows && cols) {
    const values = sh.data.map((r) => Array.from({ length: cols }, (_, i) => (r[i] === undefined ? null : r[i])));
    await s.json('write_range', { range: ref(name, sh.start), values });
    range = rangeFrom(sh.start, rows, cols);
  }
  const { col: c0, row: r0 } = parseCell(sh.start);
  if (range && sh.totals_row?.length) {
    const totals: (string | null)[] = [];
    let labelled = false;
    for (let i = 0; i < cols; i++) {
      const fn = sh.totals_row[i] ?? 'none';
      const colRange = `${colName(c0 + i)}${r0 + (sh.header ? 2 : 1)}:${colName(c0 + i)}${r0 + rows}`;
      if (fn === 'none') {
        totals.push(labelled ? null : 'Total');
        labelled = true;
      } else totals.push(`=${fn.toUpperCase()}(${colRange})`);
    }
    await s.json('write_range', { range: ref(name, `${colName(c0)}${r0 + rows + 1}`), values: [totals] });
    await applyFormat(s, name, { range: `${colName(c0)}${r0 + rows + 1}:${colName(c0 + cols - 1)}${r0 + rows + 1}`, bold: true, borders: 'topBottom' });
  }
  if (range && sh.table) {
    const t = typeof sh.table === 'object' ? sh.table : {};
    await s.json('create_table', { range: ref(name, range), header: sh.header, ...(t.name ? { name: t.name } : {}), ...(t.style ? { style: t.style } : {}) });
  } else if (range && sh.header) {
    await applyFormat(s, name, { range: `${colName(c0)}${r0 + 1}:${colName(c0 + cols - 1)}${r0 + 1}`, bold: true, fill_color: sh.header_color ?? '#1F4E78', font_color: '#FFFFFF', borders: 'bottom' });
  }
  for (const f of sh.formats ?? []) await applyFormat(s, name, f);
  for (const m of sh.merges ?? []) await s.cmd('home.mergeCenter', { range: ref(name, m) });
  for (const c of sh.conditional_formats ?? []) await addConditional(s, name, c);
  for (const v of sh.validations ?? []) await s.cmd('data.validation', { range: ref(name, v.range), type: 'list', formula1: `"${v.list.map((x) => x.replace(/"/g, '""')).join(',')}"`, dropdown: true });
  for (const n of sh.notes ?? []) await s.cmd('review.newNote', { cell: ref(name, n.cell), text: n.text });
  // column widths: fit the used columns, then the ones given
  if (cols) await s.cmd('home.autofitColumnWidth', { cols: `${colName(c0)}:${colName(c0 + cols - 1)}` }).catch((e) => warnings.push(`autofit: ${e instanceof Error ? e.message : e}`));
  for (const [letter, chars] of Object.entries(sh.column_widths ?? {})) await s.cmd('home.columnWidth', { cols: `${letter}:${letter}`, chars });
  const freeze = sh.freeze ?? (sh.header && rows ? `${colName(c0)}${r0 + 2}` : undefined);
  if (freeze) await s.cmd('view.freezePanes', { cell: freeze });
  if (sh.tab_color) await s.cmd('sheet.tabColor', { color: sh.tab_color });
  if (sh.orientation) await s.cmd('pageLayout.orientation', { orientation: sh.orientation });
  if (sh.fit_to_width) await s.cmd('pageLayout.scaleToFit', { width: 1, height: 0 });
  for (const c of sh.charts ?? []) await addChart(s, name, c);
  return { range };
}

/** Make `name` the active sheet. */
export async function activate(s: GridCraftSession, name: string): Promise<void> {
  await s.cmd('sheet.activate', { sheet: name });
}

export async function sheetNames(s: GridCraftSession): Promise<string[]> {
  return ((await s.json('inspect_workbook', {}))?.sheets ?? []).map((x: any) => x.name);
}

export interface Saved {
  path: string;
  format: string;
  sheet?: string;
  bytes?: number;
  pages?: number;
}

/** Save the active workbook once per format (never over an existing file unless overwrite). */
export async function saveAll(
  s: GridCraftSession,
  base: { stemSource: string; name?: string; suffix: string; output_dir?: string; output_path?: string; overwrite?: boolean },
  formats: Output[],
  o: { all_sheets?: boolean },
): Promise<Saved[]> {
  const b = { ...base, exts: NAME_EXTS };
  const out: Saved[] = [];
  const names = await sheetNames(s);
  const active = (await s.json('inspect_workbook', {}))?.activeSheet ?? 0;
  for (const [i, f] of formats.entries()) {
    const sheets = ONE_SHEET.includes(f) ? (o.all_sheets ? names : [names[0]]) : [undefined];
    if (sheets.length > 1 && i === 0 && base.output_path) throw new Error('output_path names one file; all_sheets writes one per sheet: use output_dir.');
    for (const sheet of sheets) {
      const target = targetFor(i, f, b, sheet && sheets.length > 1 ? `_${sheet.replace(/[\\/:*?"<>|]/g, '_')}` : '');
      if (sheet !== undefined) await activate(s, sheet);
      const r = await s.cmd('file.saveAs', { path: toEnginePath(target) });
      out.push({ path: target, format: f, ...(sheet !== undefined ? { sheet } : {}), bytes: size(target), ...(r?.pages ? { pages: r.pages } : {}) });
    }
  }
  if (names[active] !== undefined) await activate(s, names[active]).catch(() => undefined);
  return out;
}

/** The first rows of every sheet as computed values (what the formulas give), plus the cells with errors. */
export async function preview(s: GridCraftSession, maxRows = 15, maxCols = 12): Promise<Record<string, unknown>> {
  const wb = await s.json('inspect_workbook', {});
  const sheets: Record<string, unknown>[] = [];
  for (const sh of wb?.sheets ?? []) {
    if (!sh.usedRange) {
      sheets.push({ name: sh.name, empty: true });
      continue;
    }
    const [a] = String(sh.usedRange).split(':');
    const { col, row } = parseCell(a);
    const end = String(sh.usedRange).split(':')[1] ?? a;
    const e = parseCell(end);
    const r = `${colName(col)}${row + 1}:${colName(Math.min(e.col, col + maxCols - 1))}${Math.min(e.row, row + maxRows - 1) + 1}`;
    const vals = await s.json('read_range', { range: ref(sh.name, r), formatted: true });
    sheets.push({
      name: sh.name,
      used_range: sh.usedRange,
      ...(sh.tables?.length ? { tables: sh.tables.map((t: any) => `${t.name} ${t.range}`) } : {}),
      ...(sh.charts?.length ? { charts: sh.charts.map((c: any) => `${c.kind}${c.title ? ` "${c.title}"` : ''} at ${c.at}`) } : {}),
      rows: vals?.values,
      ...(e.row - row + 1 > maxRows || e.col - col + 1 > maxCols ? { truncated: true } : {}),
    });
  }
  const errors = ((await s.cmd('formulas.errorChecking', {}).catch(() => undefined)) as any)?.errors ?? [];
  return { sheets, ...(errors.length ? { formula_errors: errors.slice(0, 50) } : {}) };
}

// ---------------------------------------------------------------- tools

export function registerWorkbookTools(server: McpServer): void {
  server.registerTool(
    'create_workbook',
    {
      title: 'Create a spreadsheet',
      description:
        'Build an Excel workbook with GridCraft (an Excel-class spreadsheet app): sheets of data and live formulas (500+ Excel functions, ' +
        'dynamic arrays), header styling, tables with filter buttons, totals rows, number formats, fonts, colours, borders, merged cells, ' +
        'conditional formatting (highlights, data bars, colour scales, icon sets), drop-down lists, notes, charts (17 types), PivotTables, ' +
        'frozen panes and print setup. Saves xlsx, csv, tsv, json, html or pdf and returns the computed values of the first rows of every ' +
        'sheet (and any formula errors) to check the result. Or start from a sample: budget, sales, grades.',
      inputSchema: {
        name: z.string().default('workbook').describe('File name without extension.'),
        sample: z.enum(SAMPLES).optional().describe('Start from a built-in sample workbook instead of a blank one.'),
        sheets: z.array(sheetSchema).max(100).default([]),
        pivots: z.array(pivotSchema).max(20).optional().describe('PivotTables, made after the sheets.'),
        theme: z.enum(['Craft', 'Slate', 'Meadow', 'Ember', 'Ocean', 'Orchid', 'Graphite']).optional(),
        title: z.string().optional().describe('Document title (properties).'),
        author: z.string().optional(),
        formats: formatsSchema.default(['xlsx']),
        ...exportSchema,
        ...outputSchema,
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const dir = needDir(args);
        if (!args.sheets.length && !args.sample) throw new Error('Give `sheets` or a `sample`.');
        return json(
          await withSession(async (s) => {
            const warnings: string[] = [];
            await s.json('new_workbook', args.sample ? { sample: args.sample } : {});
            if (args.theme) await s.cmd('pageLayout.theme', { name: args.theme });
            const existing = await sheetNames(s);
            for (const [i, sh] of args.sheets.entries()) {
              if (i === 0 && !args.sample) await s.cmd('sheet.rename', { sheet: existing[0], name: sh.name });
              else if (existing.includes(sh.name)) await activate(s, sh.name);
              else await s.cmd('home.insertSheet', { name: sh.name, before: (await sheetNames(s)).length });
              await activate(s, sh.name);
              await buildSheet(s, sh, warnings);
            }
            const pivots: unknown[] = [];
            for (const p of args.pivots ?? []) pivots.push(await addPivot(s, p));
            if (args.title || args.author) await s.cmd('file.properties', { ...(args.title ? { title: args.title } : {}), ...(args.author ? { author: args.author } : {}) });
            const first = (await sheetNames(s))[0];
            if (first) await activate(s, args.sheets[0]?.name ?? first);
            const outputs = await saveAll(s, { stemSource: path.join(dir, args.name), name: args.name, suffix: '', output_dir: dir, output_path: args.output_path, overwrite: args.overwrite }, args.formats, args);
            return { success: true, outputs, ...(pivots.length ? { pivots } : {}), workbook: await preview(s), ...(warnings.length ? { warnings } : {}) };
          }),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'edit_workbook',
    {
      title: 'Edit spreadsheets',
      description:
        'Open workbooks (xlsx, xlsm, xls, xlsb, ods, csv, tsv; one, a list or a folder) and change them: write values and formulas, find ' +
        'and replace, insert or delete rows and columns, sort, remove duplicates, add, rename or delete sheets, apply formats, ' +
        'conditional formatting, tables, charts and PivotTables. Saved as new copies; the originals are only read.',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(200).optional(),
        input_dir: z.string().optional(),
        write: z.array(z.object({ sheet: z.string().optional(), range: z.string().describe('Top-left cell, e.g. "B2".'), values: z.array(z.array(cellValue)).max(100000) })).max(200).optional(),
        replace: z.array(z.object({ find: z.string().min(1), replace: z.string(), match_case: z.boolean().default(false), whole_cell: z.boolean().default(false) })).max(100).optional(),
        rows_columns: z
          .array(z.object({ sheet: z.string().optional(), action: z.enum(['insert_rows', 'delete_rows', 'insert_columns', 'delete_columns']), at: z.string().describe('Rows "3:5" or columns "B:C".') }))
          .max(100)
          .optional(),
        sort: z
          .array(z.object({ sheet: z.string().optional(), range: z.string().optional().describe('Default: the data around A1.'), keys: z.array(z.object({ column: z.string(), order: z.enum(['asc', 'desc']).default('asc') })).min(1).max(8), header: z.boolean().default(true) }))
          .max(20)
          .optional(),
        remove_duplicates: z.array(z.object({ sheet: z.string().optional(), range: z.string().optional(), columns: z.array(z.string()).max(50).optional(), header: z.boolean().default(true) })).max(20).optional(),
        rename_sheets: z.array(z.object({ from: z.string(), to: z.string().min(1).max(31) })).max(50).optional(),
        delete_sheets: z.array(z.string()).max(50).optional(),
        add_sheets: z.array(sheetSchema).max(50).optional(),
        formats: z.array(formatSchema.extend({ sheet: z.string().optional() })).max(200).optional().describe('Cell formats (on `sheet`, default the first sheet).'),
        conditional_formats: z.array(conditionalSchema.extend({ sheet: z.string().optional() })).max(50).optional(),
        tables: z.array(z.object({ sheet: z.string().optional(), range: z.string(), name: z.string().optional(), style: z.string().optional() })).max(20).optional(),
        charts: z.array(chartSchema.extend({ sheet: z.string().optional() })).max(20).optional(),
        pivots: z.array(pivotSchema).max(20).optional(),
        output_formats: formatsSchema.default(['xlsx']).describe('Outputs (default xlsx).'),
        ...exportSchema,
        suffix: z.string().default('_edited'),
        ...outputSchema,
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir, BOOKS);
        if (files.length > 1 && args.output_path) throw new Error('output_path only works with one workbook; use output_dir.');
        const results: unknown[] = [];
        for (const file of files) {
          try {
            results.push(
              await withSession(async (s) => {
                const warnings: string[] = [];
                const opened = await s.json('open_workbook', { path: toEnginePath(file) });
                if (opened?.warnings?.length) warnings.push(...opened.warnings);
                const first = (await sheetNames(s))[0];
                const on = async (sheet?: string) => {
                  const name = sheet ?? first;
                  await activate(s, name);
                  return name;
                };
                for (const r of args.rename_sheets ?? []) await s.cmd('sheet.rename', { sheet: r.from, name: r.to });
                let replaced = 0;
                for (const r of args.replace ?? []) replaced += Number((await s.cmd('edit.replace', { what: r.find, with: r.replace, matchCase: r.match_case, wholeCell: r.whole_cell, all: true, within: 'workbook' }))?.replaced ?? 0);
                for (const w of args.write ?? []) await s.json('write_range', { range: ref(await on(w.sheet), w.range), values: w.values });
                for (const rc of args.rows_columns ?? []) {
                  await on(rc.sheet);
                  const id = { insert_rows: 'home.insertRows', delete_rows: 'home.deleteRows', insert_columns: 'home.insertColumns', delete_columns: 'home.deleteColumns' }[rc.action];
                  await s.cmd(id, rc.action.endsWith('rows') ? { rows: rc.at } : { cols: rc.at });
                }
                for (const so of args.sort ?? []) {
                  const name = await on(so.sheet);
                  await s.json('sort_range', { ...(so.range ? { range: ref(name, so.range) } : {}), keys: so.keys, header: so.header });
                }
                for (const d of args.remove_duplicates ?? []) {
                  const name = await on(d.sheet);
                  await s.cmd('data.removeDuplicates', { ...(d.range ? { range: ref(name, d.range) } : {}), ...(d.columns ? { columns: d.columns } : {}), header: d.header });
                }
                for (const sh of args.add_sheets ?? []) {
                  await s.cmd('home.insertSheet', { name: sh.name, before: (await sheetNames(s)).length });
                  await activate(s, sh.name);
                  await buildSheet(s, sh, warnings);
                }
                for (const f of args.formats ?? []) await applyFormat(s, await on(f.sheet), f);
                for (const c of args.conditional_formats ?? []) await addConditional(s, await on(c.sheet), c);
                for (const t of args.tables ?? []) {
                  const name = await on(t.sheet);
                  await s.json('create_table', { range: ref(name, t.range), ...(t.name ? { name: t.name } : {}), ...(t.style ? { style: t.style } : {}) });
                }
                for (const c of args.charts ?? []) await addChart(s, await on(c.sheet), c);
                const pivots: unknown[] = [];
                for (const p of args.pivots ?? []) pivots.push(await addPivot(s, p));
                for (const name of args.delete_sheets ?? []) await s.cmd('home.deleteSheet', { sheet: name });
                const names = await sheetNames(s);
                if (names[0]) await activate(s, names[0]);
                const outputs = await saveAll(s, { stemSource: file, suffix: args.suffix, output_dir: args.output_dir, output_path: args.output_path, overwrite: args.overwrite }, args.output_formats, args);
                return { input: file, success: true, ...(args.replace?.length ? { replaced } : {}), outputs, ...(pivots.length ? { pivots } : {}), workbook: await preview(s, 8, 8), ...(warnings.length ? { warnings } : {}) };
              }),
            );
          } catch (e) {
            results.push({ input: file, success: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        const failed = results.filter((r: any) => !r.success).length;
        return json({ success: failed === 0, processed: files.length, failed, results }, failed === files.length);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'read_workbook',
    {
      title: 'Read and calculate',
      description:
        'Read a workbook (xlsx, xlsm, xls, xlsb, ods, csv, tsv, json): computed values, formulas or display text of a range or sheet, and ' +
        'evaluate formulas against it without changing anything (e.g. "=SUMIFS(D:D,A:A,\\"North\\")", "=AVERAGE(Sales!C2:C99)").',
      inputSchema: {
        input_path: z.string(),
        sheet: z.string().optional().describe('Default: the first sheet.'),
        range: z.string().optional().describe('A1 range (default: the used range).'),
        mode: z.enum(['values', 'formulas', 'formatted']).default('values').describe('values (computed), formulas (formula text where there is one) or formatted (as displayed, number formats applied).'),
        max_rows: z.number().int().min(1).max(10000).default(500),
        evaluate: z.array(z.string()).max(100).optional().describe('Formulas to evaluate on the sheet.'),
      },
      annotations: READ,
    },
    async (args) => {
      try {
        const [file] = collectInputs([args.input_path], undefined, BOOKS);
        return json(
          await withSession(async (s) => {
            await s.json('open_workbook', { path: toEnginePath(file) });
            const wb = await s.json('inspect_workbook', {});
            const sheet = args.sheet ?? wb?.sheets?.[0]?.name;
            const info = (wb?.sheets ?? []).find((x: any) => x.name === sheet);
            if (!info) throw new Error(`No sheet named "${sheet}" (sheets: ${(wb?.sheets ?? []).map((x: any) => x.name).join(', ')}).`);
            await activate(s, sheet);
            let range = args.range ?? info.usedRange;
            let truncated = false;
            if (range) {
              const [a, b] = String(range).split(':');
              if (b) {
                const st = parseCell(a);
                const en = parseCell(b);
                if (en.row - st.row + 1 > args.max_rows) {
                  range = `${a}:${colName(en.col)}${st.row + args.max_rows}`;
                  truncated = true;
                }
              }
            }
            const r = range ? await s.json('read_range', { range: ref(sheet, range), ...(args.mode === 'formulas' ? { formulas: true } : {}), ...(args.mode === 'formatted' ? { formatted: true } : {}) }) : { values: [] };
            const evaluated: unknown[] = [];
            for (const f of args.evaluate ?? []) {
              try {
                evaluated.push({ formula: f, result: (await s.json('evaluate_formula', { formula: f }))?.result });
              } catch (e) {
                evaluated.push({ formula: f, error: e instanceof Error ? e.message : String(e) });
              }
            }
            return { success: true, input: file, sheet, sheets: (wb?.sheets ?? []).map((x: any) => x.name), range: r?.range ?? range ?? null, rows: r?.values ?? [], ...(truncated ? { truncated: true, used_range: info.usedRange } : {}), ...(evaluated.length ? { evaluated } : {}) };
          }),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'convert_workbook',
    {
      title: 'Convert spreadsheets',
      description:
        'Convert workbooks (xlsx, xlsm, xls, xlsb, ods, csv, tsv, json; one, a list or a folder) to xlsx, csv, tsv, json, html or pdf ' +
        '(csv / tsv / pdf: the first sheet, or every sheet as its own file with all_sheets).',
      inputSchema: {
        input_path: z.string().optional(),
        input_paths: z.array(z.string()).max(1000).optional(),
        input_dir: z.string().optional(),
        formats: formatsSchema.default(['xlsx']),
        ...exportSchema,
        suffix: z.string().default(''),
        ...outputSchema,
      },
      annotations: WRITE,
    },
    async (args) => {
      try {
        const files = collectInputs([...(args.input_path ? [args.input_path] : []), ...(args.input_paths ?? [])], args.input_dir, BOOKS);
        if (files.length > 1 && args.output_path) throw new Error('output_path only works with one workbook; use output_dir.');
        const results: unknown[] = [];
        for (const file of files) {
          try {
            results.push(
              await withSession(async (s) => {
                const opened = await s.json('open_workbook', { path: toEnginePath(file) });
                const outputs = await saveAll(s, { stemSource: file, suffix: args.suffix, output_dir: args.output_dir, output_path: args.output_path, overwrite: args.overwrite }, args.formats, args);
                return { input: file, success: true, outputs, ...(opened?.warnings?.length ? { warnings: opened.warnings } : {}) };
              }),
            );
          } catch (e) {
            results.push({ input: file, success: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        const failed = results.filter((r: any) => !r.success).length;
        return json({ success: failed === 0, converted: files.length - failed, failed, results }, failed === files.length);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'get_workbook_info',
    {
      title: 'Workbook info',
      description:
        'Sheets of a workbook with used ranges, tables, charts, merges, filters, frozen panes, defined names, the first rows of each sheet ' +
        'as computed values, and every formula that returns an error.',
      inputSchema: {
        input_path: z.string(),
        preview_rows: z.number().int().min(0).max(100).default(10),
      },
      annotations: READ,
    },
    async (args) => {
      try {
        const [file] = collectInputs([args.input_path], undefined, BOOKS);
        return json(
          await withSession(async (s) => {
            const opened = await s.json('open_workbook', { path: toEnginePath(file) });
            const wb = await s.json('inspect_workbook', {});
            const sheets = (wb?.sheets ?? []).map((x: any) => ({
              name: x.name,
              used_range: x.usedRange,
              ...(x.visibility !== 'Visible' ? { visibility: x.visibility } : {}),
              tables: x.tables,
              charts: x.charts,
              ...(x.merges?.length ? { merges: x.merges } : {}),
              ...(x.freeze ? { freeze: x.freeze } : {}),
              ...(x.autofilter ? { autofilter: x.autofilter } : {}),
              ...(x.conditionalFormats ? { conditional_formats: x.conditionalFormats } : {}),
              ...(x.validations ? { validations: x.validations } : {}),
              ...(x.comments ? { comments: x.comments } : {}),
              ...(x.images ? { images: x.images } : {}),
            }));
            const pv: Record<string, unknown> = args.preview_rows ? await preview(s, args.preview_rows, 12) : {};
            return {
              success: true,
              input: file,
              bytes: size(file),
              title: wb?.title,
              theme: wb?.theme,
              names: wb?.names,
              sheets,
              ...(pv['sheets'] ? { preview: pv['sheets'] } : {}),
              ...(pv['formula_errors'] ? { formula_errors: pv['formula_errors'] } : {}),
              ...(opened?.warnings?.length ? { warnings: opened.warnings } : {}),
            };
          }),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
