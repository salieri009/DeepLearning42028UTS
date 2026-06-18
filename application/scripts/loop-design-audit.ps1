param(
  [switch]$Once
)

$ErrorActionPreference = "Stop"

$pidDir = Join-Path $env:TEMP "crowdnav-loops"
$pidFile = Join-Path $pidDir "loop-design-audit.pid"
New-Item -ItemType Directory -Force -Path $pidDir | Out-Null
Set-Content -Path $pidFile -Value $PID

$prompt = "Thorough UI/UX design audit: compare application/frontend against docs/DESIGN_RULES.md, docs/DESIGN.md section 9, application/frontend/DESIGN.md; rg rgba outside tokens.ts; fix token gaps; update docs/reports/ui_design_audit.md; run npm test/build/lint in application/frontend. Do not edit docs/PRD.md."

function Emit-Tick {
  $json = (@{ prompt = $prompt } | ConvertTo-Json -Compress)
  Write-Output "AGENT_LOOP_TICK_DESIGN $json"
}

if ($Once) {
  Emit-Tick
  exit 0
}

while ($true) {
  Start-Sleep -Seconds 1800
  Emit-Tick
}
