$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot
$gapScript = Join-Path $scriptsDir "loop-gap-impl.ps1"
$designScript = Join-Path $scriptsDir "loop-design-enrich.ps1"
$rounds = 3

Write-Host "=== Gap implementation loop x$rounds ==="
for ($i = 1; $i -le $rounds; $i++) {
  Write-Host ""
  Write-Host "--- Gap loop $i/$rounds ---"
  & $gapScript -Once
}

Write-Host ""
Write-Host "=== Design enrichment loop x$rounds ==="
for ($i = 1; $i -le $rounds; $i++) {
  Write-Host ""
  Write-Host "--- Design enrich loop $i/$rounds ---"
  & $designScript -Once
}

Write-Host ""
Write-Host "All loops completed: gap x$rounds, design x$rounds."
