#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { compileMicroToEasy } from './lib/micro-markdown/compiler.mjs';
import {
  createMicroFileSystem,
  findMicroMarkdownTargets,
  hasMicroGeneratedMarker,
  normalizeGeneratedSource,
} from './lib/micro-markdown/files.mjs';
import {
  createMicroDiagnostic,
  hasMicroErrors,
  printMicroDiagnostics,
  splitMicroDiagnosticsBySeverity,
} from './lib/micro-markdown/diagnostics.mjs';

function parseCliArgs(argv) {
  const args = new Set(argv);
  return {
    mode: args.has('--list') ? 'list' : args.has('--check') ? 'check' : 'write',
    force: args.has('--force'),
    help: args.has('--help') || args.has('-h'),
  };
}

function printHelp() {
  console.log(`Micro Markdown compiler\n\nUsage:\n  node scripts/compile-micro-markdown.mjs [--write|--check|--list] [--force]\n\nModes:\n  --write  Compile work.micro.md/page.micro.md to work.easy.md/page.easy.md, then index.md. Default.\n  --check  Compare generated easy output with current easy files, then run easy:check.\n  --list   Print discovered Micro Markdown source files.\n`);
}

function checkMicroSurface(targets, options = {}) {
  const diagnostics = [];
  const byDir = new Map();

  for (const target of targets) {
    const list = byDir.get(target.dir) || [];
    list.push(target);
    byDir.set(target.dir, list);
  }

  for (const [dir, list] of byDir.entries()) {
    const hasWork = list.some((target) => target.kind === 'work');
    const hasPage = list.some((target) => target.kind === 'page');
    const hasCsv = options.exists(`${dir}/page.csv`);

    if (hasWork && hasPage) {
      diagnostics.push(createMicroDiagnostic('MICRO006', 'work.micro.md and page.micro.md cannot exist in the same folder.', {
        file: dir,
        hint: 'Choose one Micro Markdown SSOT for this page folder.',
      }));
    }

    if (hasCsv && (hasWork || hasPage)) {
      diagnostics.push(createMicroDiagnostic('MICRO006', 'page.csv and Micro Markdown cannot coexist.', {
        file: dir,
        hint: 'CSV-authored pages use page.csv as SSOT. Micro-authored pages use *.micro.md as SSOT.',
      }));
    }
  }

  if (!options.force) {
    for (const target of targets) {
      if (options.exists(target.easyPath)) {
        const existing = options.readFile(target.easyPath);
        if (!hasMicroGeneratedMarker(existing)) {
          diagnostics.push(createMicroDiagnostic('MICRO009', 'Refusing to overwrite or check a non-generated Easy Markdown file.', {
            file: target.easyPath,
            hint: 'Remove the manual Easy Markdown file or use --force only for an intentional migration.',
          }));
        }
      }
    }
  }

  return diagnostics;
}

function runEasyCompiler(mode) {
  const easyMode = mode === 'check' ? '--check' : '--write';
  return spawnSync(process.execPath, ['scripts/compile-easy-markdown.mjs', easyMode], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

function summarize(mode, targets, changed) {
  if (!targets.length) {
    console.log('No Micro Markdown pages found.');
    return;
  }

  if (mode === 'check') {
    console.log(`[Micro Markdown] Checked ${targets.length} file(s). No stale easy outputs.`);
    return;
  }

  console.log(`Micro Markdown compiled ${changed} file(s).`);
}

const options = parseCliArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const fsApi = createMicroFileSystem(process.cwd());
const targets = findMicroMarkdownTargets({ rootDir: process.cwd() });

if (options.mode === 'list') {
  if (!targets.length) {
    console.log('No Micro Markdown pages found.');
  } else {
    for (const target of targets) {
      console.log(`${target.kind}\t${target.sourcePath} -> ${target.easyPath} -> ${target.outputPath}`);
    }
  }
  process.exit(0);
}

const diagnostics = checkMicroSurface(targets, {
  force: options.force,
  exists: fsApi.exists,
  readFile: fsApi.readFile,
});

let changed = 0;

if (!hasMicroErrors(diagnostics)) {
  for (const target of targets) {
    const source = fsApi.readFile(target.sourcePath);
    const compiled = compileMicroToEasy(source, target);
    diagnostics.push(...compiled.diagnostics);

    if (hasMicroErrors(compiled.diagnostics)) continue;

    if (options.mode === 'check') {
      if (!fsApi.exists(target.easyPath)) {
        diagnostics.push(createMicroDiagnostic('MICRO007', 'Generated Easy Markdown file is missing.', {
          file: target.easyPath,
          hint: 'Run npm run micro:compile.',
        }));
        continue;
      }

      const current = fsApi.readFile(target.easyPath);
      if (!hasMicroGeneratedMarker(current)) {
        diagnostics.push(createMicroDiagnostic('MICRO008', 'Generated Easy Markdown marker is missing.', {
          file: target.easyPath,
          hint: 'Run npm run micro:compile or remove the manual Easy Markdown file.',
        }));
        continue;
      }

      if (normalizeGeneratedSource(current) !== normalizeGeneratedSource(compiled.easySource)) {
        diagnostics.push(createMicroDiagnostic('MICRO007', 'Generated Easy Markdown output is stale.', {
          file: target.easyPath,
          hint: 'Run npm run micro:compile.',
        }));
      }

      continue;
    }

    fsApi.writeFile(target.easyPath, compiled.easySource);
    changed += 1;
  }
}

if (diagnostics.length) {
  const grouped = splitMicroDiagnosticsBySeverity(diagnostics);
  const errorCount = grouped.error.length;
  const warningCount = grouped.warning.length;
  const infoCount = grouped.info.length;
  if (errorCount || warningCount || infoCount) {
    console.error(`[Micro Markdown] Found ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info message(s).`);
  }
  printMicroDiagnostics(diagnostics);
  if (hasMicroErrors(diagnostics)) process.exit(1);
}

if (targets.length) {
  const easyResult = runEasyCompiler(options.mode);
  if (easyResult.status !== 0) process.exit(easyResult.status || 1);
}

summarize(options.mode, targets, changed);
