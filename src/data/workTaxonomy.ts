import type { WorkCategory, WorkRole, WorkStack, WorkTaxonomyOption } from '@/types/workTaxonomy'

export const workCategoryOptions: WorkTaxonomyOption<WorkCategory>[] = [
  { value: 'design', label: '디자인', description: '시각/브랜드/인터페이스 판단이 중심인 작업' },
  { value: 'tool', label: '도구', description: '사용자가 직접 조작하는 도구형 작업' },
  { value: 'system', label: '시스템', description: '상태, 데이터, 운영 흐름을 묶는 시스템 작업' },
  { value: 'writing', label: '글쓰기', description: '문장, 세계관, 편집 구조가 중심인 작업' },
  { value: 'commerce', label: '커머스', description: '상품, 결제, 카탈로그, 운영 흐름과 연결된 작업' },
  { value: 'experiment', label: '실험', description: '검증/실험/QA 성격이 강한 작업' },
]

export const workRoleOptions: WorkTaxonomyOption<WorkRole>[] = [
  { value: 'designer', label: '디자인' },
  { value: 'developer', label: '개발' },
  { value: 'system-architect', label: '시스템 설계' },
  { value: 'writer', label: '글쓰기' },
  { value: 'editor', label: '편집' },
  { value: 'automation-planner', label: '자동화 기획' },
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
  { value: 'notion', label: '노션' },
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
