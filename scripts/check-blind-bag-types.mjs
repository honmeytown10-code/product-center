import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ts = createRequire(import.meta.url)('typescript');
const root = process.cwd();
const baselineRef = 'b91e09af7556684f3ef5a7fc2ec84821940968c0';
const normalized = file => path.resolve(file).replace(/\\/g, '/').toLowerCase();
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', baselineRef], { encoding: 'utf8' }).split('\0').filter(file => /\.tsx?$/.test(file));
const modified = execFileSync('git', ['-c', 'core.safecrlf=false', 'diff', baselineRef, '--name-only', '--diff-filter=M'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => /\.tsx?$/.test(file));
const baselineSources = new Map(modified.map(file => [normalized(file), execFileSync('git', ['show', `${baselineRef}:${file}`], { encoding: 'utf8' })]));
const collect = (baseline) => {
  const host = ts.createCompilerHost(parsed.options);
  const readFile = host.readFile;
  host.readFile = file => baseline && baselineSources.has(normalized(file)) ? baselineSources.get(normalized(file)) : readFile(file);
  const program = ts.createProgram(baseline ? tracked.map(file => path.join(root, file)) : parsed.fileNames.filter(file => /\.tsx?$/.test(file)), parsed.options, host);
  return ts.getPreEmitDiagnostics(program).map(error => ({ file: error.file ? path.relative(root, error.file.fileName).replace(/\\/g, '/') : '', code: error.code, message: ts.flattenDiagnosticMessageText(error.messageText, '\n') }));
};
const baseline = collect(true);
const current = collect(false);
const counts = new Map();
for (const error of baseline) { const key = JSON.stringify(error); counts.set(key, (counts.get(key) || 0) + 1); }
const added = current.filter(error => { const key = JSON.stringify(error); const count = counts.get(key) || 0; if (count) { counts.set(key, count - 1); return false; } return true; });
const result = { baselineCount: baseline.length, currentCount: current.length, added };
mkdirSync('design-handoff/audit/blind-bag-20261013', { recursive: true });
writeFileSync('design-handoff/audit/blind-bag-20261013/type-baseline.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (added.length) process.exitCode = 1;
