import fs from 'node:fs';
import path from 'node:path';

import { compileEasyMarkdownSource } from '../easy-markdown/compiler.mjs';
import { compileMicroToEasy } from './compiler.mjs';

const DEFAULT_CONTENT_ROOT = path.join('src', 'content', 'pages');

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

function normalizeBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return Boolean(value);
}

function normalizeStatus(value) {
  const status = String(value || 'draft').trim().toLowerCase();
  if (!['published', 'draft', 'private'].includes(status)) {
    throw new Error(`MICRO scaffold ERROR: --status must be one of published, draft, private. Received: ${value}`);
  }
  return status;
}

function visibilityCommandForStatus(status) {
  if (status === 'published') return '@PUBLIC';
  if (status === 'private') return '@HIDDEN';
  return '@DRAFT';
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
    throw new Error(`MICRO scaffold ERROR: refused to write outside root: ${targetPath}`);
  }
}

export function normalizeMicroScaffoldSlug(value) {
  const raw = String(value || '').trim();
  const normalized = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!normalized || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(`MICRO082 invalid scaffold slug: ${value}`);
  }

  return normalized;
}

function normalizeSection(value) {
  const section = normalizeMicroScaffoldSlug(value);
  if (section.includes('..') || section.includes('/') || section.includes('\\')) {
    throw new Error(`MICRO scaffold ERROR: invalid section: ${value}`);
  }
  return section;
}

function escapeMicroText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function renderDescription(description, templateKind) {
  if (description) return description;
  if (templateKind === 'case-study') return '문제 정의부터 결과까지 보여주는 케이스스터디입니다.';
  if (templateKind === 'work') return '이 작업을 한 문장으로 설명합니다.';
  return '이 페이지를 설명하는 한 문장입니다.';
}

function renderMicroWorkTemplate(variables) {
  const status = normalizeStatus(variables.status);
  const visibility = visibilityCommandForStatus(status);
  const workStatus = workStatusForStatus(status);
  const featured = normalizeBoolean(variables.featured);
  const year = Number(variables.year || new Date().getFullYear());
  const type = variables.type || 'system';
  const description = renderDescription(variables.description, variables.template);

  return `@H1_${variables.title}
@DESC_${description}
@SLUG_works/${variables.slug}
${visibility}
@COVER=./cover.svg
@THUMB=./thumb.svg
@WORK_type=${type},status=${workStatus},year=${year},featured=${featured ? 'true' : 'false'},weight=${variables.weight || 10}
@ROLE_Designer, Developer
@STACK_Vue3, Vite, TypeScript
@TOOLS_GitHub Actions, Markdown-it
@TAG_portfolio, cms, markdown

@SUM_
이 작업의 핵심 요약을 작성합니다.

@SSOT_작성 기준|collapse=true
이 문서의 원본은 \`work.micro.md\`입니다.
\`work.easy.md\`와 \`index.md\`는 생성물입니다.

@PROB_
이 작업이 해결하려던 문제를 작성합니다.

@SOL_
문제를 어떤 방식으로 해결했는지 작성합니다.

@BA=./images/before.svg|./images/after.svg|50|전후 비교

@DEMO=sample-canvas|Sample Canvas|autoResize=true,minHeight=360,maxHeight=960

@RES_
결과와 배운 점을 작성합니다.
`;
}

function renderMicroCaseStudyTemplate(variables) {
  const base = renderMicroWorkTemplate({ ...variables, template: 'case-study' });
  return `${base.trimEnd()}

@DEC_
이 작업에서 선택한 기준과 포기한 선택지를 작성합니다.

@PROC_
작업 과정과 시행착오를 작성합니다.

@DANGER_실패 가능성
실제 손실이나 실패 가능성이 있는 상태를 강조할 때 사용합니다.

@DECBOX_선택 기준
이 작업에서 구조적으로 선택한 기준을 짧게 정리합니다.
`;
}

function renderMicroPageTemplate(variables) {
  const status = normalizeStatus(variables.status);
  const visibility = visibilityCommandForStatus(status);
  const description = renderDescription(variables.description, variables.template);
  const fullSlug = `${variables.section}/${variables.slug}`;

  return `@H1_${variables.title}
@DESC_${description}
@SLUG_${fullSlug}
${visibility}
@COVER=./cover.svg

@SUM_
이 페이지의 목적을 작성합니다.

@TITLE_첫 번째 섹션|kicker=GUIDE,subtitle=문서의 구조를 먼저 잡습니다.

@SSOT_작성 기준|collapse=true
이 문서의 원본은 \`page.micro.md\`입니다.
\`page.easy.md\`와 \`index.md\`는 생성물입니다.

@NOTE_참고
이 문법은 기존 directive를 쉽게 쓰기 위한 속기 래퍼입니다.

@COLS_2|gap=md,collapse=mobile
@COL_왼쪽
왼쪽 칼럼 내용입니다.

@COL_오른쪽
오른쪽 칼럼 내용입니다.
`;
}

export function renderMicroTemplate(options = {}) {
  const template = options.template || (options.section === 'works' ? 'work' : 'page');
  if (template === 'work') return renderMicroWorkTemplate(options);
  if (template === 'case-study') return renderMicroCaseStudyTemplate(options);
  if (template === 'page') return renderMicroPageTemplate(options);
  throw new Error(`MICRO083 unknown micro template: ${template}`);
}

