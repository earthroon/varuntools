# EWA Runtime Health Guard

Commit 112 adds a runtime health guard for the lazy WebGPU EWA gallery processor.

## SSOT

The SSOT remains:

- `page.csv` media metadata
- the active MarkdownLightbox item
- the EWA preset contract

runtime health is not SSOT. It is a temporary browser-session decision state used to decide whether the current session should keep trying WebGPU EWA.

The health guard does not modify `page.csv`, generated manifests, portfolio assets, or authoring metadata.

## Runtime health states

- `healthy`: EWA can run within the normal quality budget.
- `degraded`: recent processing was slow or fallback-heavy; EWA may downgrade quality tier.
- `cooldown`: repeated timeout, device lost, or repeated failures happened; EWA is temporarily bypassed.
- `disabled`: WebGPU is unavailable or manually disabled during debug.

## Cooldown policy

If repeated failures are detected, the processor enters a session cooldown for 60 seconds.

During cooldown:

```txt
active lightbox image
→ runtime health check
→ cooldown active
→ original fallback
```

No blank screen should appear. The original image remains the safe display path.

## Health and quality budget

Commit 111 added device tier and quality budget before processing. Commit 112 adds feedback after processing.

```txt
device tier = device capability estimate
quality budget = allowed target size / mode / timeout
runtime health = recent success/failure feedback
```

If runtime health is degraded, the resolved tier can be downgraded for the current session. For example:

```txt
high tier + repeated slow processing
→ recommended tier: medium or low
→ adaptive-tile may downgrade to basic
```

The authoring metadata is preserved. Only the runtime execution path is adjusted.

## Debug controls

Enable debug output:

```js
localStorage.setItem('vt:ewa-debug', 'true')
```

Session health override for QA:

```js
sessionStorage.setItem('vt:ewa-health', 'cooldown')
sessionStorage.setItem('vt:ewa-health', 'disabled')
sessionStorage.setItem('vt:ewa-health', 'healthy')
```

Local override is debug-only and should not be used as persistent product state:

```js
localStorage.setItem('vt:ewa-health-override', 'cooldown')
```

Long-term localStorage health storage is not used. Runtime health is not analytics. No health state is sent to any server.

## Diagnostics

The EWA debug panel can display:

- runtime health state
- reasons
- attempts
- successes
- failures
- timeouts
- device lost count
- cooldown remaining time
- recommended tier

Warning codes include:

```txt
EWA_DIAG_RUNTIME_DEGRADED
EWA_DIAG_RUNTIME_COOLDOWN_ACTIVE
EWA_DIAG_RUNTIME_DISABLED
EWA_DIAG_RUNTIME_TIER_DOWNGRADED
EWA_DIAG_RUNTIME_REPEATED_TIMEOUT
EWA_DIAG_RUNTIME_DEVICE_LOST
EWA_DIAG_RUNTIME_REPEATED_FALLBACK
```

## Non-goals

Commit 112 does not add:

- analytics sending
- server-side health persistence
- page.csv edits
- manifest edits
- new WebGPU algorithms
- WorkCard GPU processing
- global image processing
- build-time derivatives

analytics 전송 없음.

## Rollout gate relationship

The rollout gate is checked before runtime health and quality budget processing. Runtime health may still block EWA when the rollout gate allows it, for example during session cooldown.

```txt
rollout gate = feature enablement
runtime health = current session safety
quality budget = device/tier execution budget
```
