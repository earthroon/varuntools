export function createMicroDiagnostic(code, message, detail = {}) {
  return {
    code,
    message,
    severity: detail.severity || 'error',
    file: detail.file || null,
    line: detail.line || null,
    hint: detail.hint || null,
  };
}

export function hasMicroErrors(diagnostics) {
  return diagnostics.some((diagnostic) => diagnostic.severity !== 'warning' && diagnostic.severity !== 'info');
}

export function splitMicroDiagnosticsBySeverity(diagnostics) {
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

export function formatMicroDiagnostic(diagnostic) {
  const location = [diagnostic.file, diagnostic.line ? `L${diagnostic.line}` : null]
    .filter(Boolean)
    .join(':');
  const prefix = location ? `${location}: ` : '';
  const hint = diagnostic.hint ? `\n  hint: ${diagnostic.hint}` : '';

  return `${prefix}${diagnostic.code} ${String(diagnostic.severity || 'error').toUpperCase()}: ${diagnostic.message}${hint}`;
}

export function printMicroDiagnostics(diagnostics) {
  for (const diagnostic of diagnostics) {
    const output = formatMicroDiagnostic(diagnostic);
    if (diagnostic.severity === 'warning' || diagnostic.severity === 'info') {
      console.warn(output);
    } else {
      console.error(output);
    }
  }
}
