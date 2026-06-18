param(
  [switch]$Once,
  [switch]$Reset,
  [int]$IntervalSeconds = 300,
  [int]$MaxIterations = 10
)

$ErrorActionPreference = "Stop"
$queueFile = Join-Path $PSScriptRoot ".tech-debt-queue.json"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Get-QueueState {
  if (-not (Test-Path $queueFile)) {
    throw "Queue file not found: $queueFile"
  }
  return Get-Content $queueFile -Raw | ConvertFrom-Json
}

function Save-QueueState {
  param($State)
  $json = $State | ConvertTo-Json -Depth 8
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
  Write-Host "Tech debt discovery queue reset to 0/$($state.maxIterations)."
}

function Get-SectionPrompt {
  param($Slice, $State)

  $tickNum = $State.index + 1
  $section = $Slice.section
  $label = $Slice.label
  $focus = $Slice.focus
  $paths = ($Slice.paths -join "`n  - ")
  $reportRel = $State.reportPath

  $outOfScope = @"
Out of scope per PRD section 9 / gap-implementation-loop:
  audio/haptic alerts, full WCAG audit, FR-13 3-class detection,
  pause/resume monitoring, removing MockAnalyzeFrameService.
"@

  $baseRole = @"
You are a Senior Software Architect performing technical due diligence on CrowdNav.
Be brutally objective. Do not assume the current design is correct.
"@

  if ($section -le 7) {
    return @"
$baseRole

TECH DEBT DISCOVERY — Section $section/10: $label
Tick $tickNum/$($State.maxIterations)

Focus: $focus

Analyze these paths (repo root: $repoRoot):
  - $paths

For each issue provide:
  - Why it is technical debt
  - Current impact / Future impact
  - Severity (Low / Medium / High / Critical)
  - Maintainability or refactoring effort estimate (sections 1-2)

Append findings to $reportRel under "## $section. $label".
Update last_updated in frontmatter. Do not delete prior sections.

$outOfScope
Do not recommend implementing out-of-scope features as debt remediation.
"@
  }

  if ($section -eq 8) {
    return @"
$baseRole

TECH DEBT DISCOVERY — Section 8/10: Prioritization Table
Tick $tickNum/$($State.maxIterations)

Read $reportRel sections 1-7. Build the prioritization table:

| Debt Item | Category | Severity | Business Impact | Refactoring Effort | Priority |

Use P1 = Immediate, P2 = Next Quarter, P3 = Future Improvement.

$outOfScope
"@
  }

  if ($section -eq 9) {
    return @"
$baseRole

TECH DEBT DISCOVERY — Section 9/10: Technical Debt Heatmap
Tick $tickNum/$($State.maxIterations)

Read $reportRel sections 1-8. Classify all findings into:
  ### Critical Debt
  ### High Debt
  ### Medium Debt
  ### Low Debt

$outOfScope
"@
  }

  return @"
$baseRole

TECH DEBT DISCOVERY — Section 10/10: Executive Summary (FINAL)
Tick $tickNum/$($State.maxIterations)

Read $reportRel sections 1-9. Write section 10:
  - Top 5 risks
  - Consequences if ignored (12-18 months)
  - Remediation roadmap: 30 days (P1), 90 days (P2), 180 days (P3)

Ensure the report is self-contained for stakeholder review.

$outOfScope
"@
}

function New-TickPayload {
  param($State, $Slice)

  $tickNum = $State.index + 1
  $prompt = Get-SectionPrompt -Slice $Slice -State $State

  return (@{
    prompt = $prompt.Trim()
    iteration = $tickNum
    id = $Slice.id
    section = $Slice.section
    label = $Slice.label
    reportPath = $State.reportPath
  } | ConvertTo-Json -Compress)
}

function Invoke-Tick {
  $state = Get-QueueState
  if ($state.index -ge $state.maxIterations) {
    Write-Output "AGENT_LOOP_TICK_TECH_DEBT $($(@{
      prompt = 'Tech debt discovery complete — all 10 sections done. Review docs/reports/technical_debt_review.md.'
      iteration = $state.maxIterations
      complete = $true
    } | ConvertTo-Json -Compress))"
    return $false
  }

  $slice = $state.queue[$state.index]
  $payload = New-TickPayload -State $state -Slice $slice
  Write-Output "AGENT_LOOP_TICK_TECH_DEBT $payload"

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

$i = 0
while ($i -lt $MaxIterations) {
  Start-Sleep -Seconds $IntervalSeconds
  if (-not (Invoke-Tick)) { break }
  $i++
}
