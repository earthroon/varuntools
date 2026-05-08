# Inquiry Reply Templates

These templates are starting points for manual replies to inquiries received through Google Form and triaged in Google Sheet.

Use them carefully. Do not promise price, schedule, delivery, refund, stock, licensing terms, or acceptance before checking the real product/work context.

## Product inquiry reply

```txt
안녕하세요. 문의 남겨주셔서 감사합니다.
문의하신 상품은 현재 상세 정보와 판매 상태를 확인한 뒤 답변드리고 있습니다.
확인할 항목은 가격, 구매 가능 여부, 배송/디지털 제공 방식, 환불 안내입니다.
확인 후 추가 안내가 필요하면 이 메일로 이어서 답변드리겠습니다.
```

## Commission inquiry reply

```txt
안녕하세요. 작업 의뢰 문의 감사합니다.
의뢰 범위, 사용 목적, 희망 일정, 필요한 결과물 형식을 먼저 확인하고 있습니다.
아래 정보가 가능하면 함께 알려주세요.
- 작업 목적
- 희망 일정
- 참고 자료 또는 방향성
- 필요한 파일 형식
- 예산 범위가 있다면 대략적인 범위
내용을 확인한 뒤 진행 가능 여부와 다음 단계를 안내드리겠습니다.
```

## Collaboration proposal reply

```txt
안녕하세요. 협업 제안 감사합니다.
제안해주신 목적, 범위, 일정, 공개/상업 이용 여부를 확인한 뒤 답변드리겠습니다.
관련 링크나 제안서가 있다면 함께 보내주세요.
검토 후 진행 가능 여부를 안내드리겠습니다.
```

## Additional information request

```txt
안녕하세요. 문의 확인했습니다.
정확히 답변드리기 위해 몇 가지 정보가 더 필요합니다.
- 문의 대상 상품/페이지
- 문제가 발생한 화면 또는 상황
- 원하는 처리 방향
- 답변 받을 연락 경로
추가 정보를 보내주시면 이어서 확인하겠습니다.
```

## Support inquiry reply

```txt
안녕하세요. 지원 문의 확인했습니다.
결제, 다운로드, 배송, 개인정보, 오류 여부를 먼저 확인하고 있습니다.
민감한 정보는 메일 본문에 자세히 적지 말고 필요한 범위만 공유해주세요.
확인 후 가능한 조치와 다음 단계를 안내드리겠습니다.
```

## General inquiry reply

```txt
안녕하세요. 문의 남겨주셔서 감사합니다.
내용 확인했습니다. 답변이 필요한 경우 남겨주신 연락 경로를 기준으로 이어서 안내드리겠습니다.
```

## Schedule or estimate check

```txt
안녕하세요. 문의 감사합니다.
일정이나 견적은 작업 범위와 사용 목적을 확인한 뒤 안내드릴 수 있습니다.
현재 메시지만으로 확정 답변을 드리기 어려워, 필요한 정보를 먼저 확인하고 있습니다.
검토 후 가능 범위와 다음 단계를 안내드리겠습니다.
```

## Out-of-scope inquiry reply

```txt
안녕하세요. 문의 남겨주셔서 감사합니다.
현재 바룬툴즈에서 처리 가능한 범위를 벗어난 내용이라 직접 진행은 어렵습니다.
다만 문의 내용은 확인했으며, 추후 운영 범위가 확장되면 참고하겠습니다.
```

## No reply / spam handling note

```txt
스팸, 자동 제출, 무성의한 반복 제출, 악성 메시지는 답변하지 않고 opsStatus=spam으로 처리합니다.
개인정보나 민감정보가 불필요하게 포함된 경우 internalMemo에 장기 보관하지 않습니다.
```

## Category checklist

```txt
product
commission
support
collaboration
general
```

## Google Form wording boundary

Because Google Form submission uses a browser `no-cors` request, do not tell users that the database receipt is fully verified from the website. Prefer wording such as:

```txt
문의 접수 요청이 완료되었습니다.
```

## gateCode boundary

`gateCode` is a submission friction value only. It is not a login password, lookup password, authentication token, or identity proof. Do not use it for inquiry lookup or user verification.


## Commit 115 wording note

When acknowledging receipt, prefer “문의 접수 요청이 완료되었습니다.” or “문의 접수 요청을 확인했습니다.” unless the operator has confirmed the row in the Google Sheet. Google Form `no-cors` submission means the browser-side UI cannot prove final storage.
