import { isBoolean, parseKeyValueArgs, parseMixedArgs } from './args.mjs';
import { createDiagnostic } from './diagnostics.mjs';

const CASE_SECTION_MAP = {
  problem: {
    type: 'problem',
    title: '문제',
  },
  decision: {
    type: 'decision',
    title: '판단',
  },
  solution: {
    type: 'solution',
    title: '해결',
  },
  process: {
    type: 'process',
    title: '과정',
  },
  result: {
    type: 'result',
    title: '결과',
  },
};

const MEDIA_BLOCKS = new Set(['image', 'compare', 'video']);
const PORTFOLIO_BLOCKS = new Set(['gallery', 'related', 'metric', 'tools']);
const MARKDOWN_BOX_SHORTCUTS = {
  note: 'note',
  tip: 'tip',
  warning: 'warning',
  danger: 'danger',
  ssot: 'ssot',
  'quote-box': 'quote',
  'decision-box': 'decision',
};
const EDITORIAL_BLOCKS = new Set(['title', 'columns', 'box', ...Object.keys(MARKDOWN_BOX_SHORTCUTS), 'section-gap', 'section-break']);
const SUPPORTED_BLOCKS = new Set([
  'summary',
  ...Object.keys(CASE_SECTION_MAP),
  ...MEDIA_BLOCKS,
  ...PORTFOLIO_BLOCKS,
  ...EDITORIAL_BLOCKS,
]);

function normalizeBody(body) {
  const lines = [...(body || [])];

  while (lines.length && !String(lines[0] || '').trim()) lines.shift();
  while (lines.length && !String(lines[lines.length - 1] || '').trim()) lines.pop();

  return lines.join('\n');
}

