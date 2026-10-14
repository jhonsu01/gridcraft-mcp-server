import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cleanEnv, connectorDir, resolveInstall, resolveInt } from '../../src/config.js';
import { resolveOutputPath, sameFile } from '../../src/paths.js';
import { substitute } from '../../src/tools/advanced.js';
import { collectInputs, nameStem, parsePages } from '../../src/tools/common.js';
import { colName, parseCell, rangeFrom, ref, sheetSchema } from '../../src/tools/workbooks.js';

const noTuples = (schema: z.ZodType) => {
  const s = JSON.stringify(z.toJSONSchema(schema));
  expect(s).not.toContain('prefixItems');
  expect(s).not.toMatch(/"items":\[/);
};

describe('config', () => {
  it('treats unfilled MCPB placeholders as unset', () => {
    expect(cleanEnv('${user_config.gridcraft_dir}')).toBeUndefined();
    expect(resolveInt('${user_config.control_port}', 7979, 65535)).toBe(7979);
  });
  it('Windows: install folder, an .exe inside it, or nothing', () => {
    const exists = (p: string) => /^D:\\X\\gridcraft(-cli)?\.exe$/i.test(p);
    const r = resolveInstall({ GRIDCRAFT_DIR: 'D:\\X' }, exists, 'win32', 'C:\\Users\\u');
    expect([r.cli, r.app]).toEqual(['D:\\X\\gridcraft-cli.exe', 'D:\\X\\gridcraft.exe']);
    const pf = (p: string) => p === 'C:\\Program Files\\GridCraft\\gridcraft-cli.exe';
    expect(resolveInstall({ ProgramFiles: 'C:\\Program Files' }, pf, 'win32').cli).toBe('C:\\Program Files\\GridCraft\\gridcraft-cli.exe');
  });
  it('Linux: deb/rpm, tar.gz root, AppImage app', () => {
    const deb = new Set(['/usr/bin/gridcraft-cli', '/usr/bin/gridcraft']);
    const r = resolveInstall({}, (p) => deb.has(p), 'linux', '/home/u');
    expect([r.cli, r.app]).toEqual(['/usr/bin/gridcraft-cli', '/usr/bin/gridcraft']);
    const tar = new Set(['/opt/x/gridcraft-0.6.1-linux-x86_64/bin/gridcraft-cli']);
    expect(resolveInstall({ GRIDCRAFT_DIR: '/opt/x/gridcraft-0.6.1-linux-x86_64' }, (p) => tar.has(p), 'linux', '/home/u').cli).toBe('/opt/x/gridcraft-0.6.1-linux-x86_64/bin/gridcraft-cli');
    const img = '/home/u/gridcraft-0.6.1-linux-x86_64.AppImage';
    expect(resolveInstall({ GRIDCRAFT_APP: img }, (p) => p === img, 'linux', '/home/u').app).toBe(img);
  });
  it('macOS: GridCraft.app plus the separate CLI zip', () => {
    const files = new Set(['/Applications/GridCraft.app/Contents/MacOS/GridCraft', '/usr/local/bin/gridcraft-cli']);
    const r = resolveInstall({}, (p) => files.has(p), 'darwin', '/Users/u');
    expect([r.cli, r.app]).toEqual(['/usr/local/bin/gridcraft-cli', '/Applications/GridCraft.app/Contents/MacOS/GridCraft']);
    expect(connectorDir({}, 'darwin', '/Users/u')).toBe('/Users/u/Library/Application Support/gridcraft-mcp-server');
  });
});

describe('paths and inputs', () => {
  it('never overwrites, POSIX case-sensitive', () => {
    const exists = (p: string) => p === 'D:\\d\\a.pdf';
    expect(resolveOutputPath({ inputPath: 'D:\\d\\a.xyz', ext: 'pdf', exists, platform: 'win32' })).toEqual({ path: 'D:\\d\\a_2.pdf' });
    expect(resolveOutputPath({ inputPath: '/d/a.xyz', ext: 'pdf', outputPath: '/d/out.png', platform: 'linux' })).toHaveProperty('error');
    expect(sameFile('/a/A.x', '/a/a.x', 'linux')).toBe(false);
  });
  it('keeps dots in output names, dropping only a known extension', () => {
    expect(nameStem('mix-1.0.1', ['wav'])).toBe('mix-1.0.1');
    expect(nameStem('song.WAV', ['wav'])).toBe('song');
  });
  it('parses ranges', () => {
    expect(parsePages('1-3, 5, 9', 6)).toEqual([1, 2, 3, 5]);
    expect(() => parsePages('x', 3)).toThrow(/range/i);
  });
  it('collects inputs from a folder, skipping Office lock files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'unit-'));
    for (const f of ['b.XLSX', 'a.xlsx', '~$a.xlsx', 'c.zzz']) writeFileSync(join(dir, f), 'x');
    expect(collectInputs([], dir, ['xlsx']).map((p) => p.slice(dir.length + 1))).toEqual(['a.xlsx', 'b.XLSX']);
    expect(() => collectInputs(['rel.x'])).toThrow(/absolute/);
  });
});

describe('run_*_commands references', () => {
  it('replaces $steps values', () => {
    expect(substitute({ a: '$steps[0].tracks[0]', b: ['$steps[1].id'], c: '$x' }, [{ tracks: [4] }, { id: 7 }])).toEqual({ a: 4, b: [7], c: '$x' });
    expect(() => substitute('$steps[3].id', [])).toThrow();
  });
});

describe('A1 references', () => {
  it('converts columns and ranges', () => {
    expect([colName(0), colName(25), colName(26), colName(701), colName(702)]).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
    expect(parseCell('$C$12')).toEqual({ col: 2, row: 11 });
    expect(rangeFrom('B2', 5, 4)).toBe('B2:E6');
    expect(() => parseCell('12B')).toThrow(/Bad cell/);
  });
  it('quotes sheet names', () => {
    expect(ref('Ventas 2026', 'A1')).toBe("'Ventas 2026'!A1");
    expect(ref("O'Brien", 'B2:C3')).toBe("'O''Brien'!B2:C3");
    expect(ref('X', 'Other!A1')).toBe('Other!A1');
    expect(ref(undefined, 'A1')).toBe('A1');
  });
  it('sheet schema has no JSON Schema tuples (Z.ai / GLM rejects them with error 1210)', () => {
    noTuples(z.array(sheetSchema));
    expect(sheetSchema.parse({ name: 'S', data: [['a', 1, null, true, '=A1']] })).toMatchObject({ start: 'A1', header: true });
  });
});
