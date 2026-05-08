export function slugifyHeading(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'section'
}

export function createUniqueHeadingId(
  text: string,
  usedIds: Map<string, number>,
): string {
  const base = slugifyHeading(text)
  const count = usedIds.get(base) || 0

  usedIds.set(base, count + 1)

  if (count === 0) return base
  return `${base}-${count + 1}`
}
