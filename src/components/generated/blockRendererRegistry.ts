import TextBlock from './blocks/TextBlock.vue'
import CalloutBlock from './blocks/CalloutBlock.vue'
import CompareBlock from './blocks/CompareBlock.vue'
import ImageBlock from './blocks/ImageBlock.vue'
import CtaBlock from './blocks/CtaBlock.vue'
import FaqBlock from './blocks/FaqBlock.vue'

export const blockRenderers = {
  text: TextBlock,
  callout: CalloutBlock,
  compare: CompareBlock,
  image: ImageBlock,
  cta: CtaBlock,
  faq: FaqBlock,
} as const

export const blockRendererKinds = Object.keys(blockRenderers)
