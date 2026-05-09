import { createDiagnostic } from './diagnostics.mjs';

function unquote(value) {
  const trimmed = String(value || '').trim();

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function coerceValue(rawValue) {
  const value = unquote(rawValue);

  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  if (/^-?\d+$/.test(value) && !/^0\d+$/.test(value)) return Number(value);

  return value;
}

export function parseKeyValueArgs(args, context = {}) {
  const diagnostics = [];
  const result = {};
  const source = String(args || '').trim();
  const pattern = /([A-Za-z][A-Za-z0-9_-]*)=("[^"]*"|'[^']*'|[^\s]+)/g;
  let consumed = '';
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const [, key, value] = match;
    result[key] = coerceValue(value);
    consumed += match[0];
  }

  const normalizedConsumed = consumed.replace(/\s+/g, '');
  const normalizedSource = source.replace(/\s+/g, '');

  if (source && normalizedConsumed !== normalizedSource) {
    diagnostics.push(
      createDiagnostic('EASY012', `Invalid key-value argument: ${source}`, {
        file: context.file,
        line: context.line,
        hint: 'Use key=value pairs. Quote values that contain spaces.',
      }),
    );
  }

  return { values: result, diagnostics };
}

export function parseCommaList(args) {
  return String(args || '')
    .split(',')
    .map((item) => unquote(item))
    .filter(Boolean);
}

export function parseScalar(args) {
  return unquote(args);
}

export function isBoolean(value) {
  return typeof value === 'boolean';
}


function tokenizeLooseArgs(args) {
  const source = String(args || '').trim();
  if (!source) return [];

  return source.match(/"[^"]*"|'[^']*'|\S+/g) || [];
}

export function parseMixedArgs(args, context = {}) {
  const diagnostics = [];
  const values = {};
  const keyValueRanges = [];
  const source = String(args || '').trim();
  const pattern = /([A-Za-z][A-Za-z0-9_-]*)=("[^"]*"|'[^']*'|[^\s]+)/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const [, key, value] = match;
    values[key] = coerceValue(value);
    keyValueRanges.push([match.index, match.index + match[0].length]);
  }

  let positionalSource = '';
  let cursor = 0;

  for (const [start, end] of keyValueRanges) {
    positionalSource += `${source.slice(cursor, start)} `;
    cursor = end;
  }

  positionalSource += source.slice(cursor);

  const positionals = tokenizeLooseArgs(positionalSource)
    .map((token) => unquote(token))
    .filter(Boolean);

  return { values, positionals, diagnostics };
}
