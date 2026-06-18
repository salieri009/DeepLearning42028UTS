param(
  [switch]$Once
)

$ErrorActionPreference = "Stop"

$prompt = "Align application/ CODE with docs/REQUIREMENTS.md: grep Partial/Drift/TBD; implement Must gaps (inference, backend, frontend); run pytest+vitest; update docs status (not PRD.md)."

function Emit-Tick {
  $json = (@{ prompt = $prompt } | ConvertTo-Json -Compress)
  Write-Output "AGENT_LOOP_TICK_DOCS_ALIGNMENT $json"
}

if ($Once) {
  Emit-Tick
  exit 0
}

while ($true) {
  Start-Sleep -Seconds 900
  Emit-Tick
}
