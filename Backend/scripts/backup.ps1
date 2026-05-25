<# 
UnivoHR Database Backup Script (PowerShell)
Usage: .\backup.ps1 [-OutputDir "C:\backups"] [-Database "univohr"]
Requires: pg_dump in PATH
#>

param(
  [string]$OutputDir = ".\backups",
  [string]$Database = "univohr",
  [string]$Host = "localhost",
  [string]$Port = "5432",
  [string]$Username = "postgres"
)

# Ensure backup directory exists
if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "univohr_backup_$timestamp.sql"
$filepath = Join-Path $OutputDir $filename
$logpath = Join-Path $OutputDir "backup_$timestamp.log"

Write-Host "Starting backup: $Database@$Host`:$Port -> $filepath"

# Execute pg_dump
& pg_dump `
  --host $Host `
  --port $Port `
  --username $Username `
  --dbname $Database `
  --format plain `
  --no-owner `
  --no-privileges `
  --file $filepath 2>&1 | Out-File $logpath

if ($LASTEXITCODE -eq 0) {
  # Compress
  $archive = "$filepath.gz"
  if (Get-Command gzip -ErrorAction SilentlyContinue) {
    & gzip -f $filepath
    Write-Host "SUCCESS: Backup compressed -> $archive"
  } else {
    Write-Host "SUCCESS: Backup saved -> $filepath"
  }

  # Cleanup backups older than 30 days
  Get-ChildItem $OutputDir -Filter "*.sql*" | Where-Object {
    $_.LastWriteTime -lt (Get-Date).AddDays(-30)
  } | Remove-Item -Force

  exit 0
} else {
  Write-Host "FAILED: See $logpath for details"
  exit 1
}
