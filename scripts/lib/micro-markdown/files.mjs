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
  return normalized.split('/').some((segment) => IGNORED_DIRS.has(segment));
}

function walk(dirPath, files = []) {
  if (!fs.existsSync(dirPath) || isIgnoredDirectory(dirPath)) return files;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (entry.isFile() && (entry.name === 'work.micro.md' || entry.name === 'page.micro.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function createMicroFileSystem(rootDir = process.cwd()) {
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

export function findMicroMarkdownTargets(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const contentRoot = path.resolve(rootDir, options.contentRoot || DEFAULT_CONTENT_ROOT);

  return walk(contentRoot)
    .map((absolutePath) => {
      const relativePath = toPosix(path.relative(rootDir, absolutePath));
      const dir = toPosix(path.dirname(relativePath));
      const basename = path.basename(relativePath);
      const kind = basename === 'work.micro.md' ? 'work' : 'page';
      const easyName = kind === 'work' ? 'work.easy.md' : 'page.easy.md';

      return {
        sourcePath: relativePath,
        easyPath: `${dir}/${easyName}`,
        outputPath: `${dir}/index.md`,
        kind,
        dir,
      };
    })
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}

export function hasMicroGeneratedMarker(source) {
  return /GENERATED FROM\s+[^.]+\.micro\.md\./.test(String(source || ''));
}

export function normalizeGeneratedSource(source) {
  return String(source || '').replace(/\r\n/g, '\n').trimEnd();
}
