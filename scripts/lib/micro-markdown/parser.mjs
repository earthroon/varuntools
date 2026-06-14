import { createMicroDiagnostic } from './diagnostics.mjs';
import { MICRO_BLOCK_COMMANDS, MICRO_COMMANDS, MICRO_INLINE_COMMANDS } from './shorthands.mjs';
import { tokenizeMicroMarkdown } from './lexer.mjs';

function closeBlock(ast, activeBlock) {
  if (!activeBlock) return null;
  ast.nodes.push({ type: 'block', block: activeBlock, line: activeBlock.line });
  return null;
}

export function parseMicroMarkdown(source, target = {}) {
  const tokens = tokenizeMicroMarkdown(source);
  const ast = {
    nodes: [],
    diagnostics: [],
  };
  let activeBlock = null;

  for (const token of tokens) {
    if (token.type === 'command') {
      if (!MICRO_COMMANDS.has(token.name)) {
        ast.diagnostics.push(createMicroDiagnostic('MICRO003', `Unknown Micro Markdown command: @${token.name}`, {
          file: target.sourcePath,
          line: token.line,
          hint: 'Use a registered uppercase Micro command such as @H1_, @DESC_, @SUM_, @IMG=, @BA=, @V=, or @WARN_.',
        }));
        if (activeBlock) activeBlock.body.push(token.raw);
        continue;
      }

      if (token.name === 'ITEM') {
        if (activeBlock?.name === 'GAL') {
          activeBlock.body.push(token.raw);
        } else {
          ast.diagnostics.push(createMicroDiagnostic('MICRO050', '@ITEM= can only be used inside @GAL_.', {
            file: target.sourcePath,
            line: token.line,
            hint: 'Start a gallery with @GAL_ before adding @ITEM= entries.',
          }));
        }
        continue;
      }

      if (token.name === 'COL') {
        if (activeBlock?.name === 'COLS') {
          activeBlock.body.push(token.raw);
        } else {
          ast.diagnostics.push(createMicroDiagnostic('MICRO062', '@COL_ can only be used inside @COLS_.', {
            file: target.sourcePath,
            line: token.line,
            hint: 'Start columns with @COLS_ before adding @COL_ sections.',
          }));
        }
        continue;
      }

      activeBlock = closeBlock(ast, activeBlock);

      if (MICRO_INLINE_COMMANDS.has(token.name)) {
        ast.nodes.push({ type: 'inline', command: token, line: token.line });
        continue;
      }

      if (MICRO_BLOCK_COMMANDS.has(token.name)) {
        activeBlock = {
          name: token.name,
          separator: token.separator,
          payload: token.payload,
          body: [],
          line: token.line,
        };
        continue;
      }
    }

    if (activeBlock) {
      activeBlock.body.push(token.value ?? '');
    } else {
      ast.nodes.push({ type: 'text', value: token.value ?? '', line: token.line });
    }
  }

  closeBlock(ast, activeBlock);

  while (ast.nodes.length && ast.nodes[ast.nodes.length - 1].type === 'text' && !String(ast.nodes[ast.nodes.length - 1].value || '').trim()) {
    ast.nodes.pop();
  }

  return ast;
}