function normalizeInlineBody(body) {
  return normalizeBody(body)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

function formatDirectiveValue(value) {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return String(value ?? '');
}

function formatDirectiveAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${formatDirectiveValue(value)}`)
    .join('\n');
}

function emitLeafDirective(name, attributes) {
  const attrs = formatDirectiveAttributes(attributes);
  return attrs ? `::${name}\n${attrs}\n::` : `::${name}\n::`;
}

function parseBlockArgs(block, target) {
  if (!String(block.args || '').trim()) {
    return { values: {}, diagnostics: [] };
  }

  return parseKeyValueArgs(block.args, {
    file: target.sourcePath,
    line: block.line,
  });
}

function parseMediaArgs(block, target) {
  return parseMixedArgs(block.args, {
    file: target.sourcePath,
    line: block.line,
  });
}

function createEmptyBodyWarning(block, target) {
  return createDiagnostic('EASY016', `Empty @${block.name} block.`, {
    severity: 'warning',
    file: target.sourcePath,
    line: block.line,
    hint: 'Add body content between the command and @end.',
  });
}

function validateBooleanAttributes(values, keys, block, target) {
  const diagnostics = [];

  for (const key of keys) {
    if (values[key] === undefined) continue;
    if (!isBoolean(values[key])) {
      diagnostics.push(createDiagnostic('EASY014', `Invalid ${key} value: ${values[key]}`, {
        file: target.sourcePath,
        line: block.line,
        hint: `Use ${key}=true or ${key}=false.`,
      }));
    }
  }

  return diagnostics;
}

export function compileWorkSummary(block, target) {
  const diagnostics = [];
  const parsed = parseBlockArgs(block, target);
  diagnostics.push(...parsed.diagnostics);

  const body = normalizeBody(block.body);

  if (!body) diagnostics.push(createEmptyBodyWarning(block, target));

  const attrs = formatDirectiveAttributes(parsed.values);
  const header = attrs ? `::work-summary\n${attrs}\n::` : '::work-summary\n::';

  return {
    output: `${header}\n${body}\n::`,
    diagnostics,
  };
}

export function compileCaseSection(block, target) {
  const defaults = CASE_SECTION_MAP[block.name];
  const diagnostics = [];
  const parsed = parseBlockArgs(block, target);
  diagnostics.push(...parsed.diagnostics);

  const attributes = {
    type: defaults.type,
    title: parsed.values.title || defaults.title,
  };

  for (const [key, value] of Object.entries(parsed.values)) {
    if (key === 'title') continue;
    attributes[key] = value;
  }

  const body = normalizeBody(block.body);

  if (!body) diagnostics.push(createEmptyBodyWarning(block, target));

  return {
    output: `::case-section\n${formatDirectiveAttributes(attributes)}\n::\n${body}\n::`,
    diagnostics,
  };
}

export function compileImageBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const [src, alt] = parsed.positionals;
  const caption = normalizeInlineBody(block.body);

  if (!src) {
    diagnostics.push(createDiagnostic('EASY020', 'Missing @image source path.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @image ./images/example.webp "Alt text".',
    }));
  }

  if (!alt) {
    diagnostics.push(createDiagnostic('EASY021', 'Missing @image alt text.', {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'Add a quoted alt text after the image path.',
    }));
  }

  const attributes = {
    src,
    alt,
    caption,
    ...parsed.values,
  };

  return {
    output: emitLeafDirective('captioned-image', attributes),
    diagnostics,
  };
}

export function compileCompareBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const caption = normalizeInlineBody(block.body);
  const { before, after, initial, ...rest } = parsed.values;

  if (!before) {
    diagnostics.push(createDiagnostic('EASY022', 'Missing @compare before image.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use before=./images/before.webp.',
    }));
  }

  if (!after) {
    diagnostics.push(createDiagnostic('EASY023', 'Missing @compare after image.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use after=./images/after.webp.',
    }));
  }

  if (initial !== undefined && (typeof initial !== 'number' || !Number.isFinite(initial) || initial < 0 || initial > 100)) {
    diagnostics.push(createDiagnostic('EASY024', `Invalid @compare initial value: ${initial}`, {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use a number between 0 and 100.',
    }));
  }

  const attributes = {
    before,
    after,
    initial,
    caption,
    ...rest,
  };

  return {
    output: emitLeafDirective('before-after', attributes),
    diagnostics,
  };
}

export function compileVideoBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const [src] = parsed.positionals;
  const caption = normalizeInlineBody(block.body);

  diagnostics.push(...validateBooleanAttributes(parsed.values, ['controls', 'muted', 'autoplay', 'loop'], block, target));

  if (!src && !parsed.values.src && !parsed.values.stream) {
    diagnostics.push(createDiagnostic('EASY025', 'Missing @video source path.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @video ./videos/demo.webm poster=./images/poster.webp title="Demo".',
    }));
  }

  const attributes = {
    src: src || parsed.values.src,
    caption,
    ...parsed.values,
  };

  return {
    output: emitLeafDirective('video-player', attributes),
    diagnostics,
  };
}

function toJsonList(items) {
  return JSON.stringify((items || []).map((item) => String(item || '').trim()).filter(Boolean));
}

function parseBodyKeyValueLists(body) {
  const groups = {};
  const diagnostics = [];

  for (const rawLine of body || []) {
    const line = String(rawLine || '').trim();
    if (!line) continue;

    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    groups[key] = String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return { groups, diagnostics };
}

function parseRelatedItems(body) {
  return (body || [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())
    .filter(Boolean);
}

function splitGalleryBody(body) {
  const lines = body || [];
  const items = [];
  const notes = [];
  let caption = '';

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line) {
      notes.push(rawLine);
      continue;
    }

    if (line.startsWith('@item')) {
      items.push({ line, args: line.replace(/^@item\s*/, '').trim() });
      continue;
    }

    const captionMatch = line.match(/^caption:\s*(.*)$/i);
    if (captionMatch) {
      caption = captionMatch[1].trim();
      continue;
    }

    notes.push(rawLine);
  }

  return { caption, items, notes };
}

function formatGalleryMeta(values, fallbackAlt) {
  const meta = { ...values };

  if (!meta.alt && fallbackAlt) meta.alt = fallbackAlt;

  return Object.entries(meta)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('; ');
}

export function compileGalleryBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const [title] = parsed.positionals;
  const { caption, items } = splitGalleryBody(block.body);
  const { columns, ...rest } = parsed.values;

  if (columns !== undefined && (typeof columns !== 'number' || !Number.isFinite(columns) || columns < 1)) {
    diagnostics.push(createDiagnostic('EASY032', `Invalid @gallery columns value: ${columns}`, {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use columns=2 or another positive number.',
    }));
  }

  if (!items.length) {
    diagnostics.push(createDiagnostic('EASY031', '@gallery has no @item entries.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Add at least one @item line before @end.',
    }));
  }

  const itemLines = items.map((item) => {
    const itemParsed = parseMediaArgs({ ...block, args: item.args, line: block.line }, target);
    diagnostics.push(...itemParsed.diagnostics);

    const [src, itemTitle] = itemParsed.positionals;
    const { thumb = '', alt = itemTitle || '', ...itemRest } = itemParsed.values;

    if (!src) {
      diagnostics.push(createDiagnostic('EASY030', 'Missing @gallery @item source path.', {
        file: target.sourcePath,
        line: block.line,
        hint: 'Use @item ./images/example.webp "Caption" label=01.',
      }));
    }

    const meta = formatGalleryMeta({ alt, ...itemRest }, itemTitle);
    return `- ${src || ''} | ${itemTitle || alt || ''} | ${thumb || ''} | ${meta}`;
  });

  const attributes = {
    title: title || parsed.values.title,
    caption: caption || parsed.values.caption,
    columns,
    ...rest,
  };

  return {
    output: `::case-gallery\n${formatDirectiveAttributes(attributes)}\n::\n${itemLines.join('\n')}\n::`,
    diagnostics,
  };
}

export function compileRelatedBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const items = parseRelatedItems(block.body);

  if (!items.length) {
    diagnostics.push(createDiagnostic('EASY033', '@related has no items.', {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'Add one or more related work slugs as list items.',
    }));
  }

  const attributes = {
    title: parsed.positionals[0] || parsed.values.title,
    'items-json': toJsonList(items),
    ...parsed.values,
  };

  delete attributes.title;
  if (parsed.positionals[0] || parsed.values.title) attributes.title = parsed.positionals[0] || parsed.values.title;

  return {
    output: emitLeafDirective('related-works', attributes),
    diagnostics,
  };
}

export function compileMetricBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const [title] = parsed.positionals;
  const body = normalizeBody(block.body);

  if (!title && !parsed.values.title) {
    diagnostics.push(createDiagnostic('EASY034', 'Missing @metric title.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @metric "Metric title" value=1 unit=system.',
    }));
  }

  const attributes = {
    title: title || parsed.values.title,
    ...parsed.values,
  };

  return {
    output: `::metric-card\n${formatDirectiveAttributes(attributes)}\n::\n${body}\n::`,
    diagnostics,
  };
}

export function compileToolsBlock(block, target) {
  const diagnostics = [];
  const parsed = parseBlockArgs(block, target);
  diagnostics.push(...parsed.diagnostics);
  const { groups } = parseBodyKeyValueLists(block.body);
  const allowed = new Set(['stack', 'tools', 'language', 'runtime', 'storage']);
  const attributes = { ...parsed.values };

  for (const key of Object.keys(groups)) {
    if (!allowed.has(key)) {
      diagnostics.push(createDiagnostic('EASY036', `Unknown @tools key: ${key}`, {
        severity: 'warning',
        file: target.sourcePath,
        line: block.line,
        hint: 'Supported keys are stack, tools, language, runtime, and storage.',
      }));
      continue;
    }

    attributes[`${key}-json`] = toJsonList(groups[key]);
  }

  const hasAnyGroup = Object.keys(attributes).some((key) => key.endsWith('-json'));
  if (!hasAnyGroup) {
    diagnostics.push(createDiagnostic('EASY035', '@tools block is empty.', {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'Add stack:, tools:, language:, runtime:, or storage: lines.',
    }));
  }

  return {
    output: emitLeafDirective('tool-stack', attributes),
    diagnostics,
  };
}

function validateEditorialTitleAttributes(values, block, target) {
  const diagnostics = [];
  const as = values.as;
  const align = values.align;

  if (as !== undefined && !['h1', 'h2', 'h3', 'h4'].includes(String(as))) {
    diagnostics.push(createDiagnostic('EASY041', `Invalid @title heading tag: ${as}`, {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'The current editorial-title directive supports h1, h2, h3, or h4.',
    }));
  }

  if (align !== undefined && !['left', 'center'].includes(String(align))) {
    diagnostics.push(createDiagnostic('EASY042', `Invalid @title align value: ${align}`, {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'The current editorial-title directive supports align=left or align=center.',
    }));
  }

  return diagnostics;
}

export function compileEditorialTitleBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const title = parsed.positionals[0] || parsed.values.title;
  const { title: ignoredTitle, ...rest } = parsed.values;

  diagnostics.push(...validateEditorialTitleAttributes(parsed.values, block, target));

  if (!title) {
    diagnostics.push(createDiagnostic('EASY040', 'Missing @title text.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Use @title "Section title" kicker=OPTIONAL.',
    }));
  }

  const attributes = {
    title,
    ...rest,
  };

  return {
    output: emitLeafDirective('editorial-title', attributes),
    diagnostics,
  };
}

function splitColumnsBody(body) {
  const columns = [];
  let current = null;

  for (const rawLine of body || []) {
    const line = String(rawLine || '');
    const trimmed = line.trim();

    if (trimmed.startsWith('@col')) {
      if (current) columns.push(current);
      current = {
        title: trimmed.replace(/^@col\s*/, '').trim(),
        body: [],
      };
      continue;
    }

    if (!current) continue;
    current.body.push(rawLine);
  }

  if (current) columns.push(current);

  return columns.map((column) => {
    const body = normalizeBody(column.body);
    return column.title ? `### ${column.title}\n\n${body}`.trim() : body;
  }).filter(Boolean);
}

