import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CONTENT_ROOT = path.join('src', 'content', 'pages');
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist']);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function isIgnoredDirectory(dirPath) {
  const normalized = toPosix(dirPath);

  if (normalized.includes('/src/content/templates')) return true;

  return normalized
    .split('/')
    .some((segment) => IGNORED_DIRS.has(segment));
}

function walk(dirPath, files = []) {
  if (!fs.existsSync(dirPath) || isIgnoredDirectory(dirPath)) return files;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && (entry.name === 'work.easy.md' || entry.name === 'page.easy.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function walkMarkdownLike(dirPath, files = []) {
  if (!fs.existsSync(dirPath) || isIgnoredDirectory(dirPath)) return files;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkMarkdownLike(fullPath, files);
      continue;
    }

    if (entry.isFile() && ['index.md', 'work.easy.md', 'page.easy.md'].includes(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function addSlugAliases(set, slug) {
  const normalized = String(slug || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalized) return;

  set.add(normalized);

  if (normalized.startsWith('works/')) {
    const shortSlug = normalized.slice('works/'.length);
    if (shortSlug) set.add(shortSlug);
  }
}

function inferSlugFromRelativePath(relativePath) {
  const normalized = toPosix(relativePath).replace(/^src\/content\/pages\//, '');
  const dir = path.posix.dirname(normalized);
  if (dir === '.' || !dir) return '';
  return dir;
}

function readFrontmatterSlug(source) {
  const match = String(source || '').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return '';

  const slugMatch = match[1].match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
  return slugMatch ? slugMatch[1].trim() : '';
}

function readEasySlug(source) {
  const slugMatch = String(source || '').match(/^@slug\s+(.+)$/m);
  return slugMatch ? slugMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

export function createFileSystem(rootDir = process.cwd()) {
  return {
    rootDir,
    exists(filePath) {
      return fs.existsSync(path.resolve(rootDir, filePath));
    },
    readFile(filePath) {
      return fs.readFileSync(path.resolve(rootDir, filePath), 'utf8');
    },
    writeFile(filePath, contents) {
      const absolutePath = path.resolve(rootDir, filePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, contents, 'utf8');
    },
  };
}

export function findEasyMarkdownTargets(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const contentRoot = path.resolve(rootDir, options.contentRoot || DEFAULT_CONTENT_ROOT);

  return walk(contentRoot)
    .map((absolutePath) => {
      const relativePath = toPosix(path.relative(rootDir, absolutePath));
      const dir = toPosix(path.dirname(relativePath));
      const basename = path.basename(relativePath);
      const kind = basename === 'work.easy.md' ? 'work' : 'page';

      return {
        sourcePath: relativePath,
        outputPath: `${dir}/index.md`,
        kind,
        dir,
      };
    })
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}

export function isExternalReference(value) {
  const ref = String(value || '').trim();
  if (!ref) return true;

  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
}

export function isLocalAssetReference(value) {
  const ref = String(value || '').trim();
  if (!ref || isExternalReference(ref)) return false;

  return ref.startsWith('./') || ref.startsWith('../');
}

export function resolveLocalAssetPath(sourceFile, value) {
  const ref = String(value || '').trim();
  if (!isLocalAssetReference(ref)) return '';

  return path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), ref));
}

export function collectContentSlugs(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const contentRoot = path.resolve(rootDir, options.contentRoot || DEFAULT_CONTENT_ROOT);
  const slugs = new Set();

  for (const absolutePath of walkMarkdownLike(contentRoot)) {
    const relativePath = toPosix(path.relative(rootDir, absolutePath));
    const source = fs.readFileSync(absolutePath, 'utf8');
    const inferred = inferSlugFromRelativePath(relativePath);
    const declared = relativePath.endsWith('.easy.md') ? readEasySlug(source) : readFrontmatterSlug(source);

    addSlugAliases(slugs, declared || inferred);
    addSlugAliases(slugs, inferred);
  }

  return slugs;
}
