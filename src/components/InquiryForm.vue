<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { InquiryDraft, InquiryUiState, InquiryValidationError, InquiryValidationOptions } from '@/types/inquiry'
import { inquiryFormConfig, isInquiryGoogleFormReady } from '@/config/inquiryForm'
import { inquirySubmitStrategy, inquiryWorkerApiConfig, isInquiryWorkerApiReady } from '@/config/inquiryWorkerApi'
import { INQUIRY_CATEGORIES, validateInquiryDraft } from '@/utils/inquiryValidation'
import { submitInquiry } from '@/utils/inquirySubmit'
import { applyInquiryPrefillToDraft, getBrowserInquiryPrefillContext } from '@/utils/inquiryPrefill'
import {
  createInquirySubmitGuard,
  createInquiryClientGuardSnapshot,
  markInquirySubmitStarted,
  validateInquirySubmitGuard,
} from '@/utils/inquirySubmitGuard'

const props = withDefaults(
  defineProps<{
    title?: string
    intro?: string
    requireNickname?: boolean
    requireGateCode?: boolean
    requireEmail?: boolean
    submitLabel?: string
  }>(),
  {
    title: '문의하기',
    intro: '닉네임과 제출 확인용 코드를 입력한 뒤 문의를 남겨주세요.',
    requireNickname: true,
    requireGateCode: true,
    requireEmail: false,
    submitLabel: '문의 남기기',
  },
)

const prefillContext = getBrowserInquiryPrefillContext()
const sourcePath = typeof window === 'undefined' ? '/inquiry' : window.location.pathname || '/inquiry'
const sourceUrl = typeof window === 'undefined' ? '' : window.location.href

const draft = reactive<InquiryDraft>({
  nickname: '',
  gateCode: '',
  category: 'general',
  relatedProductSlug: '',
  title: '',
  message: '',
  email: '',
  consent: false,
  honeypot: '',
})

applyInquiryPrefillToDraft(draft, prefillContext)

const errors = ref<InquiryValidationError[]>([])
const touched = reactive<Record<string, boolean>>({})
const isSubmitting = ref(false)
const showGateCode = ref(false)
const submitMessage = ref('')
const submitMode = ref<'google-form' | 'worker' | 'mock' | ''>('')
const fallbackUsed = ref(false)
const submitState = ref<InquiryUiState>('idle')
const submitGuard = reactive(createInquirySubmitGuard())

const validationOptions = computed<InquiryValidationOptions>(() => ({
  requireNickname: props.requireNickname,
  requireGateCode: props.requireGateCode,
  requireEmail: props.requireEmail,
}))

const isWorkerConnected = computed(() => isInquiryWorkerApiReady(inquiryWorkerApiConfig))
const isGoogleFormFallbackReady = computed(() => isInquiryGoogleFormReady(inquiryFormConfig))
const isIntakeConnected = computed(() => isWorkerConnected.value || isGoogleFormFallbackReady.value)
const connectionLabel = computed(() => {
  if (isWorkerConnected.value && inquirySubmitStrategy.primaryTarget === 'worker') return 'Worker-first 접수 가능'
  if (isGoogleFormFallbackReady.value) return '예비 접수 가능'
  return '미리보기 모드'
})
const connectionMessage = computed(() => {
  if (isWorkerConnected.value && inquirySubmitStrategy.primaryTarget === 'worker') {
    return '문의는 Worker API로 접수되고 D1 관리자 큐에 저장됩니다. Google Form은 Worker 장애 시 예비 접수 경로로만 사용됩니다.'
  }
  if (isGoogleFormFallbackReady.value) {
    return 'Worker API를 사용할 수 없을 때 Google Form 예비 접수 경로를 사용할 수 있습니다. no-cors 제출은 응답 본문을 확인하지 않습니다.'
  }
  return '아직 실제 접수함에 연결되지 않았습니다. 현재 제출은 미리보기 모드로 처리됩니다.'
})
const contextNotice = computed(() => {
  if (!prefillContext.prefilled) return ''
  const chunks = []
  if (prefillContext.categoryFromQuery) chunks.push(`문의 유형: ${prefillContext.categoryFromQuery}`)
  if (prefillContext.ref) chunks.push(`관련 항목: ${prefillContext.ref}`)
  return chunks.length ? chunks.join(' · ') : ''
})

