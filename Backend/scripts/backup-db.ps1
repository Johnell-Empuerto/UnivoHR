<#
.SYNOPSIS
  Smart HRMS Database Backup Script
.DESCRIPTION
  Creates a timestamped pg_dump backup of the database.
  Reads credentials from environment variables or .env file.
  Saves to Backend/database/backups/.
.USAGE
  .\scripts\backup-db.ps1
  $env:DB_PASSWORD="secret"; .\scripts\backup-db.ps1
#>

$ErrorActionPreference = "Stop"

# --- Load .env if available ---
$envPath = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    if ($_ -match "^\s*([^#=]+)=(.*)\s*$") {
      $key = $matches[1].Trim()
      $val = $matches[2].Trim()
      if (-not [string]::IsNullOrEmpty($val)) {
        Set-Item -Path "env:$key" -Value $val -ErrorAction SilentlyContinue
      }
    }
  }
  Write-Host "[INFO] Loaded environment from .env"
}

# --- Required variables ---
$dbHost = $env:DB_HOST
$dbPort = $env:DB_PORT
$dbUser = $env:DB_USER
$dbPass = $env:DB_PASSWORD
$dbName = $env:DB_NAME

if (-not $dbHost)   { $dbHost = "localhost" }
if (-not $dbPort)   { $dbPort = "5432" }
if (-not $dbUser)   { $dbUser = "postgres" }
if (-not $dbName)   { $dbName = "smart_hrms_attendance" }

if (-not $dbPass) {
  Write-Host "WARNING: DB_PASSWORD not set. pg_dump may prompt for password."
}

# --- Backup directory ---
$backupDir = Join-Path $PSScriptRoot ".." "database" "backups"
$backupDir = Resolve-Path $backupDir -ErrorAction SilentlyContinue
if (-not $backupDir) {
  $backupDir = Join-Path $PSScriptRoot ".." "database" "backups"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  Write-Host "[INFO] Created backup directory: $backupDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "backup_$timestamp.sql"
$filepath = Join-Path $backupDir $filename

Write-Host "========================================"
Write-Host "  Smart HRMS Database Backup"
Write-Host "========================================"
Write-Host "  Host    : $dbHost`:$dbPort"
Write-Host "  Database: $dbName"
Write-Host "  User    : $dbUser"
Write-Host "  Output  : $filepath"
Write-Host "========================================"

# --- Set PGPASSWORD and run pg_dump ---
$env:PGPASSWORD = $dbPass

try {
  & pg_dump `
    --host $dbHost `
    --port $dbPort `
    --username $dbUser `
    --dbname $dbName `
    --format plain `
    --no-owner `
    --no-privileges `
    --verbose `
    --file $filepath 2>&1

  if ($LASTEXITCODE -eq 0) {
    $fileInfo = Get-Item $filepath
    $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "========================================"
    Write-Host "  SUCCESS"
    Write-Host "  File : $filepath"
    Write-Host "  Size : $sizeMB MB"
    Write-Host "  Time : $timestamp"
    Write-Host "========================================"
    exit 0
  } else {
    Write-Host "ERROR: pg_dump failed with exit code $LASTEXITCODE"
    exit 1
  }
} catch {
  Write-Host "ERROR: $_"
  Write-Host "HINT: Ensure pg_dump is installed and in your PATH."
  Write-Host "      Download from: https://www.postgresql.org/download/"
  exit 1
} finally {
  Remove-Item -Path "env:PGPASSWORD" -ErrorAction SilentlyContinue
}
