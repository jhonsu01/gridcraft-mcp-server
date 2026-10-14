// End-to-end test over real MCP stdio against dist/bundle.cjs (what the .mcpb runs).
// Needs GridCraft installed. Usage: npm run build && npm run test:e2e
// E2E_BUNDLE=<path to bundle.cjs> tests another build (e.g. the contents of an unpacked .mcpb).
// E2E_LIVE=1 also opens the GridCraft app with its control channel and drives it (then leaves it open).
// Writes its own synthetic CSV into a temp folder whose name has spaces and accents (no personal files).
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const out = mkdtempSync(join(tmpdir(), 'gc-e2e-'));
const src = join(out, 'Hojas ñandú (prueba)');
mkdirSync(src, { recursive: true });
const csv = join(src, 'clientes.csv');
writeFileSync(csv, 'Nombre,Ciudad,Compras\nAna Pérez,Bogotá,120\nLuis Gómez,Medellín,80\nMaría Ñúñez,Cali,150\nAna Pérez,Bogotá,120\n', 'utf-8');

const bundle = process.env.E2E_BUNDLE || fileURLToPath(new URL('../dist/bundle.cjs', import.meta.url));
const client = new Client({ name: 'gridcraft-e2e', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [bundle], stderr: 'inherit' }));

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? '  OK ' : '  FAIL'} ${label}`);
  if (!ok) failures++;
};
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content.find((c) => c.type === 'text')?.text ?? '{}';
  const body = JSON.parse(text);
  if (r.isError) console.log(`     ! ${name}: ${body.error ?? body.results?.find((x) => !x.success)?.error ?? text.slice(0, 300)}`);
  return body;
};
console.log(`bundle: ${bundle}\nout: ${out}`);

const { tools } = await client.listTools();
console.log(`tools (${tools.length}): ${tools.map((t) => t.name).sort().join(', ')}`);
check(tools.length === 9, `${tools.length} tools`);
check(!JSON.stringify(tools.map((t) => t.inputSchema)).includes('"items":['), 'no JSON Schema tuples (Z.ai/GLM error 1210)');

const st = await call('get_gridcraft_status', {});
check(st.ready && /0\.\d/.test(st.version) && st.commands > 200 && st.functions > 400, `status: ${st.version} · ${st.commands} commands · ${st.functions} functions`);
const fn = await call('list_gridcraft_catalog', { kind: 'functions', filter: 'xlookup' });
check(fn.functions?.[0]?.name === 'XLOOKUP', 'catalog functions');
const cmds = await call('list_gridcraft_catalog', { kind: 'commands', filter: 'pivot' });
check(cmds.count >= 2, `catalog commands "pivot": ${cmds.count}`);

// ---------------------------------------------------------------- create_workbook
const wb = await call('create_workbook', {
  name: 'Ventas ñandú',
  title: 'Ventas',
  sheets: [
    {
      name: 'Datos',
      data: [
        ['Región', 'Producto', 'Unidades', 'Precio', 'Total'],
        ['Norte', 'A', 10, 12.5, '=C2*D2'],
        ['Sur', 'A', 8, 12.5, '=C3*D3'],
        ['Norte', 'B', 12, 20, '=C4*D4'],
        ['Sur', 'B', 9, 20, '=C5*D5'],
        ['Este', 'A', 6, 12.5, '=C6*D6'],
      ],
      table: { name: 'Ventas' },
      totals_row: ['none', 'none', 'sum', 'average', 'sum'],
      formats: [{ range: 'D2:E7', number_format: 'Currency' }],
      conditional_formats: [{ range: 'E2:E6', type: 'data_bar' }, { range: 'C2:C6', type: 'greater_than', value: 9, style: 'greenFill' }],
      validations: [{ range: 'A2:A6', list: ['Norte', 'Sur', 'Este', 'Oeste'] }],
      notes: [{ cell: 'E1', text: 'Unidades × precio' }],
      charts: [{ range: 'A1:A6', type: 'column', title: 'x', at: 'H2' }],
    },
    {
      name: 'Resumen por región',
      data: [['Región', 'Total'], ['Norte', '=SUMIFS(Datos!E:E,Datos!A:A,A2)'], ['Sur', '=SUMIFS(Datos!E:E,Datos!A:A,A3)'], ['Este', '=SUMIFS(Datos!E:E,Datos!A:A,A4)'], ['Error', '=1/0']],
      charts: [{ range: 'A1:B4', type: 'pie', title: 'Ventas por región', at: 'D2', width: 360, height: 240, legend: 'right' }],
      merges: ['D20:F20'],
      tab_color: '#21A04F',
    },
  ],
  pivots: [{ source: 'Datos!A1:E6', rows: ['Región'], columns: ['Producto'], values: [{ field: 'Total', func: 'sum' }], sheet_name: 'Dinámica' }],
  formats: ['xlsx', 'pdf', 'csv'],
  all_sheets: true,
  output_dir: out,
});
const outs = wb.outputs ?? [];
const xlsx = outs.find((o) => o.format === 'xlsx')?.path;
check(wb.success && outs.length === 7 && outs.every((o) => existsSync(o.path)), `create_workbook: ${outs.length} files (xlsx + pdf and csv per sheet)`);
const sheets = Object.fromEntries((wb.workbook?.sheets ?? []).map((s) => [s.name, s]));
check(Object.keys(sheets).join() === 'Datos,Resumen por región,Dinámica', `sheets in order: ${Object.keys(sheets).join(', ')}`);
check(sheets['Datos']?.rows?.[6]?.join('|') === 'Total||45|$15.50|$720.00', `totals row computed (${sheets['Datos']?.rows?.[6]?.join('|')})`);
check(sheets['Datos']?.tables?.[0]?.startsWith('Ventas') && sheets['Datos'].charts?.length === 1, 'table and chart');
check(String(sheets['Resumen por región']?.rows?.[1]?.[1]) === '365', `cross-sheet SUMIFS (${sheets['Resumen por región']?.rows?.[1]?.[1]})`);
check(sheets['Dinámica']?.rows?.some((r) => r[0] === 'Grand Total'), 'PivotTable on its own sheet');
check(wb.workbook?.formula_errors?.length === 1 && wb.workbook.formula_errors[0].error === '#DIV/0!', 'formula errors reported');
check(readFileSync(outs.find((o) => o.format === 'csv' && o.sheet === 'Datos').path, 'utf-8').includes('María') === false && readFileSync(outs.find((o) => o.format === 'csv' && o.sheet === 'Datos').path, 'utf-8').includes('Norte,A,10'), 'csv of a sheet');
check(wb.files_markdown?.includes('file:///'), 'files_markdown links');

const info = await call('get_workbook_info', { input_path: xlsx, preview_rows: 3 });
const d = (info.sheets ?? []).find((s) => s.name === 'Datos');
check(d?.conditional_formats === 2 && d.validations === 1 && d.comments === 1 && d.freeze, 'saved: conditional formats, drop-down, note, frozen header');
check(info.preview?.length === 3 && info.formula_errors?.length === 1, 'info preview and formula errors');

// ---------------------------------------------------------------- read / edit / convert
const rd = await call('read_workbook', { input_path: xlsx, sheet: 'Resumen por región', mode: 'formulas', evaluate: ['=SUM(B2:B4)', '=XLOOKUP("Sur",A2:A4,B2:B4)', '=AVERAGE(Datos!C2:C6)'] });
check(rd.rows?.[1]?.[1]?.startsWith('=SUMIFS') && rd.evaluated?.map((e) => e.result).join() === '720,280,9', `read formulas + evaluate (${rd.evaluated?.map((e) => e.result).join()})`);
const ed = await call('edit_workbook', {
  input_path: xlsx,
  write: [{ sheet: 'Datos', range: 'C2', values: [[20]] }],
  replace: [{ find: 'Norte', replace: 'North' }],
  sort: [{ sheet: 'Datos', range: 'A1:E6', keys: [{ column: 'E', order: 'desc' }] }],
  rename_sheets: [{ from: 'Resumen por región', to: 'Resumen' }],
  delete_sheets: ['Dinámica'],
  add_sheets: [{ name: 'Notas', data: [['Nota'], ['Revisado']] }],
  output_formats: ['xlsx', 'html'],
  output_dir: out,
});
const er = ed.results?.[0];
const es = Object.fromEntries((er?.workbook?.sheets ?? []).map((s) => [s.name, s]));
check(ed.success && Object.keys(es).join() === 'Datos,Resumen,Notas', `edit_workbook sheets: ${Object.keys(es).join(', ')}`);
check(es['Datos']?.rows?.[1]?.[0] === 'North' && es['Datos'].rows[1][4] === '$250.00' && er.replaced >= 2, 'write, recalc, sort desc, replace');
const cv = await call('convert_workbook', { input_path: csv, formats: ['xlsx', 'json'], output_dir: join(out, 'conv') });
check(cv.success && cv.results[0].outputs.every((o) => existsSync(o.path)), 'convert_workbook: csv → xlsx + json');
const dup = await call('edit_workbook', { input_path: csv, remove_duplicates: [{ range: 'A1:C5', header: true }], output_formats: ['csv'], output_dir: join(out, 'dedup') });
check(dup.success && readFileSync(dup.results[0].outputs[0].path, 'utf-8').trim().split(/\r?\n/).length === 4, 'remove duplicates');

// ---------------------------------------------------------------- run commands
const run = await call('run_gridcraft_commands', {
  sample: 'budget',
  steps: [{ id: 'inspect_workbook' }, { id: 'set_cell', params: { cell: 'Z1', input: '=1+1' } }, { id: 'get_cell', params: { cell: 'Z1' } }],
  formats: ['xlsx'],
  name: 'comandos',
  output_dir: out,
});
check(run.success && run.completed === 3 && run.results[2].result?.value === 2 && existsSync(run.outputs?.[0]?.path), 'run_gridcraft_commands: sample + 3 steps + xlsx');

// ---------------------------------------------------------------- safety
const a1 = await call('convert_workbook', { input_path: csv, formats: ['xlsx'], output_dir: join(out, 'twice') });
const a2 = await call('convert_workbook', { input_path: csv, formats: ['xlsx'], output_dir: join(out, 'twice') });
check(a2.results?.[0]?.outputs?.[0]?.path?.endsWith('clientes_2.xlsx') && existsSync(a1.results[0].outputs[0].path), 'existing output kept (writes _2)');
const rel = await call('read_workbook', { input_path: 'relativo.xlsx' });
check(rel.success === false && /absolute/.test(rel.error), 'relative paths rejected');
check(readFileSync(csv, 'utf-8').split('\n').length === 6 && statSync(xlsx).size === outs.find((o) => o.format === 'xlsx').bytes, 'inputs left untouched');

if (process.env.E2E_LIVE) {
  const op = await call('open_in_gridcraft', { paths: [xlsx], control: true });
  check(op.success && op.listening, 'open_in_gridcraft with control channel');
  const live = await call('run_gridcraft_commands', { live: true, steps: [{ id: 'inspect_workbook' }] });
  check(live.success && live.results[0].result?.sheets?.length > 0, 'live: inspect the open workbook');
}

await client.close();
console.log(failures ? `\n${failures} FAILED (${out})` : `\nALL OK (${out})`);
process.exit(failures ? 1 : 0);