const fieldErrors = computed(() => {
  const map = new Map<string, InquiryValidationError>()
  for (const error of errors.value) {
    if (!map.has(String(error.field))) map.set(String(error.field), error)
  }
  return map
})

const hasErrors = computed(() => errors.value.length > 0)
const messageCount = computed(() => draft.message.trim().length)
const gateCodeRequiredLabel = computed(() => (props.requireGateCode ? '*' : '선택'))
const nicknameRequiredLabel = computed(() => (props.requireNickname ? '*' : '선택'))
const emailRequiredLabel = computed(() => (props.requireEmail ? '필수' : '선택'))

function errorFor(field: keyof InquiryDraft | 'form'): string {
  return fieldErrors.value.get(String(field))?.message || ''
}

function markTouched(field: keyof InquiryDraft): void {
  touched[String(field)] = true
}

function validate(): boolean {
  submitState.value = 'validating'
  const validationErrors = validateInquiryDraft(draft, validationOptions.value)
  errors.value = validationErrors
  submitState.value = validationErrors.length ? 'error' : 'idle'
  return validationErrors.length === 0
}

function blockSubmit(blockingErrors: InquiryValidationError[]): void {
  errors.value = blockingErrors
  submitState.value = 'blocked'
  submitMessage.value = '제출 조건을 확인해주세요.'
  submitMode.value = ''
}

