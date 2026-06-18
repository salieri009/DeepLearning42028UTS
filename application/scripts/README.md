# CrowdNav local monitoring loops

## Why agent `/loop` background tasks aborted

Two separate issues were identified on Windows + Cursor agent shells:

1. **Nested PowerShell quoting** — `powershell -Command "while ($true) { ... }"` lets the *outer* shell expand `$true` to `True` before the inner `powershell` runs, which breaks the loop immediately.
2. **Cursor background shell lifetime** — long-running `while ($true)` or `Start-Sleep` jobs started via the agent shell tool often terminate in ~0.5s when the tool session ends. They are not reliable for periodic wakes inside the IDE.

## Recommended usage (local terminal)

From `application/`:

```powershell
# Start detached 5m Docker + 10m PR monitors (survives IDE shell exit)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-monitoring-loops.ps1

# One-shot checks (safe for agents / CI)
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loop-docker-health.ps1 -Once
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\loop-pr42-ci.ps1 -Once

# Stop detached monitors
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-monitoring-loops.ps1
```

Detached loops write PID files under `%TEMP%\crowdnav-loops\`.
