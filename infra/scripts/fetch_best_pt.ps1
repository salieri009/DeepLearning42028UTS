# Download and extract best.pt from a completed SageMaker training job (ADR-0003 handoff).
#
# Usage:
#   .\infra\scripts\fetch_best_pt.ps1 -JobName crowdnav-yolo-1234567890
#   .\infra\scripts\fetch_best_pt.ps1 -JobName my-job -Bucket my-bucket -Dest application\models

param(
    [Parameter(Mandatory = $true)]
    [string]$JobName,

    [string]$Bucket = "crowdnav-jrdb-data",
    [string]$Region = "ap-southeast-2",
    [string]$Dest = "application\models"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $RepoRoot

$Staging = Join-Path "runs" "sagemaker" $JobName
New-Item -ItemType Directory -Force -Path $Staging | Out-Null

$TarKey = "output/$JobName/output/model.tar.gz"
$TarLocal = Join-Path $Staging "model.tar.gz"

Write-Host "[CrowdNav] Downloading s3://$Bucket/$TarKey ..."
aws s3 cp "s3://$Bucket/$TarKey" $TarLocal --region $Region

Write-Host "[CrowdNav] Extracting to $Staging ..."
tar -xzf $TarLocal -C $Staging

$BestPt = Join-Path $Staging "best.pt"
if (-not (Test-Path $BestPt)) {
    throw "best.pt not found in archive. Contents of ${Staging}: $(Get-ChildItem $Staging | ForEach-Object Name)"
}

$DestDir = Join-Path $RepoRoot $Dest
New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
$DestFile = Join-Path $DestDir "best.pt"
Copy-Item -Force $BestPt $DestFile

Write-Host "[CrowdNav] Installed: $DestFile"
Write-Host "[CrowdNav] Next: cd application && docker compose up --build"
