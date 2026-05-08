export const VALID_LAYOUTS = new Set(['default', 'wide', 'tool'])
export const VALID_THEMES = new Set(['default', 'showroom'])
export const VALID_KINDS = new Set(['page', 'work', 'tool', 'lab', 'doc'])
export const VALID_STATUSES = new Set(['draft', 'active', 'archived'])
export const VALID_VISIBILITIES = new Set(['public', 'hidden'])
export const VALID_ROBOTS = new Set(['index,follow', 'noindex,nofollow', 'noindex,follow'])
export const RESERVED_SLUGS = new Set(['works', '404'])
export const ASSET_FIELDS = ['cover', 'cardCover', 'cardIcon', 'ogImage'] as const
