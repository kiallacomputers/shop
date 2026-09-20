param(
  [string]$BackupRoot = ".\backups",
  [string]$StorageBucket = "products",
  [switch]$SkipStorage,
  [switch]$SkipAuthMetadata
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Get-ProjectRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Encode-Path([string]$Value) {
  return (($Value -split "/") | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
}

function Invoke-SupabaseJson(
  [string]$Method,
  [string]$Uri,
  [string]$Secret,
  [object]$Body = $null
) {
  $headers = @{
    "apikey" = $Secret
    "Authorization" = "Bearer $Secret"
  }

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
  }

  return Invoke-RestMethod `
    -Method $Method `
    -Uri $Uri `
    -Headers $headers `
    -ContentType "application/json" `
    -Body ($Body | ConvertTo-Json -Depth 10)
}

function Get-StorageObjects(
  [string]$SupabaseUrl,
  [string]$Secret,
  [string]$Bucket,
  [string]$Prefix = ""
) {
  $all = @()
  $offset = 0
  $limit = 100

  do {
    $uri = "$SupabaseUrl/storage/v1/object/list/$([uri]::EscapeDataString($Bucket))"
    $body = @{
      prefix = $Prefix
      limit = $limit
      offset = $offset
      sortBy = @{ column = "name"; order = "asc" }
    }
    $rows = @(Invoke-SupabaseJson -Method "POST" -Uri $uri -Secret $Secret -Body $body)

    foreach ($row in $rows) {
      $name = [string]$row.name
      if ([string]::IsNullOrWhiteSpace($name)) { continue }

      $path = if ([string]::IsNullOrWhiteSpace($Prefix)) { $name } else { "$Prefix/$name" }

      # Storage folders have no object id/metadata. Recurse into them.
      $isFolder = ($null -eq $row.id) -and ($null -eq $row.metadata)
      if ($isFolder) {
        $all += @(Get-StorageObjects -SupabaseUrl $SupabaseUrl -Secret $Secret -Bucket $Bucket -Prefix $path)
      } else {
        $all += [pscustomobject]@{
          path = $path
          id = $row.id
          created_at = $row.created_at
          updated_at = $row.updated_at
          metadata = $row.metadata
        }
      }
    }

    $offset += $rows.Count
  } while ($rows.Count -eq $limit)

  return $all
}

function Backup-Storage(
  [string]$SupabaseUrl,
  [string]$Secret,
  [string]$Bucket,
  [string]$Destination
) {
  Write-Step "Backing up Supabase Storage bucket '$Bucket'"

  $bucketDir = Join-Path $Destination $Bucket
  New-Item -ItemType Directory -Force -Path $bucketDir | Out-Null

  $objects = @(Get-StorageObjects -SupabaseUrl $SupabaseUrl -Secret $Secret -Bucket $Bucket)
  $manifest = @()

  foreach ($object in $objects) {
    $relative = [string]$object.path
    $target = Join-Path $bucketDir ($relative -replace "/", [IO.Path]::DirectorySeparatorChar)
    $targetDir = Split-Path -Parent $target
    if ($targetDir) { New-Item -ItemType Directory -Force -Path $targetDir | Out-Null }

    $encodedPath = Encode-Path $relative
    $uri = "$SupabaseUrl/storage/v1/object/authenticated/$([uri]::EscapeDataString($Bucket))/$encodedPath"
    $headers = @{
      "apikey" = $Secret
      "Authorization" = "Bearer $Secret"
    }

    Invoke-WebRequest -Method "GET" -Uri $uri -Headers $headers -OutFile $target

    $file = Get-Item $target
    $manifest += [pscustomobject]@{
      path = $relative
      size = $file.Length
      sha256 = (Get-FileHash -Algorithm SHA256 -Path $target).Hash
      updated_at = $object.updated_at
    }
  }

  $manifest | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 (Join-Path $Destination "$Bucket-manifest.json")
  Write-Host "Backed up $($objects.Count) storage object(s)." -ForegroundColor Green
}

function Backup-AuthMetadata(
  [string]$SupabaseUrl,
  [string]$Secret,
  [string]$Destination
) {
  Write-Step "Exporting Supabase Auth user metadata (reference only)"

  $users = @()
  $page = 1
  $perPage = 1000

  do {
    $uri = "$SupabaseUrl/auth/v1/admin/users?page=$page&per_page=$perPage"
    $response = Invoke-SupabaseJson -Method "GET" -Uri $uri -Secret $Secret
    $rows = @($response.users)

    foreach ($user in $rows) {
      # Password hashes/tokens are intentionally not part of this export.
      $users += [pscustomobject]@{
        id = $user.id
        email = $user.email
        phone = $user.phone
        created_at = $user.created_at
        updated_at = $user.updated_at
        last_sign_in_at = $user.last_sign_in_at
        email_confirmed_at = $user.email_confirmed_at
        phone_confirmed_at = $user.phone_confirmed_at
        app_metadata = $user.app_metadata
        user_metadata = $user.user_metadata
      }
    }

    $page++
  } while ($rows.Count -eq $perPage)

  $users | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $Destination "auth-users-metadata.json")
  Write-Host "Exported metadata for $($users.Count) auth user(s)." -ForegroundColor Green
}

$projectRoot = Get-ProjectRoot
Set-Location $projectRoot

Require-Command "supabase"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBase = Join-Path (Resolve-Path (New-Item -ItemType Directory -Force -Path $BackupRoot).Path) "kialla-shop-$timestamp"
New-Item -ItemType Directory -Force -Path $backupBase | Out-Null

$dbDir = Join-Path $backupBase "database"
$storageDir = Join-Path $backupBase "storage"
$configDir = Join-Path $backupBase "project"
New-Item -ItemType Directory -Force -Path $dbDir, $storageDir, $configDir | Out-Null

Write-Step "Creating database schema dump"
& supabase db dump --linked -f (Join-Path $dbDir "schema.sql")
if ($LASTEXITCODE -ne 0) { throw "Supabase schema dump failed." }

Write-Step "Creating database data dump"
& supabase db dump --linked --data-only --use-copy -f (Join-Path $dbDir "data.sql")
if ($LASTEXITCODE -ne 0) { throw "Supabase data dump failed." }

Write-Step "Creating database roles dump"
& supabase db dump --linked --role-only -f (Join-Path $dbDir "roles.sql")
if ($LASTEXITCODE -ne 0) { throw "Supabase role dump failed." }

Write-Step "Copying recovery-critical project files"
$projectFiles = @(
  "package.json",
  "package-lock.json",
  "nuxt.config.ts",
  "tsconfig.json"
)

foreach ($file in $projectFiles) {
  $source = Join-Path $projectRoot $file
  if (Test-Path $source) {
    Copy-Item $source (Join-Path $configDir $file) -Force
  }
}

if (Test-Path (Join-Path $projectRoot "supabase")) {
  Copy-Item (Join-Path $projectRoot "supabase") (Join-Path $configDir "supabase") -Recurse -Force
}

if (Test-Path (Join-Path $projectRoot ".env.recovery.example")) {
  Copy-Item (Join-Path $projectRoot ".env.recovery.example") (Join-Path $configDir ".env.recovery.example") -Force
}

$supabaseUrl = if ($env:SUPABASE_URL) { $env:SUPABASE_URL.TrimEnd("/") } else { "" }
$supabaseSecret = if ($env:SUPABASE_SECRET_KEY) { $env:SUPABASE_SECRET_KEY } else { "" }

if (-not $SkipStorage) {
  if ($supabaseUrl -and $supabaseSecret) {
    Backup-Storage -SupabaseUrl $supabaseUrl -Secret $supabaseSecret -Bucket $StorageBucket -Destination $storageDir
  } else {
    Write-Warning "SUPABASE_URL or SUPABASE_SECRET_KEY is not set. Storage backup was skipped."
  }
}

if (-not $SkipAuthMetadata) {
  if ($supabaseUrl -and $supabaseSecret) {
    Backup-AuthMetadata -SupabaseUrl $supabaseUrl -Secret $supabaseSecret -Destination $backupBase
  } else {
    Write-Warning "SUPABASE_URL or SUPABASE_SECRET_KEY is not set. Auth metadata export was skipped."
  }
}

Write-Step "Writing environment-variable inventory"
@(
  "AUSPOST_API_KEY",
  "BUSINESS_ABN",
  "BUSINESS_ADDRESS",
  "BUSINESS_EMAIL",
  "BUSINESS_NAME",
  "BUSINESS_PHONE",
  "BUSINESS_TAGLINE",
  "BUSINESS_WEBSITE",
  "FACEBOOK_GRAPH_VERSION",
  "FACEBOOK_PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_ID",
  "MICROSOFT_CLIENT_ID",
  "MICROSOFT_CLIENT_SECRET",
  "MICROSOFT_SENDER_EMAIL",
  "MICROSOFT_SENDER_NAME",
  "MICROSOFT_TENANT_ID",
  "NUXT_PUBLIC_SITE_URL",
  "ORDER_NOTIFICATION_EMAIL",
  "QUOTE_NOTIFICATION_EMAIL",
  "SITE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_URL",
  "WEEKLY_ANALYTICS_EMAIL"
) | Set-Content -Encoding UTF8 (Join-Path $configDir "required-environment-variable-names.txt")

Write-Step "Generating SHA256 manifest"
$manifestFiles = Get-ChildItem -Path $backupBase -Recurse -File | Where-Object { $_.Name -ne "backup-manifest.json" }
$manifest = foreach ($file in $manifestFiles) {
  [pscustomobject]@{
    path = $file.FullName.Substring($backupBase.Length + 1).Replace("\", "/")
    bytes = $file.Length
    sha256 = (Get-FileHash -Algorithm SHA256 -Path $file.FullName).Hash
  }
}

$backupManifest = [pscustomobject]@{
  backup_version = 1
  created_at = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  storage_bucket = $StorageBucket
  files = $manifest
}
$backupManifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $backupBase "backup-manifest.json")

Write-Step "Creating final ZIP archive"
$zipPath = "$backupBase.zip"
Compress-Archive -Path (Join-Path $backupBase "*") -DestinationPath $zipPath -CompressionLevel Optimal -Force

Write-Host ""
Write-Host "Backup complete." -ForegroundColor Green
Write-Host "Folder: $backupBase"
Write-Host "ZIP:    $zipPath"
Write-Host ""
Write-Host "IMPORTANT: Keep this backup encrypted and access-controlled. It can contain customer/order data." -ForegroundColor Yellow
