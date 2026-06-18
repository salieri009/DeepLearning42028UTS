$ErrorActionPreference = "Stop"
$pidDir = Join-Path $env:TEMP "crowdnav-loops"
New-Item -ItemType Directory -Force -Path $pidDir | Out-Null

$shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
$scripts = @(
  @{ Name = "docker"; File = "loop-docker-health.ps1" },
  @{ Name = "pr42"; File = "loop-pr42-ci.ps1" }
)

foreach ($entry in $scripts) {
  $pidFile = Join-Path $pidDir "$($entry.Name).pid"
  if (Test-Path $pidFile) {
    $oldPid = [int](Get-Content $pidFile -Raw)
    if (Get-Process -Id $oldPid -ErrorAction SilentlyContinue) {
      Write-Host "Already running: $($entry.Name) (PID $oldPid)"
      continue
    }
  }

  $scriptPath = Join-Path $PSScriptRoot $entry.File
  $proc = Start-Process -FilePath $shell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $scriptPath
  ) -PassThru -WindowStyle Hidden

  $proc.Id | Set-Content $pidFile
  Write-Host "Started $($entry.Name) monitor PID $($proc.Id)"
}
