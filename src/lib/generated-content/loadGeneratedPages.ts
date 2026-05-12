import pagesFile from '@/content/generated/pages.generated.json'
import type { GeneratedPagesFile, GeneratedPage } from '@/types/generatedContent'

const generatedPagesFile = pagesFile as GeneratedPagesFile

export function loadGeneratedPages(): GeneratedPage[] {
  return Array.isArray(generatedPagesFile.pages) ? generatedPagesFile.pages : []
}

export function getGeneratedPagesFile(): GeneratedPagesFile {
  return generatedPagesFile
}
