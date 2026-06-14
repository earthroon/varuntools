import fs from 'node:fs';
import path from 'node:path';

import { parseMixedArgs, parseScalar } from './args.mjs';
import { compileEasyMarkdownSource } from './compiler.mjs';
import { createDiagnostic } from './diagnostics.mjs';
import { parseEasyMarkdown } from './parser.mjs';

const DEFAULT_CONTENT_ROOT = path.join('src', 'content', 'pages');
const DEFAULT_TEMPLATE_ROOT = path.join('src', 'content', 'templates', 'easy');
const EASY_TEMPLATE_FILES = {
  work: 'work.easy.md',
  page: 'page.easy.md',
  'case-study': 'case-study.easy.md',
};

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function titleFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeLineEndings(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function normalizeBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return Boolean(value);
}

function normalizeStatus(value) {
  const status = String(value || 'draft').trim().toLowerCase();
  if (!['published', 'draft', 'private'].includes(status)) {
    throw new Error(`EASY scaffold ERROR: --status must be one of published, draft, private. Received: ${value}`);
  }
  return status;
}

function visibilityCommandForStatus(status) {
  if (status === 'published') return '@public';
  if (status === 'private') return '@hidden';
  return '@draft';
}

function workStatusForStatus(status) {
  if (status === 'published') return 'published';
  if (status === 'private') return 'private';
  return 'draft';
}

function assertInsideRoot(rootDir, targetPath) {
  const absoluteRoot = path.resolve(rootDir);
  const absoluteTarget = path.resolve(targetPath);

  if (absoluteTarget !== absoluteRoot && !absoluteTarget.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error(`EASY scaffold ERROR: refused to write outside root: ${targetPath}`);
  }
}

export function normalizeScaffoldSlug(value) {
  const raw = String(value || '').trim();
  const normalized = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(`EASY051 invalid scaffold slug: ${value}`);
  }

  return normalized;
}

function normalizeSection(value) {
  const section = normalizeScaffoldSlug(value);
  if (section.includes('..') || section.includes('/') || section.includes('\\')) {
    throw new Error(`EASY scaffold ERROR: invalid section: ${value}`);
  }
  return section;
}

function replaceOrAppendLine(source, pattern, replacement) {
  if (pattern.test(source)) return source.replace(pattern, replacement);
  return `${source.trimEnd()}\n${replacement}\n`;
}

function replaceVisibilityCommand(source, command) {
  const visibilityPattern = /^@(public|hidden|draft)\s*$/m;
  if (visibilityPattern.test(source)) return source.replace(visibilityPattern, command);
  return source.replace(/^(@description\s+.*)$/m, `$1\n${command}`);
}

function renderDescription(description, templateKind) {
  if (description) return description;
  if (templateKind === 'case-study') return '문제 정의부터 결과까지 보여주는 케이스스터디입니다.';
  if (templateKind === 'work') return '이 작업을 한 문장으로 설명합니다.';
  return '이 페이지를 설명하는 한 문장입니다.';
}

export function resolveEasyTemplate(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const templateRoot = path.resolve(repoRoot, options.templateRoot || DEFAULT_TEMPLATE_ROOT);
  const requested = options.template || (options.section === 'works' ? 'work' : 'page');
  const templateName = EASY_TEMPLATE_FILES[requested];

  if (!templateName) {
    throw new Error(`EASY052 unknown easy template: ${requested}`);
  }

  const templatePath = path.join(templateRoot, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`EASY052 easy template not found: ${toPosix(path.relative(repoRoot, templatePath))}`);
  }

  return {
    kind: requested,
    path: templatePath,
    sourceName: templateName,
    contents: fs.readFileSync(templatePath, 'utf8'),
  };
}

