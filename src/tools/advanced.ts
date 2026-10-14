import { execFile, spawn } from 'child_process';
import { mkdirSync } from 'fs';
import * as net from 'net';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { COMMAND_TIMEOUT_SEC, CONTROL_PORT, connectorDir, resolveInstall } from '../config.js';
import { GridCraftSession, runCli, withSession } from '../engine.js';
import { toEnginePath } from '../paths.js';
import { READ, collectInputs, errorResult, json, needDir } from './common.js';
import { BOOKS, CHART_TYPES, OUTPUTS, Output, SAMPLES, preview, saveAll } from './workbooks.js';

interface CommandDef {
  id: string;
  label: string;
  menu?: string[];
  params?: string | null;
  shortcut?: string | null;
}
interface FunctionDef {
  name: string;
  category: string;
  signature: string;
  description: string;
}

let commandCache: CommandDef[] | undefined;
let functionCache: FunctionDef[] | undefined;
/** Every engine command (`gridcraft-cli commands --json`). */
async function engineCommands(): Promise<CommandDef[]> {
  if (!commandCache) commandCache = JSON.parse(await runCli(['commands', '--json'])) as CommandDef[];
  return commandCache;
}
/** Every worksheet function (`gridcraft-cli functions --json`). */
async function engineFunctions(): Promise<FunctionDef[]> {
  if (!functionCache) functionCache = JSON.parse(await runCli(['functions', '--json'])) as FunctionDef[];
  return functionCache;
}

export function controlPortOpen(port = CONTROL_PORT, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: '127.0.0.1', port });
    const done = (ok: boolean) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

function appRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      execFile('tasklist', ['/FI', 'IMAGENAME eq gridcraft.exe', '/NH'], { windowsHide: true }, (err, out) => resolve(!err && /gridcraft\.exe/i.test(out)));
    } else {
      // exact process name: never matches our own gridcraft-cli engines
      execFile('pgrep', ['-xi', 'gridcraft'], (err, out) => resolve(!err && out.trim().length > 0));
    }
  });
}

/** Replace "$steps[N].path.to[0]" with a value returned by step N (0-based), e.g. "$steps[0].chart". */
export function substitute(value: unknown, steps: unknown[] = []): unknown {
  if (typeof value === 'string') {
    const st = /^\$steps\[(\d+)\]((?:\.[A-Za-z_]\w*|\[\d+\])*)$/.exec(value);
    if (st) {
      let cur: unknown = steps[Number(st[1])];
      for (const part of st[2].match(/\.[A-Za-z_]\w*|\[\d+\]/g) ?? []) {
        const key = part.startsWith('.') ? part.slice(1) : Number(part.slice(1, -1));
        cur = cur && typeof cur === 'object' ? (cur as Record<string | number, unknown>)[key] : undefined;
      }
      if (cur === undefined) throw new Error(`${value} is not available (step results so far: ${steps.length}).`);
      return cur;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, steps));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v, steps)]));
  return value;
}

/** Engine tools a step can call by name (anything else is a command id run with `execute_command`). */
const ENGINE_TOOLS = new Set([
  'new_workbook', 'open_workbook', 'save_workbook', 'inspect_workbook', 'read_range', 'write_range', 'set_cell', 'get_cell', 'evaluate_formula',
  'select', 'format_range', 'insert_chart', 'create_table', 'sort_range', 'filter', 'undo', 'redo', 'list_functions',
]);

