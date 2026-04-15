param(
  [string]$QueuePath = "private/prompts/antigravity/master/STITCH_ITEM_ICON_QUEUE.json",
  [string]$ItemId = "",
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Resolve-AbsolutePath {
  param([Parameter(Mandatory = $true)][string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $PathValue))
}

function Ensure-Directory {
  param([Parameter(Mandatory = $true)][string]$FilePath)

  $directory = Split-Path -Parent $FilePath
  if (-not [string]::IsNullOrWhiteSpace($directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }
}

function Resolve-SourceCandidate {
  param([Parameter(Mandatory = $true)][string]$DeclaredSourcePath)

  $absoluteDeclared = Resolve-AbsolutePath $DeclaredSourcePath
  $sourceDirectory = Split-Path -Parent $absoluteDeclared
  $sourceBasename = [System.IO.Path]::GetFileNameWithoutExtension($absoluteDeclared)
  $extensions = @(".png", ".jpg", ".jpeg", ".webp")

  foreach ($extension in $extensions) {
    $candidate = Join-Path $sourceDirectory ($sourceBasename + $extension)
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $absoluteDeclared
}

function Save-CroppedIcon {
  param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [Parameter(Mandatory = $true)][string]$TargetPath,
    [Parameter(Mandatory = $true)][int]$OutputSize
  )

  $sourceBitmap = [System.Drawing.Bitmap]::new($SourcePath)
  try {
    $cropSide = [Math]::Min($sourceBitmap.Width, $sourceBitmap.Height)
    $cropX = [Math]::Max(0, [int](($sourceBitmap.Width - $cropSide) / 2))
    $cropY = [Math]::Max(0, [int](($sourceBitmap.Height - $cropSide) / 2))
    $cropRectangle = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropSide, $cropSide)
    $targetBitmap = [System.Drawing.Bitmap]::new($OutputSize, $OutputSize)

    try {
      $graphics = [System.Drawing.Graphics]::FromImage($targetBitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage(
          $sourceBitmap,
          [System.Drawing.Rectangle]::new(0, 0, $OutputSize, $OutputSize),
          $cropRectangle,
          [System.Drawing.GraphicsUnit]::Pixel
        )
      }
      finally {
        $graphics.Dispose()
      }

      Ensure-Directory -FilePath $TargetPath
      $targetBitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $targetBitmap.Dispose()
    }
  }
  finally {
    $sourceBitmap.Dispose()
  }
}

$queueFile = Resolve-AbsolutePath $QueuePath
$queue = Get-Content -LiteralPath $queueFile -Raw | ConvertFrom-Json
$tasks = @($queue.tasks)

if (-not [string]::IsNullOrWhiteSpace($ItemId)) {
  $tasks = @($tasks | Where-Object { $_.item_id -eq $ItemId })
}

$reportRows = @()

foreach ($task in $tasks) {
  $outputSize = if ($task.output_size) { [int]$task.output_size } else { 256 }
  $sourcePath = Resolve-SourceCandidate -DeclaredSourcePath $task.target_path
  $runtimeTarget = Resolve-AbsolutePath $task.crop_target_path
  $packagedTarget = Resolve-AbsolutePath $task.publish_target_path
  $sourceExists = Test-Path -LiteralPath $sourcePath

  if (-not $sourceExists) {
    $reportRows += [PSCustomObject]@{
      item_id = $task.item_id
      status = "missing_source"
      source_path = $sourcePath
      runtime_target = $runtimeTarget
      packaged_target = $packagedTarget
    }
    continue
  }

  if (-not $DryRun) {
    Save-CroppedIcon -SourcePath $sourcePath -TargetPath $runtimeTarget -OutputSize $outputSize
    Ensure-Directory -FilePath $packagedTarget
    Copy-Item -LiteralPath $runtimeTarget -Destination $packagedTarget -Force
  }

  $reportRows += [PSCustomObject]@{
    item_id = $task.item_id
    status = $(if ($DryRun) { "ready" } else { "cropped" })
    source_path = $sourcePath
    runtime_target = $runtimeTarget
    packaged_target = $packagedTarget
  }
}

$reportRoot = Resolve-AbsolutePath "output/review"
New-Item -ItemType Directory -Force -Path $reportRoot | Out-Null

$jsonReport = Join-Path $reportRoot "item-icon-crop-report.json"
$mdReport = Join-Path $reportRoot "item-icon-crop-report.md"
$summary = [PSCustomObject]@{
  queue_path = $queueFile
  dry_run = [bool]$DryRun
  task_count = $tasks.Count
  cropped_count = @($reportRows | Where-Object { $_.status -eq "cropped" }).Count
  ready_count = @($reportRows | Where-Object { $_.status -eq "ready" }).Count
  missing_source_count = @($reportRows | Where-Object { $_.status -eq "missing_source" }).Count
  rows = $reportRows
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonReport -Encoding UTF8

$mdLines = @(
  "# Item Icon Crop Report",
  "",
  "- dry_run: $([bool]$DryRun)",
  "- task_count: $($tasks.Count)",
  "- cropped_count: $(@($reportRows | Where-Object { $_.status -eq 'cropped' }).Count)",
  "- ready_count: $(@($reportRows | Where-Object { $_.status -eq 'ready' }).Count)",
  "- missing_source_count: $(@($reportRows | Where-Object { $_.status -eq 'missing_source' }).Count)",
  "",
  "## Rows"
)

foreach ($row in $reportRows) {
  $mdLines += "- $($row.item_id) | $($row.status) | $($row.source_path)"
}

$mdLines -join "`n" | Set-Content -LiteralPath $mdReport -Encoding UTF8
$summary | ConvertTo-Json -Depth 4

