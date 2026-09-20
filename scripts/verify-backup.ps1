param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$resolved = Resolve-Path $BackupPath
$working = $resolved.Path
$temp = $null

try {
  if ($working.ToLower().EndsWith(".zip")) {
    $temp = Join-Path ([IO.Path]::GetTempPath()) ("kialla-backup-verify-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $temp | Out-Null
    Expand-Archive -Path $working -DestinationPath $temp -Force
    $working = $temp
  }

  $manifestPath = Join-Path $working "backup-manifest.json"
  if (-not (Test-Path $manifestPath)) {
    throw "backup-manifest.json was not found."
  }

  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  $failures = @()

  foreach ($entry in $manifest.files) {
    $relative = ([string]$entry.path).Replace("/", [IO.Path]::DirectorySeparatorChar)
    $file = Join-Path $working $relative

    if (-not (Test-Path $file)) {
      $failures += "Missing: $($entry.path)"
      continue
    }

    $hash = (Get-FileHash -Algorithm SHA256 -Path $file).Hash
    if ($hash -ne $entry.sha256) {
      $failures += "Checksum mismatch: $($entry.path)"
    }
  }

  $required = @(
    "database\schema.sql",
    "database\data.sql",
    "database\roles.sql",
    "project\package.json"
  )

  foreach ($relative in $required) {
    if (-not (Test-Path (Join-Path $working $relative))) {
      $failures += "Required recovery file missing: $relative"
    }
  }

  if ($failures.Count) {
    Write-Host "Backup verification FAILED:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
  }

  Write-Host "Backup verification PASSED." -ForegroundColor Green
  Write-Host "Created: $($manifest.created_at)"
  Write-Host "Files checked: $($manifest.files.Count)"
}
finally {
  if ($temp -and (Test-Path $temp)) {
    Remove-Item $temp -Recurse -Force
  }
}