export function registerAdvancedTools(server: McpServer): void {
  server.registerTool(
    'list_gridcraft_catalog',
    {
      title: 'List commands, functions, charts, samples, formats',
      description:
        'What GridCraft can do: commands (the engine commands with parameters and ribbon place, for run_gridcraft_commands), functions ' +
        '(the worksheet functions with signature and description), charts (chart types), samples (built-in sample workbooks) and formats.',
      inputSchema: {
        kind: z.enum(['commands', 'functions', 'charts', 'samples', 'formats']),
        filter: z.string().optional().describe('Case-insensitive text to match (id, label, name, category or description).'),
      },
      annotations: READ,
    },
    async (args) => {
      try {
        const f = (args.filter ?? '').toLowerCase();
        const match = (...parts: unknown[]) => !f || parts.some((p) => String(p ?? '').toLowerCase().includes(f));
        if (args.kind === 'formats') return json({ success: true, open: BOOKS, save: OUTPUTS });
        if (args.kind === 'charts') return json({ success: true, types: CHART_TYPES, subtypes: ['clustered', 'stacked', 'stacked100', 'markers'] });
        if (args.kind === 'samples') return json({ success: true, samples: SAMPLES });
        if (args.kind === 'functions') {
          const l = (await engineFunctions()).filter((x) => match(x.name, x.category, x.description));
          return json({ success: true, count: l.length, functions: l.slice(0, 400), truncated: l.length > 400 });
        }
        const l = (await engineCommands()).filter((c) => match(c.id, c.label, (c.menu ?? []).join(' ')));
        return json({ success: true, count: l.length, commands: l.slice(0, 300).map((c) => ({ id: c.id, label: c.label, menu: (c.menu ?? []).join(' › ') || undefined, params: c.params || null })), truncated: l.length > 300 });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'run_gridcraft_commands',
    {
      title: 'Run GridCraft engine commands',
      description:
        'Advanced: run any GridCraft engine commands in order (cell.*, home.*, insert.*, formulas.*, data.*, review.*, view.*, ' +
        'pageLayout.*, chart.*, table.*, pivot.*, sheet.*...) plus the engine tools write_range / read_range / set_cell / get_cell / ' +
        'evaluate_formula / format_range / insert_chart / create_table / sort_range / filter / select / inspect_workbook (step id = the ' +
        'tool name), on a new, sample or opened workbook, then save. Parameters can use "$steps[N].field" for a value returned by step N ' +
        '(0-based). With live=true the steps drive the open GridCraft app instead.',
      inputSchema: {
        steps: z.array(z.object({ id: z.string(), params: z.record(z.string(), z.any()).optional() })).max(5000).default([]),
        stop_on_error: z.boolean().default(true),
        open_path: z.string().optional().describe('Absolute workbook to open first (never saved over; save a copy with formats).'),
        sample: z.enum(SAMPLES).optional().describe('Start from a sample when there is no open_path.'),
        formats: z.array(z.enum(OUTPUTS)).max(6).optional().describe('Save the result (needs output_dir or output_path).'),
        all_sheets: z.boolean().default(false),
        name: z.string().default('gridcraft'),
        output_dir: z.string().optional(),
        output_path: z.string().optional(),
        overwrite: z.boolean().default(false),
        live: z.boolean().default(false).describe(`Drive the open GridCraft app (control port ${CONTROL_PORT}) instead of a headless engine.`),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        if (args.live && !(await controlPortOpen())) throw new Error(`GridCraft is not listening on port ${CONTROL_PORT}: call open_in_gridcraft with control=true first.`);
        const dir = args.formats?.length ? needDir(args) : undefined;
        return json(
          await withSession(
            async (s: GridCraftSession) => {
              if (args.open_path) {
                const [file] = collectInputs([args.open_path], undefined, BOOKS);
                await s.json('open_workbook', { path: toEnginePath(file) });
              } else if (!args.live) await s.json('new_workbook', args.sample ? { sample: args.sample } : {});
              const values: unknown[] = [];
              const results: Record<string, unknown>[] = [];
              let failed = 0;
              for (const step of args.steps) {
                try {
                  const params = substitute(step.params ?? {}, values) as Record<string, unknown>;
                  const out = ENGINE_TOOLS.has(step.id) ? await s.json(step.id, params) : await s.cmd(step.id, params);
                  values.push(out);
                  results.push({ id: step.id, ok: true, result: out });
                } catch (e) {
                  failed++;
                  values.push(undefined);
                  results.push({ id: step.id, ok: false, error: e instanceof Error ? e.message : String(e) });
                  if (args.stop_on_error) break;
                }
              }
              let outputs: unknown[] | undefined;
              if (args.formats?.length && !failed) {
                outputs = await saveAll(s, { stemSource: path.join(dir!, args.name), name: args.name, suffix: '', output_dir: dir, output_path: args.output_path, overwrite: args.overwrite }, args.formats as Output[], args);
              }
              const workbook = args.live ? undefined : await preview(s, 8, 8).catch(() => undefined);
              return { success: !failed, completed: results.length - failed, failed_steps: failed, results, ...(outputs ? { outputs } : {}), ...(workbook ? { workbook } : {}) };
            },
            args.live ? String(CONTROL_PORT) : undefined,
          ),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'open_in_gridcraft',
    {
      title: 'Open in GridCraft',
      description:
        'Open workbooks in the GridCraft desktop app to keep working by hand. With control=true the app also starts its loopback-only ' +
        'control channel so run_gridcraft_commands live=true can drive it.',
      inputSchema: {
        paths: z.array(z.string()).max(20).default([]).describe('Absolute workbooks to open.'),
        sample: z.enum(SAMPLES).optional().describe('Open a built-in sample instead.'),
        control: z.boolean().default(false),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      try {
        const files = args.paths.length ? collectInputs(args.paths, undefined, BOOKS) : [];
        const install = resolveInstall();
        if (!install.app) throw new Error('GridCraft desktop app not found. Set GRIDCRAFT_DIR (or GRIDCRAFT_APP).');
        const extra = args.control && !(await controlPortOpen()) ? ['--control', String(CONTROL_PORT)] : [];
        // run it from this connector's folder: GPU drivers drop log folders into the working directory
        const cwd = connectorDir();
        mkdirSync(cwd, { recursive: true });
        const child = spawn(install.app, [...extra, ...(args.sample ? ['--sample', args.sample] : []), ...files], { cwd, detached: true, stdio: 'ignore', windowsHide: false });
        child.on('error', () => undefined);
        child.unref();
        let listening: boolean | undefined;
        if (extra.length) {
          const deadline = Date.now() + 20_000;
          while (!(listening = await controlPortOpen()) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 500));
          if (!listening) throw new Error(`GridCraft started but is not listening on port ${CONTROL_PORT} after 20 s (it may have closed). Start it by hand with: gridcraft --control ${CONTROL_PORT}`);
        }
        return json({ success: true, app: install.app, opened: files, ...(extra.length || args.control ? { control_port: CONTROL_PORT, listening: listening ?? true } : {}) });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.registerTool(
    'get_gridcraft_status',
    {
      title: 'GridCraft status',
      description: 'Check the GridCraft installation: platform, executables, version, engine commands, worksheet functions, formats, whether the app is running / listening for control.',
      inputSchema: {},
      annotations: READ,
    },
    async () => {
      const install = resolveInstall();
      const status: Record<string, unknown> = { ready: !!install.cli, platform: `${install.platform} ${process.arch}`, install_dir: install.dir, cli: install.cli ?? null, app: install.app ?? null };
      try {
        if (!install.cli) throw new Error(`gridcraft-cli not found (searched ${install.searched.length} folders). Install GridCraft or set GRIDCRAFT_DIR / GRIDCRAFT_CLI.`);
        status['version'] = (await runCli(['version'])).split('\n')[0].trim();
        status['commands'] = (await engineCommands()).length;
        status['functions'] = (await engineFunctions()).length;
        status['app_running'] = await appRunning();
        status['control_port'] = CONTROL_PORT;
        status['control_listening'] = await controlPortOpen();
        status['save_formats'] = OUTPUTS;
        status['timeout_sec'] = COMMAND_TIMEOUT_SEC;
        return json(status);
      } catch (e) {
        return json({ ...status, ready: false, error: e instanceof Error ? e.message : String(e) }, true);
      }
    },
  );
}
