import { parseMicroMarkdown } from './parser.mjs';
import { createMicroDiagnostic } from './diagnostics.mjs';
import { MICRO_CALLOUT_MAP, MICRO_CASE_BLOCK_MAP } from './shorthands.mjs';

function quoteArg(value) {
  const text = String(value || '').trim();
  if (!text) return '""';
  return `"${text.replace(/"/g, '\\"')}"`;
}

function splitPipes(value) {
  return String(value || '')
    .split('|')
    .map((part) => part.trim());
}

function splitCommaOptions(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatMicroOption(part) {
  const [rawKey, ...rest] = String(part || '').split('=');
  const key = String(rawKey || '').trim();
  const rawValue = rest.join('=').trim();

  if (!key) return '';
  if (!rest.length) return key;
  if (!rawValue) return `${key}=`;
  if (/^(?:true|false|-?\d+(?:\.\d+)?)$/i.test(rawValue)) return `${key}=${rawValue}`;
  if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) return `${key}=${rawValue}`;
  if (/\s/.test(rawValue)) return `${key}=${quoteArg(rawValue)}`;

  return `${key}=${rawValue}`;
}

function commaOptionsToSpace(value) {
  return splitCommaOptions(value)
    .map(formatMicroOption)
    .filter(Boolean)
    .join(' ');
}

function normalizeCollapseOptions(optionText) {
  const output = [];

  for (const part of splitCommaOptions(optionText)) {
    const [rawKey, ...rest] = part.split('=');
    const key = String(rawKey || '').trim();
    const value = rest.join('=').trim();

    if (!key) continue;

    if (key === 'collapse' || key === 'open') {
      if (value === 'true') {
        output.push('collapsible=true', 'defaultOpen=true');
      } else if (value === 'false') {
        output.push('collapsible=true', 'defaultOpen=false');
      } else {
        output.push(`${key}=${value}`);
      }
      continue;
    }

    output.push(formatMicroOption(part));
  }

  return output.filter(Boolean).join(' ');
}

function normalizeWorkArgs(payload) {
  return commaOptionsToSpace(payload);
}

function trimBodyLines(body) {
  const lines = [...(body || [])];
  while (lines.length && !String(lines[0] || '').trim()) lines.shift();
  while (lines.length && !String(lines[lines.length - 1] || '').trim()) lines.pop();
  return lines;
}

function emitBlock(command, args, body) {
  const lines = [`@${command}${args ? ` ${args}` : ''}`];
  const normalizedBody = trimBodyLines(body);
  if (normalizedBody.length) lines.push(...normalizedBody);
  lines.push('@end');
  return lines.join('\n');
}

function compileInlineCommand(command, diagnostics, target) {
  const name = command.name;
  const payload = command.payload;

  if (/^H[1-4]$/.test(name)) {
    if (!payload) {
      diagnostics.push(createMicroDiagnostic('MICRO001', `Missing @${name}_ heading text.`, {
        file: target.sourcePath,
        line: command.line,
      }));
    }

    return `${'#'.repeat(Number(name.slice(1)))} ${payload}`;
  }

  if (name === 'DESC') return `@description ${payload}`;
  if (name === 'SLUG') return `@slug ${payload}`;
  if (name === 'PUBLIC') return '@public';
  if (name === 'DRAFT') return '@draft';
  if (name === 'HIDDEN') return '@hidden';
  if (name === 'COVER') return `@cover ${payload}`;
  if (name === 'THUMB') return `@thumb ${payload}`;
  if (name === 'WORK') return `@work ${normalizeWorkArgs(payload)}`;
  if (name === 'ROLE') return `@role ${payload}`;
  if (name === 'STACK') return `@stack ${payload}`;
  if (name === 'TOOLS') return `@tools ${payload}`;
  if (name === 'TAG') return `@tags ${payload}`;
  if (name === 'TITLE') return compileEditorialTitleCommand(command, diagnostics, target);
  if (name === 'REL') return compileRelatedCommand(command, diagnostics, target);
  if (name === 'GAP') return compileSectionGapCommand(command);
  if (name === 'BR') return compileSectionBreakCommand(command);

  diagnostics.push(createMicroDiagnostic('MICRO003', `Unknown inline Micro Markdown command: @${name}`, {
    file: target.sourcePath,
    line: command.line,
  }));
  return command.raw || '';
}

