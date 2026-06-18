param(
  [int]$Sets = 5,
  [switch]$Reset
)

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$techDebtScript = Join-Path $scriptsDir "loop-tech-debt.ps1"
$gapScript = Join-Path $scriptsDir "loop-gap-impl.ps1"

if ($Reset) {
  & $techDebtScript -Reset
  $gapQueue = Join-Path $scriptsDir ".gap-impl-queue.json"
  if (Test-Path $gapQueue) {
    $g = Get-Content $gapQueue -Raw | ConvertFrom-Json
    $g.index = 0
    foreach ($i in 0..($g.queue.Count - 1)) {
      $slice = $g.queue[$i]
      $slice.status = "pending"
      $g.queue[$i] = $slice
    }
    $g | ConvertTo-Json -Depth 6 | Set-Content -Path $gapQueue -Encoding utf8
    Write-Host "Gap implementation queue reset to 0/$($g.maxIterations)."
  }
}

Write-Host "=== Tech debt + gap implementation: $Sets set(s) ==="
Write-Host "Each set: 1x tech debt tick, then 1x gap implementation tick"
Write-Host ""

for ($i = 1; $i -le $Sets; $i++) {
  Write-Host "--- Set $i/$Sets : Tech debt discovery (1 tick) ---"
  & $techDebtScript -Once
  Write-Host ""
  Write-Host "--- Set $i/$Sets : Gap implementation (1 tick) ---"
  & $gapScript -Once
  Write-Host ""
}

Write-Host "Completed $Sets set(s): tech debt x$Sets + gap implementation x$Sets."
