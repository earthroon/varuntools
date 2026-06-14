import { MICRO_COMMANDS } from './shorthands.mjs';

const COMMANDS_BY_LENGTH = [...MICRO_COMMANDS].sort((a, b) => b.length - a.length);

function parseMicroCommand(rawLine) {
  if (!rawLine.startsWith('@')) return null;
  const rest = rawLine.slice(1);

  for (const name of COMMANDS_BY_LENGTH) {
    if (rest === name) return { name, separator: '', payload: '' };
    if (rest.startsWith(`${name}_`)) return { name, separator: '_', payload: rest.slice(name.length + 1) };
    if (rest.startsWith(`${name}=`)) return { name, separator: '=', payload: rest.slice(name.length + 1) };
  }

  const unknown = rest.match(/^([A-Z][A-Z0-9_]*)([_=]?)(.*)$/);
  if (!unknown) return null;
  const [, name, separator, payload] = unknown;
  return { name, separator, payload };
}

export function tokenizeMicroMarkdown(source) {
  return String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((rawLine, index) => {
      const line = index + 1;

      if (rawLine.startsWith('\\@')) {
        return { type: 'text', value: rawLine.slice(1), line };
      }

      const parsed = parseMicroCommand(rawLine);
      if (parsed) {
        return {
          type: 'command',
          ...parsed,
          payload: String(parsed.payload || '').trim(),
          raw: rawLine,
          line,
        };
      }

      return { type: rawLine.trim() ? 'text' : 'blank', value: rawLine, line };
    });
}
