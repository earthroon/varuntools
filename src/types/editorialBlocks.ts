export type EditorialHeadingLevel = 'major' | 'middle' | 'minor'

export type EditorialHeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

export type EditorialHeadingAlign = 'left' | 'center'

export type EditorialHeadingBlockProps = {
  level: EditorialHeadingLevel
  as?: EditorialHeadingTag
  title: string
  kicker?: string
  subtitle?: string
  align?: EditorialHeadingAlign
}

export type EditorialColumnCount = 2 | 3

export type EditorialColumnGap = 'sm' | 'md' | 'lg'

export type EditorialColumnCollapse = 'mobile' | 'tablet' | 'never'

export type EditorialColumnsProps = {
  cols: EditorialColumnCount
  gap?: EditorialColumnGap
  collapse?: EditorialColumnCollapse
  balance?: boolean
  columns: string[]
}
