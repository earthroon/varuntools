import { createDiagnostic } from './diagnostics.mjs';
import { tokenizeEasyMarkdown } from './lexer.mjs';

const INLINE_COMMANDS = new Set([
  'description',
  'slug',
  'public',
  'hidden',
  'draft',
  'cover',
  'thumb',
  'work',
  'role',
  'stack',
  'tools',
  'tags',
]);

const LEAF_BLOCK_COMMANDS = new Set(['title', 'section-gap', 'section-break']);

const NESTED_BODY_COMMANDS = {
  gallery: new Set(['item']),
  columns: new Set(['col']),
};

function rawFromToken(token) {
  return token.raw ?? token.value ?? '';
}

function pushTextNode(ast, token) {
  const value = rawFromToken(token);

  if (token.type === 'blank' && !ast.nodes.length) return;

  ast.body.push(value);
  ast.nodes.push({ type: 'text', value, line: token.line });
}

function pushInlineBlock(ast, token) {
  const block = { name: token.name, args: token.rawArgs, body: [], line: token.line, inline: true };
  ast.blocks.push(block);
  ast.nodes.push({ type: 'block', block, line: block.line });
}

export function parseEasyMarkdown(source, target = {}) {
  const tokens = tokenizeEasyMarkdown(source);
  const ast = {
    title: '',
    commands: [],
    blocks: [],
    body: [],
    nodes: [],
    diagnostics: [],
    tokens,
  };

  let activeBlock = null;

  for (const token of tokens) {
    if (!ast.title && token.type === 'heading' && token.level === 1) {
      ast.title = token.text;
      continue;
    }

    if (activeBlock) {
      if (token.type === 'end') {
        ast.blocks.push(activeBlock);
        ast.nodes.push({ type: 'block', block: activeBlock, line: activeBlock.line });
        activeBlock = null;
        continue;
      }

      if (token.type === 'command') {
        const allowedNestedCommands = NESTED_BODY_COMMANDS[activeBlock.name];

        if (!allowedNestedCommands?.has(token.name)) {
          ast.diagnostics.push(
            createDiagnostic('EASY018', `Nested Easy Markdown block is not supported: @${token.name}`, {
              file: target.sourcePath,
              line: token.line,
              hint: `Close @${activeBlock.name} with @end before opening another Easy block.`,
            }),
          );
        }
      }

      activeBlock.body.push(rawFromToken(token));
      continue;
    }

    if (token.type === 'end') {
      ast.diagnostics.push(
        createDiagnostic('EASY017', '@end without an open Easy Markdown block.', {
          file: target.sourcePath,
          line: token.line,
          hint: 'Remove the stray @end or open a block before it.',
        }),
      );
      continue;
    }

    if (token.type === 'command') {
      if (token.name === 'col') {
        ast.diagnostics.push(
          createDiagnostic('EASY046', '@col must be inside an @columns block.', {
            file: target.sourcePath,
            line: token.line,
            hint: 'Open @columns before using @col.',
          }),
        );
        continue;
      }

      if (INLINE_COMMANDS.has(token.name) && !(token.name === 'tools' && !token.rawArgs)) {
        ast.commands.push({ name: token.name, args: token.rawArgs, line: token.line });
      } else if (LEAF_BLOCK_COMMANDS.has(token.name)) {
        pushInlineBlock(ast, token);
      } else {
        activeBlock = { name: token.name, args: token.rawArgs, body: [], line: token.line };
      }
      continue;
    }

    if (token.type === 'blank' || token.type === 'text' || token.type === 'list' || token.type === 'heading') {
      pushTextNode(ast, token);
    }
  }

  if (activeBlock) {
    const block = { ...activeBlock, unclosed: true };
    ast.blocks.push(block);
    ast.nodes.push({ type: 'block', block, line: block.line });
  }

  while (ast.nodes.length && ast.nodes[ast.nodes.length - 1].type === 'text' && !ast.nodes[ast.nodes.length - 1].value.trim()) {
    ast.nodes.pop();
  }

  return ast;
}
