param(
  [switch]$Once,
  [switch]$Reset,
  [int]$IntervalSeconds = 600
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend\crowdnav-api"
$queueFile = Join-Path $PSScriptRoot ".gap-impl-queue.json"

function Get-QueueState {
  if (-not (Test-Path $queueFile)) {
    throw "Queue file not found: $queueFile"
  }
  return Get-Content $queueFile -Raw | ConvertFrom-Json
}

function Save-QueueState {
  param($State)
  $json = $State | ConvertTo-Json -Depth 6
  Set-Content -Path $queueFile -Value $json -Encoding utf8
}

function Reset-QueueState {
  $state = Get-QueueState
  $state.index = 0
  foreach ($i in 0..($state.queue.Count - 1)) {
    $slice = $state.queue[$i]
    $slice.status = "pending"
    $state.queue[$i] = $slice
  }
  Save-QueueState $state
  Write-Host "Gap implementation queue reset to 0/$($state.maxIterations)."
}

function New-TickPayload {
  param($State, $Slice)

  $tickNum = $State.index + 1
  $prompt = @"
Gap implementation loop $tickNum/$($State.maxIterations) — $($Slice.label)

Follow .cursor/rules/gap-implementation-loop.mdc:
Analyze → Find gaps → Implement → Connect FE↔BE → Test → Report [FOUND]/[IMPLEMENTED]/[TESTED]/[REMAINING]/[NEXT LOOP].

Focus this tick: $($Slice.focus)

Out of scope: audio, WCAG full audit, FR-13 3-class, pause/resume, remove MockAnalyzeFrameService.
Run Gradle + Vitest + npm run build when done.
"@

  return (@{
    prompt = $prompt.Trim()
    iteration = $tickNum
    id = $Slice.id
    label = $Slice.label
    focus = $Slice.focus
  } | ConvertTo-Json -Compress)
}

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

function Invoke-Tick {
  $state = Get-QueueState
  if ($state.index -ge $state.maxIterations) {
    Write-Output "AGENT_LOOP_TICK_GAP_IMPL $($(@{
      prompt = 'Gap implementation loop complete — all iterations done. Run final gap report only.'
      iteration = $state.maxIterations
      complete = $true
    } | ConvertTo-Json -Compress))"
    return $false
  }

  $slice = $state.queue[$state.index]
  $payload = New-TickPayload -State $state -Slice $slice
  Write-Output "AGENT_LOOP_TICK_GAP_IMPL $payload"

  try {
    Invoke-GapImplCheck
  } catch {
    Write-Warning $_
    throw
  }

  $slice.status = "done"
  $state.queue[$state.index] = $slice
  $state.index = $state.index + 1
  Save-QueueState $state
  return $true
}

if ($Reset) {
  Reset-QueueState
  if (-not $Once) { exit 0 }
}

if ($Once) {
  [void](Invoke-Tick)
  exit 0
}

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  try {
    if (-not (Invoke-Tick)) { break }
  } catch {
    Write-Warning $_
  }
}
