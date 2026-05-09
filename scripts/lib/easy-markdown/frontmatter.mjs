import path from 'node:path';

import { isBoolean, parseCommaList, parseKeyValueArgs, parseScalar } from './args.mjs';
import { createDiagnostic } from './diagnostics.mjs';

const KNOWN_COMMANDS = new Set([
  'description',
  'slug',
  'public',
  'hidden',
  'draft',
  'cover',
  'thumb',
  'work',
  'role',
  'stack',
  'tools',
  'tags',
]);

const RESERVED_BLOCK_COMMANDS = new Set([
  'summary',
  'problem',
  'decision',
  'solution',
  'process',
  'result',
  'hero',
  'metric',
  'gallery',
  'item',
  'related',
  'tools',
  'image',
  'compare',
  'video',
  'title',
  'columns',
  'col',
  'featured-works',
  'work-card',
  'pagecards',
  'box',
  'note',
  'tip',
  'warning',
  'danger',
  'ssot',
  'quote',
  'quote-box',
  'decision-box',
  'section-gap',
  'section-break',
  'product',
  'price',
  'catalog',
  'cta',
  'trust',
  'specs',
  'variants',
  'store-nav',
  'inquiry',
  'claim',
]);

function inferSlugFromTarget(target) {
  const marker = 'src/content/pages/';
  const dir = target.dir || '';

  if (dir.startsWith(marker)) return dir.slice(marker.length);

  return path.basename(dir);
}

function isValidSlug(slug) {
  return /^[A-Za-z0-9/_-]+$/.test(slug) && !slug.includes('//') && !slug.includes('..') && !slug.includes('\\');
}

function quoteYaml(value) {
  return JSON.stringify(String(value ?? ''));
}

function appendYaml(lines, key, value, indent = 0) {
  const pad = ' '.repeat(indent);

  if (Array.isArray(value)) {
    if (!value.length) return;
    lines.push(`${pad}${key}:`);
    for (const item of value) {
      lines.push(`${pad}  - ${quoteYaml(item)}`);
    }
    return;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    lines.push(`${pad}${key}: ${value}`);
    return;
  }

  lines.push(`${pad}${key}: ${quoteYaml(value)}`);
}

