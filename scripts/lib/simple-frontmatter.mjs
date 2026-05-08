export function parseFrontmatter(raw) {
  if (typeof raw !== 'string') {
    return { data: {}, content: '' }
  }

  const text = raw.replace(/^\uFEFF/, '')

  if (!text.startsWith('---')) {
    return { data: {}, content: text }
  }

  const end = text.indexOf('\n---', 3)
  if (end === -1) {
    return { data: {}, content: text }
  }

  const frontmatter = text.slice(3, end).replace(/^\r?\n/, '')
  const content = text.slice(end).replace(/^\n---\r?\n?/, '').replace(/^\r?\n/, '')
  const data = parseSimpleYaml(frontmatter)

  return { data, content }
}

export default parseFrontmatter

function parseSimpleYaml(input) {
  const root = {}
  const lines = input.split(/\r?\n/)
  const stack = [{ indent: -1, value: root }]

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i]
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue

    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0
    const line = rawLine.trim()

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].value

    if (line.startsWith('- ')) {
      if (!Array.isArray(parent)) continue
      parent.push(parseValue(line.slice(2).trim()))
      continue
    }

    const match = line.match(/^([^:]+):(.*)$/)
    if (!match) continue

    const key = match[1].trim()
    const rest = match[2].trim()

    if (rest === '') {
      const next = findNextMeaningfulLine(lines, i + 1)
      const child = next?.trim().startsWith('- ') ? [] : {}
      parent[key] = child
      stack.push({ indent, value: child })
      continue
    }

    parent[key] = parseValue(rest)
  }

  return root
}

function findNextMeaningfulLine(lines, start) {
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() && !line.trim().startsWith('#')) return line
  }
  return null
}

function parseValue(value) {
  const trimmed = value.trim()

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed === '[]') return []
  if (trimmed === '{}') return {}

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => parseValue(item.trim()))
      .filter((item) => item !== '')
  }

  return trimmed
}