async function onSubmit(): Promise<void> {
  submitMessage.value = ''
  submitMode.value = ''
  fallbackUsed.value = false

  if (isSubmitting.value) return
  if (!validate()) return

  const guardErrors = validateInquirySubmitGuard(submitGuard, draft)
  if (guardErrors.length) {
    blockSubmit(guardErrors)
    return
  }

  markInquirySubmitStarted(submitGuard, draft)
  isSubmitting.value = true
  submitState.value = 'submitting'

  try {
    const result = await submitInquiry(draft, inquiryFormConfig, validationOptions.value, {
      sourcePath,
      sourceUrl,
      context: prefillContext,
      clientGuard: createInquiryClientGuardSnapshot(submitGuard),
    })

    if (result.ok) {
      submitMessage.value = result.message
      submitMode.value = result.target
      fallbackUsed.value = result.fallbackUsed
      submitState.value = result.target === 'mock' ? 'mock' : result.fallbackUsed ? 'fallback-success' : 'success'
      draft.gateCode = ''
      draft.title = ''
      draft.message = ''
      draft.relatedProductSlug = prefillContext.ref || ''
      draft.consent = false
      draft.honeypot = ''
      errors.value = []
      Object.keys(touched).forEach((key) => {
        touched[key] = false
      })
    } else {
      errors.value = result.errors || [
        {
          field: 'form',
          code: result.reason,
          message: '문의 접수 요청에 실패했습니다.',
        },
      ]
      submitState.value = result.reason === 'config-invalid' ? 'config-invalid' : 'error'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="vt-inquiry-form" aria-labelledby="inquiry-form-title" :data-state="submitState">
    <header class="vt-inquiry-form__header">
      <p class="vt-inquiry-form__eyebrow">Contact Gate</p>
      <h2 id="inquiry-form-title" class="vt-inquiry-form__title">{{ title }}</h2>
      <p v-if="intro" class="vt-inquiry-form__intro">{{ intro }}</p>
      <p class="vt-inquiry-form__notice">
        익명 문의는 받지 않습니다. 닉네임과 제출 확인 코드를 입력해야 문의를 남길 수 있습니다.
      </p>
      <div class="vt-inquiry-form__connection" :data-connected="isIntakeConnected" :data-primary="inquirySubmitStrategy.primaryTarget" role="status" aria-live="polite">
        <strong>{{ connectionLabel }}</strong>
        <span>{{ connectionMessage }}</span>
      </div>
      <p v-if="contextNotice" class="vt-inquiry-form__lookup-note" data-prefill-context="query">
        {{ contextNotice }} — URL query로 채워진 값이며 제출 전 수정할 수 있습니다.
      </p>
      <p class="vt-inquiry-form__lookup-note">
        현재 문의글 조회 기능은 제공하지 않습니다. 필요한 경우 제출 전 내용을 복사해 보관해주세요.
      </p>
    </header>

    <form class="vt-inquiry-form__body" novalidate @submit.prevent="onSubmit">
      <div v-if="hasErrors" class="vt-inquiry-form__alert" role="alert">
        <strong>입력값을 확인해주세요.</strong>
        <ul>
          <li v-for="error in errors" :key="`${error.field}-${error.code}`">{{ error.message }}</li>
        </ul>
      </div>

      <label class="vt-inquiry-field vt-inquiry-field--honeypot" for="inquiry-website">
        <span class="vt-inquiry-field__label">웹사이트</span>
        <input
          id="inquiry-website"
          v-model="draft.honeypot"
          class="vt-inquiry-field__control"
          type="text"
          tabindex="-1"
          autocomplete="off"
        />
      </label>

      <div class="vt-inquiry-form__grid">
        <label class="vt-inquiry-field" for="inquiry-nickname">
          <span class="vt-inquiry-field__label">
            닉네임 <em v-if="props.requireNickname" aria-hidden="true">*</em><span v-else class="vt-inquiry-field__optional">{{ nicknameRequiredLabel }}</span>
          </span>
          <input
            id="inquiry-nickname"
            v-model="draft.nickname"
            class="vt-inquiry-field__control"
            :class="{ 'vt-inquiry-field__control--error': errorFor('nickname') }"
            type="text"
            autocomplete="nickname"
            placeholder="예) VARUN"
            :aria-invalid="Boolean(errorFor('nickname'))"
            aria-describedby="inquiry-nickname-help inquiry-nickname-error"
            @blur="markTouched('nickname'); validate()"
          />
          <span id="inquiry-nickname-help" class="vt-inquiry-field__help">2~24자. 답변 확인용 이름으로 사용됩니다.</span>
          <span v-if="errorFor('nickname')" id="inquiry-nickname-error" class="vt-inquiry-field__error">{{ errorFor('nickname') }}</span>
        </label>

        <label class="vt-inquiry-field" for="inquiry-gate-code">
          <span class="vt-inquiry-field__label">
            제출 확인 코드 <em v-if="props.requireGateCode" aria-hidden="true">*</em><span v-else class="vt-inquiry-field__optional">{{ gateCodeRequiredLabel }}</span>
          </span>
          <span class="vt-inquiry-field__password-row">
            <input
              id="inquiry-gate-code"
              v-model="draft.gateCode"
              class="vt-inquiry-field__control vt-inquiry-field__control--password"
              :class="{ 'vt-inquiry-field__control--error': errorFor('gateCode') }"
              :type="showGateCode ? 'text' : 'password'"
              autocomplete="off"
              placeholder="4자 이상"
              :aria-invalid="Boolean(errorFor('gateCode'))"
              aria-describedby="inquiry-gate-code-help inquiry-gate-code-error"
              @blur="markTouched('gateCode'); validate()"
            />
            <button
              class="vt-inquiry-field__toggle"
              type="button"
              :aria-pressed="showGateCode"
              @click="showGateCode = !showGateCode"
            >
              {{ showGateCode ? '숨김' : '보기' }}
            </button>
          </span>
          <span id="inquiry-gate-code-help" class="vt-inquiry-field__help">
            이 값은 로그인/조회용 비밀번호가 아니라 자동 제출을 줄이기 위한 확인 코드입니다.
          </span>
          <span v-if="errorFor('gateCode')" id="inquiry-gate-code-error" class="vt-inquiry-field__error">{{ errorFor('gateCode') }}</span>
        </label>
      </div>

      <div class="vt-inquiry-form__grid">
        <label class="vt-inquiry-field" for="inquiry-category">
          <span class="vt-inquiry-field__label">문의 유형 <em aria-hidden="true">*</em></span>
          <select
            id="inquiry-category"
            v-model="draft.category"
            class="vt-inquiry-field__control"
            :class="{ 'vt-inquiry-field__control--error': errorFor('category') }"
            :aria-invalid="Boolean(errorFor('category'))"
            aria-describedby="inquiry-category-error"
            @blur="markTouched('category'); validate()"
          >
            <option v-for="category in INQUIRY_CATEGORIES" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
          <span v-if="errorFor('category')" id="inquiry-category-error" class="vt-inquiry-field__error">{{ errorFor('category') }}</span>
        </label>

        <label class="vt-inquiry-field" for="inquiry-related-product">
          <span class="vt-inquiry-field__label">관련 상품/페이지</span>
          <input
            id="inquiry-related-product"
            v-model="draft.relatedProductSlug"
            class="vt-inquiry-field__control"
            type="text"
            placeholder="예) products/dummy-catalog"
            autocomplete="off"
          />
          <span class="vt-inquiry-field__help">상품 문의라면 slug나 페이지 이름을 적어주세요. URL query로 채워진 값도 제출 전 확인 대상입니다.</span>
        </label>
      </div>

      <label class="vt-inquiry-field" for="inquiry-title">
        <span class="vt-inquiry-field__label">제목 <em aria-hidden="true">*</em></span>
        <input
          id="inquiry-title"
          v-model="draft.title"
          class="vt-inquiry-field__control"
          :class="{ 'vt-inquiry-field__control--error': errorFor('title') }"
          type="text"
          maxlength="80"
          placeholder="무엇을 문의하시나요?"
          :aria-invalid="Boolean(errorFor('title'))"
          aria-describedby="inquiry-title-help inquiry-title-error"
          @blur="markTouched('title'); validate()"
        />
        <span id="inquiry-title-help" class="vt-inquiry-field__help">2~80자.</span>
        <span v-if="errorFor('title')" id="inquiry-title-error" class="vt-inquiry-field__error">{{ errorFor('title') }}</span>
      </label>

      <label class="vt-inquiry-field" for="inquiry-message">
        <span class="vt-inquiry-field__label">문의 내용 <em aria-hidden="true">*</em></span>
        <textarea
          id="inquiry-message"
          v-model="draft.message"
          class="vt-inquiry-field__control vt-inquiry-field__textarea"
          :class="{ 'vt-inquiry-field__control--error': errorFor('message') }"
          maxlength="2000"
          placeholder="문의 내용을 적어주세요. 상품/작업 의뢰라면 용도, 일정, 예산 범위를 함께 남기면 확인이 빠릅니다."
          :aria-invalid="Boolean(errorFor('message'))"
          aria-describedby="inquiry-message-help inquiry-message-error"
          @blur="markTouched('message'); validate()"
        />
        <span id="inquiry-message-help" class="vt-inquiry-field__help">10~2000자. 현재 {{ messageCount }}자.</span>
        <span v-if="errorFor('message')" id="inquiry-message-error" class="vt-inquiry-field__error">{{ errorFor('message') }}</span>
      </label>

      <label class="vt-inquiry-field" for="inquiry-email">
        <span class="vt-inquiry-field__label">이메일 <span class="vt-inquiry-field__optional">{{ emailRequiredLabel }}</span></span>
        <input
          id="inquiry-email"
          v-model="draft.email"
          class="vt-inquiry-field__control"
          :class="{ 'vt-inquiry-field__control--error': errorFor('email') }"
          type="email"
          autocomplete="email"
          placeholder="reply@example.com"
          :aria-invalid="Boolean(errorFor('email'))"
          aria-describedby="inquiry-email-help inquiry-email-error"
          @blur="markTouched('email'); validate()"
        />
        <span id="inquiry-email-help" class="vt-inquiry-field__help">이메일은 기본 선택 입력입니다. 답변을 받고 싶다면 이메일을 남겨주세요.</span>
        <span v-if="errorFor('email')" id="inquiry-email-error" class="vt-inquiry-field__error">{{ errorFor('email') }}</span>
      </label>

      <label class="vt-inquiry-consent" for="inquiry-consent">
        <input
          id="inquiry-consent"
          v-model="draft.consent"
          type="checkbox"
          :aria-invalid="Boolean(errorFor('consent'))"
          aria-describedby="inquiry-consent-error"
          @change="markTouched('consent'); validate()"
        />
        <span>문의 처리를 위해 입력한 정보를 확인하는 데 동의합니다. <strong>제출 확인 코드는 로그인/조회용 비밀번호가 아닙니다.</strong></span>
      </label>
      <p v-if="errorFor('consent')" id="inquiry-consent-error" class="vt-inquiry-field__error">{{ errorFor('consent') }}</p>

      <div class="vt-inquiry-form__actions">
        <button class="vt-inquiry-form__submit" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '접수 요청 중...' : submitLabel }}
        </button>
      </div>

      <p
        v-if="submitMessage"
        class="vt-inquiry-form__status"
        :data-mode="submitMode"
        :data-state="submitState"
        :data-fallback-used="fallbackUsed"
        role="status"
        aria-live="polite"
      >
        {{ submitMessage }}
      </p>
    </form>
  </section>
</template>
