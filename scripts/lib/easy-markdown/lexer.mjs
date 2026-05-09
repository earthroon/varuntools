export function tokenizeEasyMarkdown(source) {
  const lines = String(source || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const tokens = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (!line.trim()) {
      tokens.push({ type: 'blank', line: lineNumber, raw: line });
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      tokens.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim(), line: lineNumber, raw: line });
      return;
    }

    const endMatch = line.match(/^@end\s*$/);

    if (endMatch) {
      tokens.push({ type: 'end', line: lineNumber, raw: line });
      return;
    }

    const commandMatch = line.match(/^@([A-Za-z][A-Za-z0-9:-]*)(?:\s+(.*))?$/);

    if (commandMatch) {
      tokens.push({ type: 'command', name: commandMatch[1], rawArgs: (commandMatch[2] || '').trim(), line: lineNumber, raw: line });
      return;
    }

    if (line.match(/^\s*[-*+]\s+/)) {
      tokens.push({ type: 'list', value: line, line: lineNumber, raw: line });
      return;
    }

    tokens.push({ type: 'text', value: line, line: lineNumber, raw: line });
  });

  return tokens;
}
