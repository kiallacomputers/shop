param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,

  [string]$StorageBucket = "products",

  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not $ConfirmRestore) {
  throw "Restore not started. Re-run with -ConfirmRestore after checking the target Supabase project."
}

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SECRET_KEY) {
  throw "SUPABASE_URL and SUPABASE_SECRET_KEY must be set for the target project."
}

function Encode-Path([string]$Value) {
  return (($Value -split "/") | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
}

$resolved = Resolve-Path $BackupPath
$working = $resolved.Path
$temp = $null

try {
  if ($working.ToLower().EndsWith(".zip")) {
    $temp = Join-Path ([IO.Path]::GetTempPath()) ("kialla-storage-restore-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $temp | Out-Null
    Expand-Archive -Path $working -DestinationPath $temp -Force
    $working = $temp
  }

  $bucketDir = Join-Path $working ("storage\" + $StorageBucket)
  if (-not (Test-Path $bucketDir)) {
    throw "Storage backup folder not found: $bucketDir"
  }

  $files = Get-ChildItem -Path $bucketDir -Recurse -File
  $baseUrl = $env:SUPABASE_URL.TrimEnd("/")
  $secret = $env:SUPABASE_SECRET_KEY
  $headers = @{
    "apikey" = $secret
    "Authorization" = "Bearer $secret"
    "x-upsert" = "true"
  }

  foreach ($file in $files) {
    $relative = $file.FullName.Substring($bucketDir.Length + 1).Replace("\", "/")
    $encoded = Encode-Path $relative
    $uri = "$baseUrl/storage/v1/object/$([uri]::EscapeDataString($StorageBucket))/$encoded"

    Write-Host "Uploading $relative"
    Invoke-WebRequest `
      -Method "POST" `
      -Uri $uri `
      -Headers $headers `
      -ContentType "application/octet-stream" `
      -InFile $file.FullName | Out-Null
  }

  Write-Host "Storage restore complete: $($files.Count) object(s)." -ForegroundColor Green
}
finally {
  if ($temp -and (Test-Path $temp)) {
    Remove-Item $temp -Recurse -Force
  }
}
