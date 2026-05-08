# QA Run Template

Copy this file for each launch QA run.

```txt
QA run id:
Date:
Reviewer:
Build/ZIP:
Branch/commit:
Browser:
OS/device:
Screenshot folder:
```

## Summary

```txt
Overall result: PASS / PASS WITH WARNINGS / BLOCKED
Blocker count:
Warning count:
Notes:
```

## Viewport coverage

| Viewport | Status | Notes |
|---:|---|---|
| 1440 | N/A |  |
| 1280 | N/A |  |
| 1024 | N/A |  |
| 768 | N/A |  |
| 430 | N/A |  |
| 390 | N/A |  |
| 360 | N/A |  |

## Page coverage

| Route | 1440 | 1280 | 1024 | 768 | 430 | 390 | 360 | Notes |
|---|---|---|---|---|---|---|---|---|
| `/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/products` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/products/dummy-catalog` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/inquiry` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/lab-markdown-gallery` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies/store` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies/shipping` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies/refund` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies/privacy` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |
| `/policies/digital-download` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |  |

## Interaction coverage

| Area | Check | Status | Evidence | Notes |
|---|---|---|---|---|
| Command Palette | Open / close / keyboard navigation | N/A |  |  |
| Product catalog | Search / status filter / empty state | N/A |  |  |
| Product detail | CTA / trust links / disabled state | N/A |  |  |
| Inquiry | Required validation / gateCode helper / consent | N/A |  |  |
| Media gallery | Lightbox / gallery strip / before-after / video | N/A |  |  |
| Responsive | No 360 horizontal overflow | N/A |  |  |

## Status language

Use these labels for individual QA items:

```txt
PASS
WARNING
BLOCKER
N/A
```

Use these labels for the overall run:

```txt
PASS
PASS WITH WARNINGS
BLOCKED
```

## Issues

| ID | Status | Severity | Route | Viewport | Description | Follow-up |
|---|---|---|---|---:|---|---|
| QA-001 | OPEN | WARNING | `/` | 1440 |  |  |

## Final decision

```txt
Decision: PASS / PASS WITH WARNINGS / BLOCKED
Reason:
Next action:
```

## Screenshot Harness Run

```txt
Command:
Run date/time:
Base URL:
Build/ZIP:
Generated screenshot folder:
Playwright browser install status:
Result: PASS / WARNING / BLOCKED / N/A
Notes:
```
