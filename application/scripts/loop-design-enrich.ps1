param(
  [switch]$Once,
  [int]$IntervalSeconds = 600
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$queueFile = Join-Path $PSScriptRoot ".design-enrich-queue.json"

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

function Get-CurrentSlice {
  param($State)
  $count = $State.queue.Count
  if ($count -eq 0) { throw "Queue is empty" }
  $idx = $State.index % $count
  return $State.queue[$idx], $idx
}

function New-TickPayload {
  param($State, $Slice, $QueueIndex)

  $tickNum = $State.index + 1
  $section = $Slice.designRulesSection
  $target = $Slice.target
  $label = $Slice.label
  $fileList = ($Slice.files -join ", ")

  $prompt = @"
Design enrichment tick #$tickNum ($label): enrich $target and related files ($fileList). MUST read docs/DESIGN_RULES.md section $section first; comply with sections 1-7; follow .cursor/rules/design-enrichment-loop.mdc. Identify Top 5 weaknesses (DESIGN_RULES violations first), fix them, run npm test -- --run and npm run build. No business logic changes.
"@

  return [ordered]@{
    prompt       = $prompt.Trim()
    target       = $target
    queueIndex   = $QueueIndex
    tick         = $tickNum
    label        = $label
    designRulesSection = $section
    files        = $Slice.files
  }
}

function Invoke-DesignEnrichGate {
  Push-Location $frontend
  try {
    npm test -- --run
    if ($LASTEXITCODE -ne 0) { throw "frontend tests failed" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
  } finally {
    Pop-Location
  }
  Write-Host "Design enrichment gate: PASS (Vitest + build)"
}

function Invoke-DesignEnrichTick {
  $state = Get-QueueState
  $slice, $queueIndex = Get-CurrentSlice $state
  $payload = New-TickPayload -State $state -Slice $slice -QueueIndex $queueIndex
  $payloadJson = ($payload | ConvertTo-Json -Compress -Depth 6)

  Write-Output "AGENT_LOOP_TICK_DESIGN_ENRICH $payloadJson"

  try {
    Invoke-DesignEnrichGate
  } catch {
    Write-Warning $_
    throw
  }

  $state.index = ($state.index + 1) % $state.queue.Count
  $state.lastTarget = $slice.target
  Save-QueueState $state

  $nextSlice, $nextIdx = Get-CurrentSlice $state
  Write-Host "Queue advanced: next slice [$nextIdx] $($nextSlice.label) ($($nextSlice.target))"
}

if ($Once) {
  Invoke-DesignEnrichTick
  exit 0
}

# Run first tick immediately, then loop on interval
Invoke-DesignEnrichTick

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  try {
    Invoke-DesignEnrichTick
  } catch {
    Write-Warning $_
  }
}
