$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "loop-design-enrich.ps1"

for ($i = 1; $i -le 10; $i++) {
  Write-Host ""
  Write-Host "=== Design enrich loop $i/10 ==="
  Write-Host ""
  & $script -Once
}

Write-Host ""
Write-Host "Completed 10 design enrichment ticks."
