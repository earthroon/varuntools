export const REQUIRED_TABS = [
  'pages',
  'blocks',
  'assets',
  'settings',
  'enums_block_types',
  'enums_callout_types',
  'guide',
  'publish_log',
]

export const DEFAULT_TAB_RANGE = 'A:ZZ'

export const REQUIRED_HEADERS = {
  pages: ['pageId', 'visible', 'status', 'type', 'slug', 'title'],
  blocks: ['pageId', 'visible', 'kind'],
  assets: ['assetId', 'visible', 'driveFileId', 'type'],
  settings: ['key', 'value'],
  enums_block_types: ['value', 'label', 'renderer', 'public'],
  enums_callout_types: [
    'value',
    'label',
    'componentTone',
    'defaultCollapsible',
    'defaultOpen',
    'public',
  ],
  guide: ['구분', '규칙'],
  publish_log: ['requestedAt', 'status'],
}

export function getRangeForTab(tabName) {
  return `${tabName}!${DEFAULT_TAB_RANGE}`
}

export function getRequiredHeaders(tabName) {
  return REQUIRED_HEADERS[tabName] ?? []
}