export function collectFrontmatter(ast, target) {
  const diagnostics = [];
  const frontmatter = {
    title: ast.title || '',
    description: '',
    slug: '',
    status: 'draft',
    visibility: 'hidden',
  };
  const work = {
    status: 'draft',
    featured: false,
  };
  const visibilityCommands = [];

  for (const command of ast.commands) {
    if (!KNOWN_COMMANDS.has(command.name)) {
      diagnostics.push(
        createDiagnostic('EASY004', `Unknown Easy Markdown command: @${command.name}`, {
          file: target.sourcePath,
          line: command.line,
        }),
      );
      continue;
    }

    if (command.name === 'description') {
      frontmatter.description = parseScalar(command.args);
      continue;
    }

    if (command.name === 'slug') {
      frontmatter.slug = parseScalar(command.args);
      continue;
    }

    if (command.name === 'public') {
      visibilityCommands.push(command.name);
      frontmatter.status = 'active';
      frontmatter.visibility = 'public';
      continue;
    }

    if (command.name === 'hidden') {
      visibilityCommands.push(command.name);
      frontmatter.status = 'active';
      frontmatter.visibility = 'hidden';
      continue;
    }

    if (command.name === 'draft') {
      visibilityCommands.push(command.name);
      frontmatter.status = 'draft';
      frontmatter.visibility = 'hidden';
      continue;
    }

    if (command.name === 'cover') {
      frontmatter.cover = parseScalar(command.args);
      continue;
    }

    if (command.name === 'thumb') {
      frontmatter.thumbnail = parseScalar(command.args);
      continue;
    }

    if (command.name === 'work') {
      const parsed = parseKeyValueArgs(command.args, { file: target.sourcePath, line: command.line });
      diagnostics.push(...parsed.diagnostics);

      for (const [key, value] of Object.entries(parsed.values)) {
        work[key] = value;
      }
      continue;
    }

    if (command.name === 'role') {
      work.role = parseCommaList(command.args);
      continue;
    }

    if (command.name === 'stack') {
      work.stack = parseCommaList(command.args);
      continue;
    }

    if (command.name === 'tools') {
      work.tools = parseCommaList(command.args);
      continue;
    }

    if (command.name === 'tags') {
      work.tags = parseCommaList(command.args);
      continue;
    }
  }

  for (const block of ast.blocks) {
    if (block.unclosed) {
      diagnostics.push(createDiagnostic('EASY005', `Unclosed @${block.name} block.`, {
        file: target.sourcePath,
        line: block.line,
        hint: 'Close the block with @end.',
      }));
    }

    if (!RESERVED_BLOCK_COMMANDS.has(block.name)) {
      diagnostics.push(createDiagnostic('EASY004', `Unknown Easy Markdown block: @${block.name}`, {
        file: target.sourcePath,
        line: block.line,
      }));
    }
  }

  if (!frontmatter.title) {
    diagnostics.push(createDiagnostic('EASY001', 'Missing page title.', {
      file: target.sourcePath,
      line: 1,
      hint: 'Start the file with a level-one heading, for example: # VARUNTOOLS',
    }));
  }

  if (!frontmatter.description) {
    diagnostics.push(createDiagnostic('EASY002', 'Missing page description.', {
      severity: 'warning',
      file: target.sourcePath,
      hint: 'Add @description for SEO/search summaries.',
    }));
  }

  if (!frontmatter.slug) {
    frontmatter.slug = inferSlugFromTarget(target);
  }

  if (!isValidSlug(frontmatter.slug)) {
    diagnostics.push(createDiagnostic('EASY003', `Invalid slug: ${frontmatter.slug}`, {
      file: target.sourcePath,
      hint: 'Use letters, numbers, slash, underscore, or hyphen. Do not use spaces or backslashes.',
    }));
  }

  if (visibilityCommands.length > 1) {
    diagnostics.push(createDiagnostic('EASY015', `Duplicate visibility commands: ${visibilityCommands.join(', ')}`, {
      file: target.sourcePath,
      hint: 'Use only one of @public, @hidden, or @draft.',
    }));
  }

  if ('year' in work && (!Number.isInteger(work.year) || work.year < 1900 || work.year > 3000)) {
    diagnostics.push(createDiagnostic('EASY013', `Invalid work year: ${work.year}`, {
      file: target.sourcePath,
      hint: 'Use a four-digit numeric year.',
    }));
  }

  if ('featured' in work && !isBoolean(work.featured)) {
    diagnostics.push(createDiagnostic('EASY014', `Invalid featured value: ${work.featured}`, {
      file: target.sourcePath,
      hint: 'Use featured=true or featured=false.',
    }));
  }

  if (target.kind === 'work' || Object.keys(work).length > 2) {
    frontmatter.work = work;
  }

  return { frontmatter, diagnostics };
}

export function stringifyFrontmatter(frontmatter) {
  const lines = ['---'];
  const orderedKeys = ['title', 'description', 'slug', 'status', 'visibility', 'cover', 'thumbnail'];

  for (const key of orderedKeys) {
    if (frontmatter[key] !== undefined && frontmatter[key] !== '') {
      appendYaml(lines, key, frontmatter[key]);
    }
  }

  if (frontmatter.work) {
    lines.push('work:');
    const workKeys = ['type', 'status', 'year', 'featured', 'weight', 'role', 'stack', 'tools', 'tags'];

    for (const key of workKeys) {
      if (frontmatter.work[key] !== undefined && frontmatter.work[key] !== '' && !(Array.isArray(frontmatter.work[key]) && !frontmatter.work[key].length)) {
        appendYaml(lines, key, frontmatter.work[key], 2);
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}
