export type AdjacentWorks<T> = {
  previous: T | null
  next: T | null
}

export type OrderAddressableWork = {
  slug: string
  order: number
  title?: string
}

export function getAdjacentWorks<T extends OrderAddressableWork>(
  works: T[],
  currentSlug: string,
): AdjacentWorks<T> {
  const sorted = [...works].sort(
    (a, b) => a.order - b.order || String(a.title || '').localeCompare(String(b.title || '')),
  )
  const currentIndex = sorted.findIndex((work) => work.slug === currentSlug)

  if (currentIndex < 0) {
    return {
      previous: null,
      next: null,
    }
  }

  return {
    previous: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
  }
}
