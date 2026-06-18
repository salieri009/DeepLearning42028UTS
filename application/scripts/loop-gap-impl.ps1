param(
  [switch]$Once
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend\crowdnav-api"

function Invoke-GapImplCheck {
  Push-Location $frontend
  try {
    npm test -- --run
    if ($LASTEXITCODE -ne 0) { throw "frontend tests failed" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
  } finally {
    Pop-Location
  }

  Push-Location $backend
  try {
    .\gradlew.bat test
    if ($LASTEXITCODE -ne 0) { throw "backend tests failed" }
  } finally {
    Pop-Location
  }

  Write-Host "Gap implementation gate: PASS (Vitest + build + Gradle)"
}

if ($Once) {
  Invoke-GapImplCheck
  exit 0
}

while ($true) {
  Start-Sleep -Seconds 600
  Write-Output 'AGENT_LOOP_TICK_GAP_IMPL {"prompt":"Run gap implementation loop: verify no Coming soon placeholders, npm test/build, gradlew test; fix failures per .cursor/rules/gap-implementation-loop.mdc"}'
  try {
    Invoke-GapImplCheck
  } catch {
    Write-Warning $_
  }
}
