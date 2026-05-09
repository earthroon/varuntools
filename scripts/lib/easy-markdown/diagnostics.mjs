export function createDiagnostic(code, message, detail = {}) {
  return {
    code,
    message,
    severity: detail.severity || 'error',
    file: detail.file || null,
    line: detail.line || null,
    hint: detail.hint || null,
  };
}

export function hasErrors(diagnostics) {
  return diagnostics.some((diagnostic) => diagnostic.severity !== 'warning' && diagnostic.severity !== 'info');
}

export function splitDiagnosticsBySeverity(diagnostics) {
  return diagnostics.reduce(
    (groups, diagnostic) => {
      const severity = diagnostic.severity || 'error';
      groups[severity] = groups[severity] || [];
      groups[severity].push(diagnostic);
      return groups;
    },
    { error: [], warning: [], info: [] },
  );
}

export function formatDiagnostic(diagnostic) {
  const location = [diagnostic.file, diagnostic.line ? `L${diagnostic.line}` : null]
    .filter(Boolean)
    .join(':');
  const prefix = location ? `${location}: ` : '';
  const hint = diagnostic.hint ? `\n  hint: ${diagnostic.hint}` : '';

  return `${prefix}${diagnostic.code} ${String(diagnostic.severity || 'error').toUpperCase()}: ${diagnostic.message}${hint}`;
}

export function formatDiagnostics(diagnostics) {
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)).join('\n');
}

export function printDiagnostics(diagnostics) {
  for (const diagnostic of diagnostics) {
    const output = formatDiagnostic(diagnostic);

    if (diagnostic.severity === 'warning' || diagnostic.severity === 'info') {
      console.warn(output);
    } else {
      console.error(output);
    }
  }
}

export function assertNoErrors(diagnostics) {
  if (hasErrors(diagnostics)) {
    printDiagnostics(diagnostics);
    process.exitCode = 1;
    return false;
  }

  if (diagnostics.length) {
    printDiagnostics(diagnostics);
  }

  return true;
}

function hasGeneratedMarker(source) {
  return /GENERATED FROM\s+[^.]+\.easy\.md\./.test(String(source || ''));
}

export function checkEasyMarkdownSurface(targets, options = {}) {
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
      diagnostics.push(
        createDiagnostic(
          'EASY011',
          'work.easy.md and page.easy.md cannot exist in the same folder.',
          { file: dir, hint: 'Choose one Easy Markdown SSOT for this page folder.' },
        ),
      );
    }

    if (hasCsv && (hasWork || hasPage)) {
      diagnostics.push(
        createDiagnostic('EASY006', 'page.csv and Easy Markdown cannot coexist.', {
          file: dir,
          hint: 'CSV-authored pages use page.csv as SSOT. Easy-authored pages use *.easy.md as SSOT.',
        }),
      );
    }
  }

  if (!options.force) {
    for (const target of targets) {
      if (options.exists(target.outputPath)) {
        const existing = options.readFile(target.outputPath);

        if (!hasGeneratedMarker(existing)) {
          diagnostics.push(
            createDiagnostic('EASY010', 'Refusing to overwrite or check a non-generated index.md.', {
              file: target.outputPath,
              hint: 'Use --force only when you intentionally migrate this page to Easy Markdown.',
            }),
          );
        }
      }
    }
  }

  return diagnostics;
}
