#!/usr/bin/env node
import process from 'node:process';

import {
  compileEasyMarkdownSource,
  normalizeGeneratedOutput,
  readSourceHashFromGenerated,
} from './lib/easy-markdown/compiler.mjs';
import {
  assertNoErrors,
  checkEasyMarkdownSurface,
  createDiagnostic,
  hasErrors,
  printDiagnostics,
  splitDiagnosticsBySeverity,
} from './lib/easy-markdown/diagnostics.mjs';
import { collectContentSlugs, createFileSystem, findEasyMarkdownTargets } from './lib/easy-markdown/files.mjs';
import { validateEasyMarkdownReferences } from './lib/easy-markdown/references.mjs';

function parseCliArgs(argv) {
  const args = new Set(argv);

  return {
    mode: args.has('--list') ? 'list' : args.has('--check') ? 'check' : 'write',
    force: args.has('--force'),
    help: args.has('--help') || args.has('-h'),
  };
}

function printHelp() {
  console.log(`Easy Markdown compiler\n\nUsage:\n  node scripts/compile-easy-markdown.mjs [--write|--check|--list] [--force]\n\nModes:\n  --write  Compile work.easy.md/page.easy.md to index.md. Default.\n  --check  Compare generated output with current index.md without writing.\n  --list   Print discovered Easy Markdown source files.\n`);
}

function summarizeSuccess(mode, targets, changed) {
  if (!targets.length) {
    console.log('No Easy Markdown pages found.');
    return;
  }

  if (mode === 'check') {
    console.log(`[Easy Markdown] Checked ${targets.length} file(s). No stale outputs.`);
    return;
  }

  console.log(`Easy Markdown compiled ${changed} page(s).`);
}

const options = parseCliArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const fsApi = createFileSystem(process.cwd());
const targets = findEasyMarkdownTargets({ rootDir: process.cwd() });

if (options.mode === 'list') {
  if (!targets.length) {
    console.log('No Easy Markdown pages found.');
  } else {
    for (const target of targets) {
      console.log(`${target.kind}\t${target.sourcePath} -> ${target.outputPath}`);
    }
  }
  process.exit(0);
}

const surfaceDiagnostics = checkEasyMarkdownSurface(targets, {
  force: options.force,
  exists: fsApi.exists,
  readFile: fsApi.readFile,
});

if (!assertNoErrors(surfaceDiagnostics)) {
  process.exit(process.exitCode || 1);
}

const contentSlugs = collectContentSlugs({ rootDir: process.cwd() });
const diagnostics = [];
let changed = 0;

for (const target of targets) {
  const source = fsApi.readFile(target.sourcePath);
  const compiled = compileEasyMarkdownSource(source, target);
  const referenceDiagnostics = validateEasyMarkdownReferences(compiled.ast, target, {
    exists: fsApi.exists,
    contentSlugs,
  });

  diagnostics.push(...compiled.diagnostics, ...referenceDiagnostics);

  if (hasErrors(compiled.diagnostics) || hasErrors(referenceDiagnostics)) {
    continue;
  }

  const generated = compiled.output;

  if (options.mode === 'check') {
    if (!fsApi.exists(target.outputPath)) {
      diagnostics.push(createDiagnostic('EASY007', 'Generated index.md is missing.', {
        file: target.outputPath,
        hint: 'Run npm run easy:compile.',
      }));
      continue;
    }

    const current = fsApi.readFile(target.outputPath);
    const currentHash = readSourceHashFromGenerated(current);

    if (currentHash && currentHash !== compiled.sourceHash) {
      diagnostics.push(createDiagnostic('EASY019', 'Generated source hash does not match the Easy Markdown source.', {
        file: target.outputPath,
        hint: 'Run npm run easy:compile.',
      }));
    }

    if (normalizeGeneratedOutput(current) !== normalizeGeneratedOutput(generated)) {
      diagnostics.push(createDiagnostic('EASY007', 'Generated index.md is stale.', {
        file: target.outputPath,
        hint: 'Run npm run easy:compile.',
      }));
    }

    continue;
  }

  fsApi.writeFile(target.outputPath, generated);
  changed += 1;
}

if (diagnostics.length) {
  const grouped = splitDiagnosticsBySeverity(diagnostics);
  const errorCount = grouped.error.length;
  const warningCount = grouped.warning.length;
  const infoCount = grouped.info.length;

  if (errorCount || warningCount || infoCount) {
    console.error(`[Easy Markdown] Found ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info message(s).`);
  }

  printDiagnostics(diagnostics);

  if (hasErrors(diagnostics)) {
    process.exit(1);
  }
}

summarizeSuccess(options.mode, targets, changed);
