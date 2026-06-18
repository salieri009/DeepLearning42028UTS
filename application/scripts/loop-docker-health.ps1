param(
  [switch]$Once
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Invoke-DockerHealthCheck {
  Push-Location $root
  try {
    docker compose ps
    curl -fsS http://localhost:8080/actuator/health
    Write-Host ""
  } finally {
    Pop-Location
  }
}

if ($Once) {
  Invoke-DockerHealthCheck
  exit 0
}

while ($true) {
  Start-Sleep -Seconds 300
  Write-Output 'AGENT_LOOP_TICK_docker {"prompt":"application 스택 healthy인지 확인: docker compose ps, curl actuator/health"}'
  try { Invoke-DockerHealthCheck } catch { Write-Warning $_ }
}
