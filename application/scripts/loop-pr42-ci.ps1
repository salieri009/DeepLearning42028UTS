param(
  [switch]$Once
)

$ErrorActionPreference = "Stop"

function Invoke-Pr42Check {
  gh pr checks 42 --repo salieri009/DeepLearning42028UTS
}

if ($Once) {
  Invoke-Pr42Check
  exit 0
}

while ($true) {
  Start-Sleep -Seconds 600
  Write-Output 'AGENT_LOOP_TICK_pr42 {"prompt":"PR #42 CI 실패 있으면 수정 (gh pr checks 42)"}'
  try { Invoke-Pr42Check } catch { Write-Warning $_ }
}
