# Inquiry Worker API Contract

Commit 116 seals the Worker API boundary for the inquiry form.

- Endpoint: `POST /api/inquiries`
- Request shape: `InquiryApiRequestV1`
- Response shape: `InquiryApiResponse`
- D1 저장 is excluded from Commit 116 and is introduced by Commit 117.
- Google Form fallback is preserved as a fallback path while Worker-first submission is enabled.