export function compileEditorialColumnsBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const positionalCols = parsed.positionals[0] !== undefined ? Number(parsed.positionals[0]) : undefined;
  const namedCols = parsed.values.cols ?? parsed.values.columns;
  const cols = namedCols !== undefined ? Number(namedCols) : positionalCols;
  const { cols: ignoredCols, columns: ignoredColumns, ...rest } = parsed.values;
  const chunks = splitColumnsBody(block.body);

  if (!chunks.length) {
    diagnostics.push(createDiagnostic('EASY043', '@columns has no @col sections.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Add at least two @col sections inside @columns.',
    }));
  }

  if (cols !== undefined && (!Number.isInteger(cols) || cols < 2 || cols > 3)) {
    diagnostics.push(createDiagnostic('EASY044', `Invalid @columns count: ${namedCols ?? parsed.positionals[0]}`, {
      file: target.sourcePath,
      line: block.line,
      hint: 'The current editorial-columns directive supports 2 or 3 columns.',
    }));
  }

  if (chunks.length === 1) {
    diagnostics.push(createDiagnostic('EASY043', '@columns needs at least two @col sections.', {
      file: target.sourcePath,
      line: block.line,
      hint: 'Add another @col section or use ordinary Markdown instead.',
    }));
  }

  const attributes = {
    cols: cols || 2,
    ...rest,
  };

  return {
    output: `::editorial-columns\n${formatDirectiveAttributes(attributes)}\n::\n${chunks.join('\n\n---\n\n')}\n::`,
    diagnostics,
  };
}