function compileEditorialTitleCommand(command, diagnostics, target) {
  const [title, options] = splitPipes(command.payload);
  if (!title) {
    diagnostics.push(createMicroDiagnostic('MICRO060', 'Missing @TITLE_ text.', {
      file: target.sourcePath,
      line: command.line,
    }));
  }

  return ['@title', title ? quoteArg(title) : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
}

function compileRelatedCommand(command, diagnostics, target) {
  const items = String(command.payload || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items.length) {
    diagnostics.push(createMicroDiagnostic('MICRO058', 'Empty @REL_ related works list.', {
      severity: 'warning',
      file: target.sourcePath,
      line: command.line,
      hint: 'Use @REL_slug-one,slug-two.',
    }));
  }

  return ['@related', ...items.map((item) => `- ${item}`), '@end'].join('\n');
}

function compileSectionGapCommand(command) {
  const [size, options] = splitPipes(command.payload);
  const args = [size ? `size=${size}` : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return `@section-gap${args ? ` ${args}` : ''}`;
}

function compileSectionBreakCommand(command) {
  const [label, options] = splitPipes(command.payload);
  const args = [label ? `label=${quoteArg(label)}` : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return `@section-break${args ? ` ${args}` : ''}`;
}

function compileCaseBlock(block) {
  return emitBlock(MICRO_CASE_BLOCK_MAP[block.name], commaOptionsToSpace(block.payload), block.body);
}

function compileImageBlock(block, diagnostics, target) {
  const [src, alt, options] = splitPipes(block.payload);

  if (!src) diagnostics.push(createMicroDiagnostic('MICRO020', 'Missing @IMG source path.', { file: target.sourcePath, line: block.line }));
  if (!alt) diagnostics.push(createMicroDiagnostic('MICRO021', 'Missing @IMG alt text.', { severity: 'warning', file: target.sourcePath, line: block.line }));

  const args = [src || '', alt ? quoteArg(alt) : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return emitBlock('image', args, block.body);
}

function compileBeforeAfterBlock(block, diagnostics, target) {
  const [before, after, third, fourth] = splitPipes(block.payload);

  if (!before) diagnostics.push(createMicroDiagnostic('MICRO030', 'Missing before image in @BA/@WIPE.', { file: target.sourcePath, line: block.line }));
  if (!after) diagnostics.push(createMicroDiagnostic('MICRO031', 'Missing after image in @BA/@WIPE.', { file: target.sourcePath, line: block.line }));

  const args = [`before=${before || ''}`, `after=${after || ''}`];
  let caption = '';

  if (third) {
    if (/^\d+(?:\.\d+)?$/.test(third)) {
      const initial = Number(third);
      if (!Number.isFinite(initial) || initial < 0 || initial > 100) {
        diagnostics.push(createMicroDiagnostic('MICRO032', `Invalid before-after initial value: ${third}`, { file: target.sourcePath, line: block.line }));
      }
      args.push(`initial=${third}`);
      caption = fourth || '';
    } else {
      caption = third;
    }
  }

  return emitBlock('compare', args.join(' '), caption ? [caption, ...block.body] : block.body);
}

function compileVideoBlock(block, diagnostics, target) {
  const [src, title, options] = splitPipes(block.payload);
  if (!src) diagnostics.push(createMicroDiagnostic('MICRO040', 'Missing @V video source path.', { file: target.sourcePath, line: block.line }));

  const args = [src || '', title ? `title=${quoteArg(title)}` : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return emitBlock('video', args, block.body);
}

function compileDemoBlock(block, diagnostics, target) {
  const [idOrSrc, title, options] = splitPipes(block.payload);
  if (!idOrSrc) diagnostics.push(createMicroDiagnostic('MICRO060', 'Missing @DEMO id or src.', { file: target.sourcePath, line: block.line }));

  const args = [];
  if (block.name === 'DEMO_SRC') {
    args.push(`src=${quoteArg(idOrSrc || '')}`);
  } else {
    args.push(idOrSrc || '');
  }
  if (title) args.push(`title=${quoteArg(title)}`);
  if (options) args.push(commaOptionsToSpace(options));

  return emitBlock('demo', args.filter(Boolean).join(' '), block.body);
}

function compileCalloutBlock(block, diagnostics, target) {
  const easyCommand = MICRO_CALLOUT_MAP[block.name];
  const [title, options] = splitPipes(block.payload);

  if (!easyCommand) {
    diagnostics.push(createMicroDiagnostic('MICRO003', `Unknown callout Micro Markdown command: @${block.name}`, {
      file: target.sourcePath,
      line: block.line,
    }));
    return '';
  }

  const args = [title ? quoteArg(title) : '', normalizeCollapseOptions(options || '')].filter(Boolean).join(' ');
  return emitBlock(easyCommand, args, block.body);
}

function parseItemLine(rawLine) {
  const line = String(rawLine || '').trim();
  const payload = line.replace(/^@ITEM[=_]?/, '').trim();
  const [src, title, options] = splitPipes(payload);
  return { src, title, options };
}

function compileGalleryBlock(block, diagnostics, target) {
  const [title, options] = splitPipes(block.payload);
  const itemLines = [];

  for (const rawLine of block.body || []) {
    const trimmed = String(rawLine || '').trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith('@ITEM')) continue;

    const item = parseItemLine(trimmed);
    if (!item.src) {
      diagnostics.push(createMicroDiagnostic('MICRO052', 'Missing @ITEM source path.', {
        file: target.sourcePath,
        line: block.line,
        hint: 'Use @ITEM=./images/example.webp|Caption|label=01.',
      }));
    }

    itemLines.push(['@item', item.src || '', item.title ? quoteArg(item.title) : '', commaOptionsToSpace(item.options || '')].filter(Boolean).join(' '));
  }

  if (!itemLines.length) {
    diagnostics.push(createMicroDiagnostic('MICRO051', '@GAL_ has no @ITEM= entries.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Add one or more @ITEM= lines after @GAL_.',
    }));
  }

  const args = [title ? quoteArg(title) : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return emitBlock('gallery', args, itemLines);
}

function compileMetricBlock(block, diagnostics, target) {
  const [title, options] = splitPipes(block.payload);

  if (!title) {
    diagnostics.push(createMicroDiagnostic('MICRO054', 'Missing @METRIC_ title.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @METRIC_Title|value=1,unit=count.',
    }));
  }

  const args = [title ? quoteArg(title) : '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return emitBlock('metric', args, block.body);
}

function compileToolstackBlock(block, diagnostics, target) {
  const usefulLines = (block.body || []).filter((line) => String(line || '').trim());
  if (!usefulLines.length) {
    diagnostics.push(createMicroDiagnostic('MICRO056', 'Empty @TOOLSTACK_ block.', {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'Add stack:, tools:, runtime:, language:, or storage: lines.',
    }));
  }

  const allowed = new Set(['stack', 'tools', 'runtime', 'language', 'storage']);
  for (const rawLine of usefulLines) {
    const key = String(rawLine || '').split(':')[0].trim();
    if (key && !allowed.has(key)) {
      diagnostics.push(createMicroDiagnostic('MICRO057', `Unknown @TOOLSTACK_ key: ${key}`, {
        severity: 'warning',
        file: target.sourcePath,
        line: block.line,
        hint: 'Supported keys are stack, tools, runtime, language, and storage.',
      }));
    }
  }

  return emitBlock('tools', '', block.body);
}

function parseColumnLine(rawLine) {
  const line = String(rawLine || '').trim();
  return line.replace(/^@COL_?/, '').trim();
}

function compileColumnsBlock(block, diagnostics, target) {
  const [cols, options] = splitPipes(block.payload);
  const lines = [];
  let columnCount = 0;

  for (const rawLine of block.body || []) {
    const trimmed = String(rawLine || '').trim();
    if (trimmed.startsWith('@COL')) {
      columnCount += 1;
      lines.push(`@col ${parseColumnLine(trimmed)}`.trimEnd());
      continue;
    }
    lines.push(rawLine);
  }

  if (!columnCount) {
    diagnostics.push(createMicroDiagnostic('MICRO063', '@COLS_ has no @COL_ sections.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Add at least two @COL_ sections inside @COLS_.',
    }));
  }

  const numericCols = Number(cols);
  if (!cols || !Number.isInteger(numericCols) || numericCols < 2 || numericCols > 3) {
    diagnostics.push(createMicroDiagnostic('MICRO064', `Invalid @COLS_ count: ${cols}`, {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @COLS_2 or @COLS_3.',
    }));
  }

  const args = [cols || '', commaOptionsToSpace(options || '')].filter(Boolean).join(' ');
  return emitBlock('columns', args, lines);
}

function compileBlock(block, diagnostics, target) {
  if (MICRO_CASE_BLOCK_MAP[block.name]) return compileCaseBlock(block);
  if (block.name === 'IMG') return compileImageBlock(block, diagnostics, target);
  if (block.name === 'BA' || block.name === 'WIPE') return compileBeforeAfterBlock(block, diagnostics, target);
  if (block.name === 'V') return compileVideoBlock(block, diagnostics, target);
  if (block.name === 'DEMO' || block.name === 'DEMO_SRC') return compileDemoBlock(block, diagnostics, target);
  if (MICRO_CALLOUT_MAP[block.name]) return compileCalloutBlock(block, diagnostics, target);
  if (block.name === 'GAL') return compileGalleryBlock(block, diagnostics, target);
  if (block.name === 'METRIC') return compileMetricBlock(block, diagnostics, target);
  if (block.name === 'TOOLSTACK') return compileToolstackBlock(block, diagnostics, target);
  if (block.name === 'COLS') return compileColumnsBlock(block, diagnostics, target);

  diagnostics.push(createMicroDiagnostic('MICRO003', `Unknown Micro Markdown block: @${block.name}`, {
    file: target.sourcePath,
    line: block.line,
  }));
  return '';
}

export function createMicroGeneratedMarker(sourceName) {
  return `<!--\nGENERATED FROM ${sourceName}.\nDo not edit this file directly.\nRun: npm run micro:compile\n-->`;
}

export function compileMicroToEasy(source, target = {}) {
  const ast = parseMicroMarkdown(source, target);
  const diagnostics = [...(ast.diagnostics || [])];
  const lines = [createMicroGeneratedMarker(target.sourcePath?.split('/').pop() || 'micro.md'), ''];

  for (const node of ast.nodes) {
    if (node.type === 'inline') {
      lines.push(compileInlineCommand(node.command, diagnostics, target), '');
      continue;
    }

    if (node.type === 'block') {
      lines.push(compileBlock(node.block, diagnostics, target), '');
      continue;
    }

    if (node.type === 'text') {
      lines.push(node.value);
    }
  }

  const easySource = `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;

  return { easySource, diagnostics, ast };
}
