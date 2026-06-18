$pidDir = Join-Path $env:TEMP "crowdnav-loops"
if (-not (Test-Path $pidDir)) {
  Write-Host "No loop PID directory ($pidDir)."
  exit 0
}

Get-ChildItem $pidDir -Filter "*.pid" | ForEach-Object {
  $pid = [int](Get-Content $_.FullName -Raw)
  $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
  if ($proc) {
    Stop-Process -Id $pid -Force
    Write-Host "Stopped $($_.BaseName) PID $pid"
  }
  Remove-Item $_.FullName -Force
}
