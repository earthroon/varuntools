<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { ClaimLookupInput, ClaimLookupResult } from '@/types/claim'
import { lookupClaim, validateClaimInput } from '@/utils/claimClient'
const props = withDefaults(defineProps<{ title?: string; intro?: string; requireClaimToken?: boolean; requireEmail?: boolean; requireOrderId?: boolean; submitLabel?: string }>(), { title: '구매 파일 수령', intro: '결제 후 안내받은 수령 정보를 입력하세요.', requireClaimToken: true, requireEmail: false, requireOrderId: false, submitLabel: '수령 정보 확인' })
const draft = reactive<ClaimLookupInput>({ claimToken: '', email: '', orderId: '' })
const consent = ref(false); const errors = ref<string[]>([]); const result = ref<ClaimLookupResult | null>(null); const isSubmitting = ref(false)
const statusLabel = computed(() => isSubmitting.value ? '수령 정보를 확인하는 중입니다.' : !result.value ? '수령 정보를 입력하세요.' : result.value.message)
const resultTone = computed(() => !result.value ? 'idle' : result.value.status === 'found' ? 'success' : result.value.status === 'not-configured' || result.value.status === 'pending-worker' ? 'notice' : 'warning')
function validate(): boolean { const nextErrors = validateClaimInput(draft); if (props.requireEmail && !(draft.email || '').trim()) nextErrors.push('이메일을 입력해주세요.'); if (props.requireOrderId && !(draft.orderId || '').trim()) nextErrors.push('주문번호를 입력해주세요.'); if (props.requireClaimToken && !(draft.claimToken || '').trim()) nextErrors.push('claim token을 입력해주세요.'); if (!consent.value) nextErrors.push('서버에서 구매 권한을 검증한다는 안내를 확인해주세요.'); errors.value = [...new Set(nextErrors)]; return errors.value.length === 0 }
async function onSubmit(): Promise<void> { result.value = null; if (!validate()) return; isSubmitting.value = true; try { result.value = await lookupClaim(draft) } catch { result.value = { status: 'error', message: '수령 정보 확인 중 문제가 발생했습니다.' } } finally { isSubmitting.value = false } }
</script>
<template>
  <section class="vt-claim-portal" aria-labelledby="claim-portal-title" :aria-busy="isSubmitting">
    <header class="vt-claim-portal__header"><p class="vt-claim-portal__eyebrow">Buyer Delivery Portal</p><h2 id="claim-portal-title" class="vt-claim-portal__title">{{ title }}</h2><p v-if="intro" class="vt-claim-portal__intro">{{ intro }}</p><p class="vt-claim-portal__notice">이 화면은 수령 정보를 접수하고 상태를 안내합니다. 실제 파일 접근 권한은 Delivery Worker가 서버에서만 검증합니다.</p></header>
    <form class="vt-claim-portal__form" novalidate @submit.prevent="onSubmit">
      <div v-if="errors.length" class="vt-claim-portal__alert" role="alert"><strong>입력값을 확인해주세요.</strong><ul><li v-for="error in errors" :key="error">{{ error }}</li></ul></div>
      <label class="vt-claim-portal__field" for="claim-token"><span>Claim token <em v-if="requireClaimToken" aria-hidden="true">*</em></span><input id="claim-token" v-model="draft.claimToken" type="text" autocomplete="off" placeholder="예) claim_xxxxx" :required="requireClaimToken" /></label>
      <div class="vt-claim-portal__grid"><label class="vt-claim-portal__field" for="claim-email"><span>이메일 <em v-if="requireEmail" aria-hidden="true">*</em></span><input id="claim-email" v-model="draft.email" type="email" autocomplete="email" placeholder="you@example.com" :required="requireEmail" /></label><label class="vt-claim-portal__field" for="claim-order-id"><span>주문번호 <em v-if="requireOrderId" aria-hidden="true">*</em></span><input id="claim-order-id" v-model="draft.orderId" type="text" autocomplete="off" placeholder="예) order_xxxxx" :required="requireOrderId" /></label></div>
      <label class="vt-claim-portal__confirm"><input v-model="consent" type="checkbox" /><span>입력 정보는 서버 검증에만 사용되며, 브라우저에 저장하지 않습니다.</span></label>
      <div class="vt-claim-portal__actions"><button class="vt-claim-portal__button" type="submit" :disabled="isSubmitting">{{ isSubmitting ? '확인 중' : submitLabel }}</button></div>
    </form>
    <section class="vt-claim-portal__status" :data-tone="resultTone" role="status" aria-live="polite"><strong>{{ statusLabel }}</strong><p v-if="result?.productTitle">상품: {{ result.productTitle }}</p><p v-if="result?.expiresAt">수령 가능 기간: {{ result.expiresAt }}</p><ul v-if="result?.deliverables?.length" class="vt-claim-portal__deliverables"><li v-for="item in result.deliverables" :key="item.id"><span>{{ item.label }}</span><small>{{ item.fileName || item.format || item.id }}</small></li></ul></section>
  </section>
</template>