function placeholderSvg(title = 'Micro Markdown') {
  const safeTitle = String(title || 'Micro Markdown')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${safeTitle} placeholder">
  <rect width="1200" height="675" rx="48" fill="#f4efe6"/>
  <rect x="48" y="48" width="1104" height="579" rx="36" fill="none" stroke="#2c2a25" stroke-opacity="0.18" stroke-width="4"/>
  <text x="96" y="332" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#2c2a25">${safeTitle}</text>
  <text x="96" y="402" font-family="Arial, sans-serif" font-size="28" fill="#6d655a">Micro Markdown placeholder asset</text>
</svg>
`;
}

function writeFileGuarded(filePath, contents, options = {}) {
  if (fs.existsSync(filePath) && !options.force) {
    throw new Error(`MICRO081 micro scaffold refused to overwrite existing file: ${toPosix(path.relative(options.repoRoot || process.cwd(), filePath))}`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function writePlaceholderFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, contents, 'utf8');
}

function createMicroScaffoldReadme(options = {}) {
  const microName = options.sourceName || (options.section === 'works' ? 'work.micro.md' : 'page.micro.md');
  const easyName = microName.replace('.micro.md', '.easy.md');

  return `# ${options.title || options.slug || 'Micro Markdown Page'}

This folder was scaffolded from Micro Markdown.

## Source SSOT

- \`${microName}\`

## Generated

- \`${easyName}\`
- \`index.md\`

Do not edit generated files directly.
Run:

\`\`\`powershell
npm run micro:compile
npm run micro:check
npm run build
\`\`\`

## Assets

- \`images/\`: page-specific images
- \`videos/\`: page-specific videos
- placeholder files are safe to replace.
`;
}

function createMicroTarget(repoRoot, sourcePath, kind) {
  const relativeSource = toPosix(path.relative(repoRoot, sourcePath));
  const dir = toPosix(path.dirname(relativeSource));
  const easyName = kind === 'work' ? 'work.easy.md' : 'page.easy.md';

  return {
    sourcePath: relativeSource,
    easyPath: `${dir}/${easyName}`,
    outputPath: `${dir}/index.md`,
    kind,
    dir,
  };
}

function assertNoBlockingDiagnostics(diagnostics, label) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity !== 'warning' && diagnostic.severity !== 'info');
  if (errors.length) {
    throw new Error(`${label}: ${errors.map((diagnostic) => diagnostic.code).join(', ')}`);
  }
}

export function scaffoldMicroPage(options = {}) {
  const repoRoot = path.resolve(options.rootDir || process.cwd());
  const contentRoot = path.resolve(repoRoot, options.contentRoot || DEFAULT_CONTENT_ROOT);
  const section = normalizeSection(options.section || 'works');
  const slug = normalizeMicroScaffoldSlug(options.slug);
  const kind = section === 'works' ? 'work' : 'page';
  const sourceName = kind === 'work' ? 'work.micro.md' : 'page.micro.md';
  const easyName = kind === 'work' ? 'work.easy.md' : 'page.easy.md';
  const title = escapeMicroText(options.title || titleFromSlug(slug));
  const template = options.template || (section === 'works' ? 'work' : 'page');
  const pageDir = path.resolve(contentRoot, section, slug);

  assertInsideRoot(contentRoot, pageDir);

  if (fs.existsSync(pageDir) && !options.force) {
    throw new Error(`MICRO080 target directory already exists: ${toPosix(path.relative(repoRoot, pageDir))}`);
  }

  const microSource = renderMicroTemplate({
    ...options,
    section,
    slug,
    title,
    template,
  });

  fs.mkdirSync(path.join(pageDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(pageDir, 'videos'), { recursive: true });

  const sourcePath = path.join(pageDir, sourceName);
  const easyPath = path.join(pageDir, easyName);
  const outputPath = path.join(pageDir, 'index.md');

  writeFileGuarded(sourcePath, microSource, { force: options.force, repoRoot });

  const target = createMicroTarget(repoRoot, sourcePath, kind);
  const microCompiled = compileMicroToEasy(microSource, target);
  assertNoBlockingDiagnostics(microCompiled.diagnostics, 'MICRO084 scaffold compile failed');

  writeFileGuarded(easyPath, microCompiled.easySource, { force: options.force, repoRoot });

  const easyTarget = {
    sourcePath: target.easyPath,
    outputPath: target.outputPath,
    kind,
    dir: target.dir,
  };
  const easyCompiled = compileEasyMarkdownSource(microCompiled.easySource, easyTarget);
  assertNoBlockingDiagnostics(easyCompiled.diagnostics, 'MICRO084 scaffold Easy compile failed');

  writeFileGuarded(outputPath, easyCompiled.output, { force: options.force, repoRoot });
  writeFileGuarded(path.join(pageDir, 'README.md'), createMicroScaffoldReadme({ title, slug, section, sourceName }), {
    force: options.force,
    repoRoot,
  });

  writePlaceholderFile(path.join(pageDir, 'cover.svg'), placeholderSvg(title));
  if (kind === 'work') writePlaceholderFile(path.join(pageDir, 'thumb.svg'), placeholderSvg(`${title} thumbnail`));
  if (kind === 'work') {
    writePlaceholderFile(path.join(pageDir, 'images', 'before.svg'), placeholderSvg(`${title} before`));
    writePlaceholderFile(path.join(pageDir, 'images', 'after.svg'), placeholderSvg(`${title} after`));
  }
  writePlaceholderFile(path.join(pageDir, 'images', '.gitkeep'), '');
  writePlaceholderFile(path.join(pageDir, 'videos', '.gitkeep'), '');

  return {
    pageDir: toPosix(path.relative(repoRoot, pageDir)),
    sourcePath: target.sourcePath,
    easyPath: target.easyPath,
    outputPath: target.outputPath,
    template,
  };
}
