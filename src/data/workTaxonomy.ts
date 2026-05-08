import type { WorkCategory, WorkRole, WorkStack, WorkTaxonomyOption } from '@/types/workTaxonomy'

export const workCategoryOptions: WorkTaxonomyOption<WorkCategory>[] = [
  { value: 'design', label: 'Design', description: '시각/브랜드/인터페이스 판단이 중심인 작업' },
  { value: 'tool', label: 'Tool', description: '사용자가 직접 조작하는 도구형 작업' },
  { value: 'system', label: 'System', description: '상태, 데이터, 운영 흐름을 묶는 시스템 작업' },
  { value: 'writing', label: 'Writing', description: '문장, 세계관, 편집 구조가 중심인 작업' },
  { value: 'commerce', label: 'Commerce', description: '상품, 결제, 카탈로그, 운영 흐름과 연결된 작업' },
  { value: 'experiment', label: 'Experiment', description: '검증/실험/QA 성격이 강한 작업' },
]

export const workRoleOptions: WorkTaxonomyOption<WorkRole>[] = [
  { value: 'designer', label: 'Designer' },
  { value: 'developer', label: 'Developer' },
  { value: 'system-architect', label: 'System Architect' },
  { value: 'writer', label: 'Writer' },
  { value: 'editor', label: 'Editor' },
  { value: 'automation-planner', label: 'Automation Planner' },
]

export const workStackOptions: WorkTaxonomyOption<WorkStack>[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vue', label: 'Vue' },
  { value: 'vite', label: 'Vite' },
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'webgpu', label: 'WebGPU' },
  { value: 'google-sheets', label: 'Google Sheets' },
  { value: 'appsheet', label: 'AppSheet' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'notion', label: 'Notion' },
  { value: 'css', label: 'CSS' },
]

function toLabelMap<T extends string>(options: WorkTaxonomyOption<T>[]): Record<T, string> {
  return options.reduce((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {} as Record<T, string>)
}

export const workCategoryLabels = toLabelMap(workCategoryOptions)
export const workRoleLabels = toLabelMap(workRoleOptions)
export const workStackLabels = toLabelMap(workStackOptions)

export const knownWorkCategories = new Set(workCategoryOptions.map((item) => item.value))
export const knownWorkRoles = new Set(workRoleOptions.map((item) => item.value))
export const knownWorkStacks = new Set(workStackOptions.map((item) => item.value))

export function getWorkCategoryLabel(value: string): string {
  return workCategoryLabels[value as WorkCategory] || value
}

export function getWorkRoleLabel(value: string): string {
  return workRoleLabels[value as WorkRole] || value
}

export function getWorkStackLabel(value: string): string {
  return workStackLabels[value as WorkStack] || value
}
