import type { InquiryReplyTemplate, InquiryManualReplyChecklistItem } from '@/types/inquiryReply'

export const INQUIRY_REPLY_TEMPLATES: InquiryReplyTemplate[] = [
  {
    id: 'received-basic',
    label: '접수 확인',
    description: '문의 접수 사실을 짧게 안내하고 후속 확인을 예고합니다.',
    subject: '[varun.tools] 문의 확인 안내',
    body: '안녕하세요. 문의 남겨주신 내용 확인했습니다.\n내용을 검토한 뒤 필요한 경우 추가 확인을 요청드리겠습니다.\n감사합니다.',
    nextStatus: 'triaged',
  },
  {
    id: 'product-question',
    label: '상품 문의',
    description: '상품/자료/디지털 파일 관련 문의에 답변할 때 사용합니다.',
    subject: '[varun.tools] 상품 문의 답변',
    body: '안녕하세요. 문의하신 상품 내용을 확인했습니다.\n현재 확인 가능한 범위는 아래와 같습니다.\n\n- 확인 내용:\n- 추가 안내:\n\n필요하시면 관련 링크나 상세 조건을 함께 보내주세요.',
    nextStatus: 'in-progress',
  },
  {
    id: 'order-or-production',
    label: '제작/주문 확인',
    description: '제작, 주문, 납품, 일정 확인이 필요한 문의용입니다.',
    subject: '[varun.tools] 제작/주문 문의 확인',
    body: '안녕하세요. 제작/주문 관련 문의 확인했습니다.\n정확한 확인을 위해 아래 정보를 함께 알려주시면 검토 후 안내드리겠습니다.\n\n- 요청하신 작업/상품:\n- 희망 일정:\n- 참고 자료 또는 조건:',
    nextStatus: 'in-progress',
  },
  {
    id: 'collaboration',
    label: '협업 문의',
    description: '협업, 제휴, 외부 제안 문의에 대응합니다.',
    subject: '[varun.tools] 협업 문의 확인',
    body: '안녕하세요. 협업 제안 남겨주셔서 감사합니다.\n제안 내용을 검토한 뒤 진행 가능 범위와 필요한 조건을 정리해 회신드리겠습니다.\n자료나 일정이 있다면 함께 보내주세요.',
    nextStatus: 'in-progress',
  },
  {
    id: 'cannot-answer',
    label: '응답 불가/범위 외',
    description: '답변 범위를 벗어난 문의를 정중히 닫습니다.',
    subject: '[varun.tools] 문의 답변',
    body: '안녕하세요. 문의 내용을 확인했습니다.\n다만 현재 varun.tools 운영 범위에서는 해당 요청을 진행하거나 답변드리기 어렵습니다.\n양해 부탁드립니다.',
    nextStatus: 'closed',
  },
  {
    id: 'follow-up-needed',
    label: '추가 확인 요청',
    description: '답변 전 사용자에게 추가 정보를 요청합니다.',
    subject: '[varun.tools] 문의 추가 확인 요청',
    body: '안녕하세요. 문의 내용을 확인했습니다.\n정확히 안내드리기 위해 아래 내용을 추가로 확인 부탁드립니다.\n\n- 추가 확인이 필요한 내용:\n- 참고 링크 또는 파일:\n\n확인 후 회신드리겠습니다.',
    nextStatus: 'waiting-reply',
  },
]

export const INQUIRY_MANUAL_REPLY_CHECKLIST: InquiryManualReplyChecklistItem[] = [
  { id: 'read-message', label: '문의 본문을 끝까지 확인했다.', required: true },
  { id: 'check-contact', label: '이메일 또는 답변 가능한 채널을 확인했다.', required: true },
  { id: 'check-sensitive', label: '개인정보/민감정보 포함 여부를 확인했다.', required: true },
  { id: 'choose-template', label: '답변 템플릿을 선택하거나 직접 답변문을 작성했다.', required: false },
  { id: 'manual-send', label: '외부 메일/DM 등에서 수동 답변을 발송했다.', required: true },
  { id: 'update-status', label: '관리자 큐에서 다음 상태를 갱신했다.', required: true },
  { id: 'add-note', label: '필요한 경우 운영 note를 남겼다.', required: false },
]

export const INQUIRY_REPLY_STATUS_GUIDE = [
  { from: 'new', to: 'triaged', label: '문의만 확인한 상태' },
  { from: 'triaged', to: 'in-progress', label: '답변 준비 또는 내부 확인 중' },
  { from: 'in-progress', to: 'waiting-reply', label: '사용자 추가 회신 대기' },
  { from: 'in-progress', to: 'closed', label: '수동 답변 완료 후 종결' },
  { from: 'waiting-reply', to: 'closed', label: '대기 후 종결' },
]
