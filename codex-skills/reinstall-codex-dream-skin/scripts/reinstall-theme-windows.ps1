[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Image,
  [string]$Name = '',
  [string]$Source = 'https://github.com/TUARAN/Codex-Dream-Skin.git',
  [string]$Ref = 'main',
  [int]$Port = 9335,
  [switch]$ApplyNow,
  [switch]$AllowUntrustedSource,
  [switch]$KeepCheckout,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$DefaultRepository = 'https://github.com/TUARAN/Codex-Dream-Skin.git'
$workRoot = $null

function Assert-ReinstallCondition {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw "Codex Dream Skin reinstall: $Message" }
}

try {
  Assert-ReinstallCondition -Condition ($env:OS -eq 'Windows_NT') -Message 'This installer requires Windows.'
  Assert-ReinstallCondition -Condition ([System.IO.Path]::IsPathRooted($Image)) -Message "Image path must be absolute: $Image"
  $imagePath = [System.IO.Path]::GetFullPath($Image)
  Assert-ReinstallCondition -Condition (Test-Path -LiteralPath $imagePath -PathType Leaf) -Message "Image not found: $imagePath"

  $extension = [System.IO.Path]::GetExtension($imagePath).ToLowerInvariant()
  Assert-ReinstallCondition -Condition ($extension -in @('.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff')) `
    -Message 'Unsupported Windows image type. Use PNG, JPEG, BMP, or TIFF.'
  $imageBytes = (Get-Item -LiteralPath $imagePath).Length
  Assert-ReinstallCondition -Condition ($imageBytes -le 50MB) -Message 'Image is larger than 50 MB.'
  Assert-ReinstallCondition -Condition ($Port -ge 1024 -and $Port -le 65535) -Message "Port must be between 1024 and 65535: $Port"
  Assert-ReinstallCondition -Condition (-not [string]::IsNullOrWhiteSpace($Ref)) -Message 'Git ref cannot be empty.'

  $sourceIsDirectory = Test-Path -LiteralPath $Source -PathType Container
  if (-not $sourceIsDirectory -and $Source -cne $DefaultRepository -and -not $AllowUntrustedSource) {
    throw "Codex Dream Skin reinstall: Non-default source requires -AllowUntrustedSource after user confirmation: $Source"
  }

  if ([string]::IsNullOrWhiteSpace($Name)) { $Name = [System.IO.Path]::GetFileNameWithoutExtension($imagePath) }
  $Name = $Name.Trim()
  if ($Name.Length -gt 80) { $Name = $Name.Substring(0, 80) }
  Assert-ReinstallCondition -Condition ($Name.Length -gt 0) -Message 'Theme name cannot be empty.'

  $workRoot = Join-Path ([System.IO.Path]::GetTempPath()) "codex-dream-skin-skill-$PID-$([guid]::NewGuid().ToString('N'))"
  $projectRoot = Join-Path $workRoot 'Codex-Dream-Skin'
  New-Item -ItemType Directory -Path $projectRoot -Force | Out-Null

  $commit = 'local-source'
  if ($sourceIsDirectory) {
    $sourceRoot = (Resolve-Path -LiteralPath $Source).Path
    if (Test-Path -LiteralPath (Join-Path $sourceRoot '.git')) {
      $commit = (& git -C $sourceRoot rev-parse HEAD).Trim()
      if ($LASTEXITCODE -ne 0) { throw 'Could not resolve the local source commit.' }
    }
    Copy-Item -Path (Join-Path $sourceRoot '*') -Destination $projectRoot -Recurse -Force
  } else {
    $git = Get-Command git.exe -ErrorAction Stop
    & $git.Source clone --depth 1 --branch $Ref --single-branch $Source $projectRoot
    if ($LASTEXITCODE -ne 0) { throw "Could not clone Dream Skin source: $Source ($Ref)" }
    $commit = (& $git.Source -C $projectRoot rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Could not resolve the downloaded source commit.' }
  }

  $windowsRoot = Join-Path $projectRoot 'windows'
  $scriptsRoot = Join-Path $windowsRoot 'scripts'
  $assetsRoot = Join-Path $windowsRoot 'assets'
  $required = @(
    (Join-Path $scriptsRoot 'install-dream-skin.ps1'),
    (Join-Path $scriptsRoot 'start-dream-skin.ps1'),
    (Join-Path $scriptsRoot 'verify-dream-skin.ps1'),
    (Join-Path $scriptsRoot 'restore-dream-skin.ps1'),
    (Join-Path $scriptsRoot 'common-windows.ps1'),
    (Join-Path $scriptsRoot 'injector.mjs'),
    (Join-Path $assetsRoot 'dream-skin.css'),
    (Join-Path $assetsRoot 'renderer-inject.js')
  )
  foreach ($path in $required) {
    Assert-ReinstallCondition -Condition (Test-Path -LiteralPath $path -PathType Leaf) -Message "Required Windows engine file is missing: $path"
  }

  foreach ($script in Get-ChildItem -LiteralPath $scriptsRoot -Filter '*.ps1' -File) {
    $null = [scriptblock]::Create([System.IO.File]::ReadAllText($script.FullName))
  }

  . (Join-Path $scriptsRoot 'common-windows.ps1')
  Assert-DreamSkinPort -Port $Port
  $node = Get-DreamSkinNodeRuntime
  $codex = Get-DreamSkinCodexInstall
  $javascriptFiles = Get-ChildItem -LiteralPath $scriptsRoot, $assetsRoot -File |
    Where-Object { $_.Extension -in @('.mjs', '.js') }
  foreach ($javascript in $javascriptFiles) {
    & $node.Path --check $javascript.FullName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "JavaScript syntax check failed: $($javascript.FullName)" }
  }

  $referencePath = Join-Path $assetsRoot 'dream-reference.png'
  Add-Type -AssemblyName System.Drawing
  $sourceImage = [System.Drawing.Image]::FromFile($imagePath)
  try {
    $scale = [Math]::Min(1.0, 2400.0 / [Math]::Max($sourceImage.Width, $sourceImage.Height))
    $preparedWidth = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
    $preparedHeight = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
    $preparedImage = [System.Drawing.Bitmap]::new(
      $preparedWidth,
      $preparedHeight,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($preparedImage)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $preparedWidth, $preparedHeight)
      } finally {
        $graphics.Dispose()
      }
      $preparedImage.Save($referencePath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $preparedImage.Dispose()
    }
  } finally {
    $sourceImage.Dispose()
  }
  $preparedBytes = (Get-Item -LiteralPath $referencePath).Length
  Assert-ReinstallCondition -Condition ($preparedBytes -gt 0 -and $preparedBytes -le 16MB) `
    -Message 'Prepared Windows PNG must be non-empty and no larger than 16 MB.'
  & $node.Path (Join-Path $scriptsRoot 'injector.mjs') --check-payload | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Windows theme payload validation failed.' }

  $running = @(Get-DreamSkinCodexProcesses -Codex $codex)
  if ($DryRun) {
    Write-Host 'Preflight passed.'
    Write-Host "Platform: windows"
    Write-Host "Source: $Source ($Ref)"
    Write-Host "Engine commit: $commit"
    Write-Host "Image: $imagePath ($imageBytes bytes; prepared PNG $preparedBytes bytes)"
    Write-Host "Theme: $Name"
    Write-Host "Codex running: $($running.Count -gt 0)"
    Write-Host "Apply now: $([bool]$ApplyNow)"
    exit 0
  }

  if ($running.Count -gt 0) {
    Assert-ReinstallCondition -Condition ([bool]$ApplyNow) `
      -Message 'Codex is running. Close it first or rerun with -ApplyNow after explicit restart authorization.'
    Stop-DreamSkinCodex -Codex $codex -AllowForce
  }

  $installRoot = Join-Path $HOME '.codex\codex-dream-skin-windows'
  $installParent = Split-Path -Parent $installRoot
  $deployTemporary = "$installRoot.installing-$PID-$([guid]::NewGuid().ToString('N'))"
  $previous = "$installRoot.previous-$PID-$([guid]::NewGuid().ToString('N'))"
  New-Item -ItemType Directory -Path $installParent -Force | Out-Null
  New-Item -ItemType Directory -Path $deployTemporary -Force | Out-Null
  Copy-Item -Path (Join-Path $windowsRoot '*') -Destination $deployTemporary -Recurse -Force
  if (Test-Path -LiteralPath $installRoot) { Move-Item -LiteralPath $installRoot -Destination $previous }
  try {
    Move-Item -LiteralPath $deployTemporary -Destination $installRoot
    $global:LASTEXITCODE = 0
    & (Join-Path $installRoot 'scripts\install-dream-skin.ps1') -Port $Port -NoShortcuts
    if (-not $? -or $LASTEXITCODE -ne 0) { throw 'Windows Dream Skin install script failed.' }
    if ($ApplyNow) {
      $global:LASTEXITCODE = 0
      & (Join-Path $installRoot 'scripts\start-dream-skin.ps1') -Port $Port -RestartExisting
      if (-not $? -or $LASTEXITCODE -ne 0) { throw 'Windows Dream Skin start script failed.' }
      $global:LASTEXITCODE = 0
      & (Join-Path $installRoot 'scripts\verify-dream-skin.ps1') -Port $Port
      if (-not $? -or $LASTEXITCODE -ne 0) { throw 'Windows Dream Skin live verification failed.' }
    }
    if (Test-Path -LiteralPath $previous) { Remove-Item -LiteralPath $previous -Recurse -Force }
  } catch {
    if (Test-Path -LiteralPath $installRoot) { Remove-Item -LiteralPath $installRoot -Recurse -Force }
    if (Test-Path -LiteralPath $previous) { Move-Item -LiteralPath $previous -Destination $installRoot }
    throw
  }

  Write-Host "RESULT platform=windows engine_commit=$commit theme=$Name applied=$([bool]$ApplyNow) verified=$([bool]$ApplyNow)"
  if (-not $ApplyNow) { Write-Host 'Theme is installed but not live. Run start-dream-skin.ps1 after restart authorization.' }
  Write-Host "Rollback: powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$installRoot\scripts\restore-dream-skin.ps1`" -RestoreBaseTheme -PromptRestart"
} finally {
  if ($workRoot -and (Test-Path -LiteralPath $workRoot) -and -not $KeepCheckout) {
    Remove-Item -LiteralPath $workRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