export function renderEasyTemplate(template, variables = {}) {
  const section = variables.section || 'works';
  const slug = variables.slug || 'work-slug';
  const fullSlug = section === 'works' ? `works/${slug}` : `${section}/${slug}`;
  const title = variables.title || titleFromSlug(slug);
  const status = normalizeStatus(variables.status);
  const visibilityCommand = visibilityCommandForStatus(status);
  const workStatus = workStatusForStatus(status);
  const featured = normalizeBoolean(variables.featured);
  const year = Number(variables.year || new Date().getFullYear());
  const type = variables.type || 'system';
  const description = renderDescription(variables.description, variables.template);

  let output = normalizeLineEndings(template);

  output = output.replace(/^#\s+.*$/m, `# ${title}`);
  output = replaceOrAppendLine(output, /^@description\s+.*$/m, `@description ${description}`);
  output = replaceOrAppendLine(output, /^@slug\s+.*$/m, `@slug ${fullSlug}`);
  output = replaceVisibilityCommand(output, visibilityCommand);

  if (section === 'works' || /^@work\s+/m.test(output)) {
    output = replaceOrAppendLine(
      output,
      /^@work\s+.*$/m,
      `@work type=${type} status=${workStatus} year=${year} featured=${featured ? 'true' : 'false'} weight=${variables.weight || 10}`,
    );
  }

  return output.trimEnd() + '\n';
}

function placeholderSvg(title = 'Easy Markdown') {
  const safeTitle = String(title || 'Easy Markdown')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${safeTitle} placeholder">
  <rect width="1200" height="675" rx="48" fill="#f4efe6"/>
  <rect x="48" y="48" width="1104" height="579" rx="36" fill="none" stroke="#2c2a25" stroke-opacity="0.18" stroke-width="4"/>
  <text x="96" y="332" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#2c2a25">${safeTitle}</text>
  <text x="96" y="402" font-family="Arial, sans-serif" font-size="28" fill="#6d655a">Easy Markdown placeholder asset</text>
</svg>
`;
}

function placeholderText(filePath, title) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') return placeholderSvg(title);
  if (['.webm', '.mp4', '.mov'].includes(ext)) return '';
  return `Placeholder asset for ${title || 'Easy Markdown'}\nReplace this file before publishing.\n`;
}

export function createPlaceholderSvg(options = {}) {
  return placeholderSvg(options.title || 'Easy Markdown');
}

export function createScaffoldReadme(options = {}) {
  const sourceName = options.sourceName || (options.section === 'works' ? 'work.easy.md' : 'page.easy.md');

  return `# ${options.title || options.slug || 'Easy Markdown Page'}

This folder was scaffolded from Easy Markdown.

## Source

- \`${sourceName}\`

## Generated

- \`index.md\`

Do not edit \`index.md\` directly.
Run:

\`\`\`powershell
npm run easy:compile
npm run easy:check
npm run build
\`\`\`

## Assets

- \`images/\`: page-specific images
- \`videos/\`: page-specific videos
- placeholder files are safe to replace.
`;
}

function collectLocalAssetRefsFromAst(ast) {
  const refs = [];

  for (const command of ast.commands || []) {
    if (command.name === 'cover' || command.name === 'thumb') {
      const value = parseScalar(command.args);
      if (value) refs.push(value);
    }
  }

  for (const block of ast.blocks || []) {
    const parsed = parseMixedArgs(block.args, { line: block.line });

    if (block.name === 'image') {
      if (parsed.positionals[0] || parsed.values.src) refs.push(parsed.positionals[0] || parsed.values.src);
    }

    if (block.name === 'compare') {
      if (parsed.values.before) refs.push(parsed.values.before);
      if (parsed.values.after) refs.push(parsed.values.after);
    }

    if (block.name === 'video') {
      if (parsed.positionals[0] || parsed.values.src) refs.push(parsed.positionals[0] || parsed.values.src);
      if (parsed.values.poster) refs.push(parsed.values.poster);
    }

    if (block.name === 'gallery') {
      for (const rawLine of block.body || []) {
        const line = String(rawLine || '').trim();
        if (!line.startsWith('@item')) continue;
        const item = parseMixedArgs(line.replace(/^@item\s*/, '').trim(), { line: block.line });
        if (item.positionals[0]) refs.push(item.positionals[0]);
        if (item.values.thumb) refs.push(item.values.thumb);
      }
    }
  }

  return Array.from(new Set(refs.filter((ref) => /^\.\.?\//.test(String(ref || '').trim()))));
}

function writeFileGuarded(filePath, contents, options = {}) {
  if (fs.existsSync(filePath) && !options.force) {
    throw new Error(`EASY053 scaffold refused to overwrite existing source: ${toPosix(path.relative(options.repoRoot || process.cwd(), filePath))}`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function writePlaceholderAssets(pageDir, easySource, options = {}) {
  const target = {
    sourcePath: toPosix(path.relative(options.repoRoot || process.cwd(), path.join(pageDir, options.sourceName))),
    outputPath: toPosix(path.relative(options.repoRoot || process.cwd(), path.join(pageDir, 'index.md'))),
    kind: options.kind || 'work',
    dir: toPosix(path.relative(options.repoRoot || process.cwd(), pageDir)),
  };
  const ast = parseEasyMarkdown(easySource, target);
  const refs = collectLocalAssetRefsFromAst(ast);

  for (const ref of refs) {
    const assetPath = path.resolve(pageDir, ref);
    assertInsideRoot(pageDir, assetPath);
    if (fs.existsSync(assetPath)) continue;
    fs.mkdirSync(path.dirname(assetPath), { recursive: true });
    fs.writeFileSync(assetPath, placeholderText(assetPath, options.title), 'utf8');
  }
}

export function scaffoldEasyPage(options = {}) {
  const repoRoot = path.resolve(options.rootDir || process.cwd());
  const section = normalizeSection(options.section || 'works');
  const slug = normalizeScaffoldSlug(options.slug);
  const title = options.title || titleFromSlug(slug);
  const template = resolveEasyTemplate({
    repoRoot,
    templateRoot: options.templateRoot,
    template: options.template || (section === 'works' ? 'work' : 'page'),
    section,
  });
  const kind = section === 'works' ? 'work' : 'page';
  const sourceName = kind === 'work' ? 'work.easy.md' : 'page.easy.md';
  const pageDir = path.resolve(repoRoot, options.contentRoot || DEFAULT_CONTENT_ROOT, section, slug);

  assertInsideRoot(path.resolve(repoRoot, options.contentRoot || DEFAULT_CONTENT_ROOT), pageDir);

  if (fs.existsSync(pageDir) && !options.force) {
    throw new Error(`EASY050 target directory already exists: ${toPosix(path.relative(repoRoot, pageDir))}`);
  }

  const easySource = renderEasyTemplate(template.contents, {
    ...options,
    section,
    slug,
    title,
    template: template.kind,
  });

  fs.mkdirSync(path.join(pageDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(pageDir, 'videos'), { recursive: true });

  const sourcePath = path.join(pageDir, sourceName);
  const outputPath = path.join(pageDir, 'index.md');

  writeFileGuarded(sourcePath, easySource, { force: options.force, repoRoot });
  writePlaceholderAssets(pageDir, easySource, { repoRoot, sourceName, kind, title });

  const target = {
    sourcePath: toPosix(path.relative(repoRoot, sourcePath)),
    outputPath: toPosix(path.relative(repoRoot, outputPath)),
    kind,
    dir: toPosix(path.relative(repoRoot, pageDir)),
  };
  const compiled = compileEasyMarkdownSource(easySource, target);

  if (compiled.diagnostics.some((diagnostic) => diagnostic.severity !== 'warning' && diagnostic.severity !== 'info')) {
    throw new Error(`EASY054 scaffold compile failed: ${compiled.diagnostics.map((diagnostic) => diagnostic.code).join(', ')}`);
  }

  writeFileGuarded(outputPath, compiled.output, { force: options.force, repoRoot });
  writeFileGuarded(path.join(pageDir, 'README.md'), createScaffoldReadme({ title, slug, section, sourceName }), {
    force: options.force,
    repoRoot,
  });

  fs.writeFileSync(path.join(pageDir, 'images', '.gitkeep'), '', 'utf8');
  fs.writeFileSync(path.join(pageDir, 'videos', '.gitkeep'), '', 'utf8');

  return {
    pageDir: toPosix(path.relative(repoRoot, pageDir)),
    sourcePath: target.sourcePath,
    outputPath: target.outputPath,
    template: template.kind,
  };
}
