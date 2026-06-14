import { parseMixedArgs, parseScalar } from './args.mjs';
import { createDiagnostic } from './diagnostics.mjs';
import { isLocalAssetReference, resolveLocalAssetPath } from './files.mjs';

function addAssetDiagnostic(diagnostics, target, reference, line, exists) {
  const value = String(reference || '').trim();
  if (!isLocalAssetReference(value)) return;

  const resolved = resolveLocalAssetPath(target.sourcePath, value);
  if (!resolved || exists(resolved)) return;

  diagnostics.push(createDiagnostic('EASY008', `Missing asset: ${value}`, {
    file: target.sourcePath,
    line,
    hint: `Expected file at ${resolved}.`,
  }));
}

function normalizeRelatedSlug(value) {
  const slug = String(value || '').trim().replace(/^[-*+]\s+/, '').replace(/^\/+|\/+$/g, '');
  if (!slug) return '';
  if (slug.startsWith('works/')) return slug.slice('works/'.length);
  return slug;
}

function hasKnownSlug(slugs, value) {
  const raw = String(value || '').trim().replace(/^[-*+]\s+/, '').replace(/^\/+|\/+$/g, '');
  const shortSlug = normalizeRelatedSlug(raw);

  return slugs.has(raw) || slugs.has(shortSlug) || slugs.has(`works/${shortSlug}`);
}

function inspectCommandReferences(command, target, diagnostics, options) {
  if (command.name === 'cover' || command.name === 'thumb') {
    addAssetDiagnostic(diagnostics, target, parseScalar(command.args), command.line, options.exists);
  }
}

function splitGalleryItems(body) {
  return (body || [])
    .map((rawLine) => String(rawLine || '').trim())
    .filter((line) => line.startsWith('@item'))
    .map((line) => line.replace(/^@item\s*/, '').trim());
}

function inspectBlockReferences(block, target, diagnostics, options) {
  if (block.name === 'image') {
    const parsed = parseMixedArgs(block.args, { file: target.sourcePath, line: block.line });
    const [src] = parsed.positionals;
    addAssetDiagnostic(diagnostics, target, src || parsed.values.src, block.line, options.exists);
    return;
  }

  if (block.name === 'compare') {
    const parsed = parseMixedArgs(block.args, { file: target.sourcePath, line: block.line });
    addAssetDiagnostic(diagnostics, target, parsed.values.before, block.line, options.exists);
    addAssetDiagnostic(diagnostics, target, parsed.values.after, block.line, options.exists);
    return;
  }

  if (block.name === 'video') {
    const parsed = parseMixedArgs(block.args, { file: target.sourcePath, line: block.line });
    const [src] = parsed.positionals;
    addAssetDiagnostic(diagnostics, target, src || parsed.values.src, block.line, options.exists);
    addAssetDiagnostic(diagnostics, target, parsed.values.poster, block.line, options.exists);
    return;
  }


  if (block.name === 'demo') {
    const parsed = parseMixedArgs(block.args, { file: target.sourcePath, line: block.line });
    const demoSrc = String(parsed.values.src || '').trim();

    if (demoSrc && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(demoSrc)) {
      const normalized = demoSrc.replace(/^\/+/, '');
      const publicPath = normalized.startsWith('public/') ? normalized : `public/${normalized}`;

      if (!options.exists(publicPath)) {
        diagnostics.push(createDiagnostic('EASY064', `Missing demo entry file: ${demoSrc}`, {
          file: target.sourcePath,
          line: block.line,
          hint: `Expected file at ${publicPath}.`,
        }));
      }
    }
    return;
  }

  if (block.name === 'gallery') {
    for (const itemArgs of splitGalleryItems(block.body)) {
      const parsed = parseMixedArgs(itemArgs, { file: target.sourcePath, line: block.line });
      const [src] = parsed.positionals;
      addAssetDiagnostic(diagnostics, target, src, block.line, options.exists);
      addAssetDiagnostic(diagnostics, target, parsed.values.thumb, block.line, options.exists);
    }
    return;
  }

  if (block.name === 'related') {
    const relatedItems = (block.body || [])
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*+]\s+/, '').trim())
      .filter(Boolean);

    for (const item of relatedItems) {
      if (!hasKnownSlug(options.contentSlugs || new Set(), item)) {
        diagnostics.push(createDiagnostic('EASY009', `Unknown related work slug: ${item}`, {
          file: target.sourcePath,
          line: block.line,
          hint: 'Create the related work page or fix the slug.',
        }));
      }
    }
  }
}

export function validateEasyMarkdownReferences(ast, target, options = {}) {
  const diagnostics = [];
  const exists = options.exists || (() => false);
  const contentSlugs = options.contentSlugs || new Set();

  for (const command of ast.commands || []) {
    inspectCommandReferences(command, target, diagnostics, { exists, contentSlugs });
  }

  for (const block of ast.blocks || []) {
    inspectBlockReferences(block, target, diagnostics, { exists, contentSlugs });
  }

  return diagnostics;
}