function validateCalloutBooleanAttributes(values, block, target) {
  const diagnostics = [];

  for (const key of ['collapsible', 'defaultOpen', 'open']) {
    if (values[key] === undefined) continue;
    if (!isBoolean(values[key])) {
      diagnostics.push(createDiagnostic('EASY047', `Invalid @${block.name} ${key} value: ${values[key]}`, {
        file: target.sourcePath,
        line: block.line,
        hint: `Use ${key}=true or ${key}=false.`,
      }));
    }
  }

  return diagnostics;
}

export function compileMarkdownBoxBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const body = normalizeBody(block.body);
  const shortcutType = MARKDOWN_BOX_SHORTCUTS[block.name];
  const type = block.name === 'box'
    ? parsed.values.type || parsed.positionals[0] || 'note'
    : shortcutType;
  const title = block.name === 'box'
    ? parsed.values.title || parsed.positionals[1]
    : parsed.values.title || parsed.positionals[0];
  const {
    type: ignoredType,
    title: ignoredTitle,
    open,
    defaultOpen,
    ...rest
  } = parsed.values;

  diagnostics.push(...validateCalloutBooleanAttributes(parsed.values, block, target));

  if (!body) {
    diagnostics.push(createDiagnostic('EASY048', `Empty @${block.name} callout box.`, {
      severity: 'warning',
      file: target.sourcePath,
      line: block.line,
      hint: 'Add body content between the command and @end.',
    }));
  }

  const attributes = {
    type,
    title,
    ...rest,
  };

  if (defaultOpen !== undefined) {
    attributes.defaultOpen = defaultOpen;
  } else if (open !== undefined) {
    attributes.defaultOpen = open;
  }

  return {
    output: `::markdown-box
${formatDirectiveAttributes(attributes)}
::
${body}
::`,
    diagnostics,
  };
}

