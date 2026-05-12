export const REQUIRED_TABS = [
  'pages',
  'blocks',
  'assets',
  'settings',
  'enums_block_types',
  'enums_callout_types',
]

export const OPTIONAL_TABS = [
  'guide',
  'publish_log',
  'enums_asset_modes',
  'enums_asset_roles',
]

export const REQUIRED_HEADERS = {
  pages: ['pageId', 'visible', 'status', 'type', 'slug', 'title'],
  blocks: ['pageId', 'visible', 'kind'],
  assets: ['pageId', 'assetId', 'visible', 'type'],
  settings: ['key', 'value'],
  enums_block_types: ['value', 'label', 'renderer', 'public'],
  enums_callout_types: ['value', 'label', 'componentTone', 'defaultCollapsible', 'defaultOpen', 'public'],
  guide: ['구분', '규칙'],
  publish_log: ['requestedAt', 'requestedBy', 'requestId', 'eventType', 'responseCode', 'responseBody', 'actionRunUrl', 'commitSha', 'status', 'message'],
  enums_asset_modes: ['value', 'label', 'public'],
  enums_asset_roles: ['value', 'label', 'public'],
}