export function compileSectionGapBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const attributes = {
    size: parsed.positionals[0] || parsed.values.size || 'md',
    ...parsed.values,
  };

  return {
    output: emitLeafDirective('section-gap', attributes),
    diagnostics,
  };
}

export function compileSectionBreakBlock(block, target) {
  const parsed = parseMediaArgs(block, target);
  const diagnostics = [...parsed.diagnostics];
  const [label] = parsed.positionals;
  const attributes = {
    label: label || parsed.values.label,
    ...parsed.values,
  };

  return {
    output: emitLeafDirective('section-break', attributes),
    diagnostics,
  };
}

export function compileEditorialBlock(block, target) {
  if (block.name === 'title') return compileEditorialTitleBlock(block, target);
  if (block.name === 'columns') return compileEditorialColumnsBlock(block, target);
  if (block.name === 'box' || MARKDOWN_BOX_SHORTCUTS[block.name]) return compileMarkdownBoxBlock(block, target);
  if (block.name === 'section-gap') return compileSectionGapBlock(block, target);
  if (block.name === 'section-break') return compileSectionBreakBlock(block, target);

  return {
    output: '',
    diagnostics: [
      createDiagnostic('EASY004', `Unsupported editorial block: @${block.name}`, {
        file: target.sourcePath,
        line: block.line,
      }),
    ],
  };
}

export function compilePortfolioBlock(block, target) {
  if (block.name === 'gallery') return compileGalleryBlock(block, target);
  if (block.name === 'related') return compileRelatedBlock(block, target);
  if (block.name === 'metric') return compileMetricBlock(block, target);
  if (block.name === 'tools') return compileToolsBlock(block, target);

  return {
    output: '',
    diagnostics: [
      createDiagnostic('EASY004', `Unsupported portfolio block: @${block.name}`, {
        file: target.sourcePath,
        line: block.line,
      }),
    ],
  };
}

export function compileMediaBlock(block, target) {
  if (block.name === 'image') return compileImageBlock(block, target);
  if (block.name === 'compare') return compileCompareBlock(block, target);
  if (block.name === 'video') return compileVideoBlock(block, target);

  return {
    output: '',
    diagnostics: [
      createDiagnostic('EASY004', `Unsupported media block: @${block.name}`, {
        file: target.sourcePath,
        line: block.line,
      }),
    ],
  };
}

export function compileEasyBlock(block, target) {
  if (block.unclosed) {
    return {
      output: '',
      diagnostics: [
        createDiagnostic('EASY005', `Unclosed @${block.name} block.`, {
          file: target.sourcePath,
          line: block.line,
          hint: 'Close the block with @end.',
        }),
      ],
    };
  }

  if (!SUPPORTED_BLOCKS.has(block.name)) {
    return {
      output: '',
      diagnostics: [
        createDiagnostic('EASY004', `Unsupported Easy Markdown block in this compiler phase: @${block.name}`, {
          file: target.sourcePath,
          line: block.line,
          hint: 'This command is reserved for a later Easy Markdown commit or is misspelled.',
        }),
      ],
    };
  }

  if (block.name === 'summary') return compileWorkSummary(block, target);
  if (MEDIA_BLOCKS.has(block.name)) return compileMediaBlock(block, target);
  if (PORTFOLIO_BLOCKS.has(block.name)) return compilePortfolioBlock(block, target);
  if (EDITORIAL_BLOCKS.has(block.name)) return compileEditorialBlock(block, target);

  return compileCaseSection(block, target);
}

export function compileEasyBody(ast, target) {
  const diagnostics = [];
  const chunks = [];

  for (const node of ast.nodes || []) {
    if (node.type === 'text') {
      chunks.push(node.value);
      continue;
    }

    if (node.type === 'block') {
      const compiled = compileEasyBlock(node.block, target);
      diagnostics.push(...compiled.diagnostics);

      if (compiled.output) chunks.push(compiled.output);
    }
  }

  const output = chunks.join('\n\n').replace(/\n{4,}/g, '\n\n\n').trim();

  return {
    output: output || '<!-- EASY MARKDOWN BODY PLACEHOLDER -->',
    diagnostics,
  };
}
