<#
UnivoHR Database Restore Script (PowerShell)
Usage: .\restore.ps1 -BackupFile "C:\backups\univohr_backup_20260101_120000.sql"
WARNING: This will DESTROY existing data in the target database!
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$BackupFile,
  [string]$Database = "univohr",
  [string]$Host = "localhost",
  [string]$Port = "5432",
  [string]$Username = "postgres",
  [switch]$Force
)

if (-not (Test-Path $BackupFile)) {
  Write-Host "ERROR: Backup file not found: $BackupFile"
  exit 1
}

# Handle .gz compressed files
$restoreFile = $BackupFile
if ($BackupFile -match '\.gz$') {
  $restoreFile = $BackupFile -replace '\.gz$', ''
  if (-not (Test-Path $restoreFile)) {
    if (Get-Command gzip -ErrorAction SilentlyContinue) {
      & gzip -d -k -f $BackupFile
      Write-Host "Decompressed: $restoreFile"
    } else {
      Write-Host "ERROR: Cannot decompress $BackupFile (gzip not found)"
      exit 1
    }
  }
}

if (-not $Force) {
  Write-Host "WARNING: This will COMPLETELY REPLACE all data in '$Database'!"
  Write-Host "Backup file: $restoreFile"
  $confirm = Read-Host "Type 'RESTORE' to confirm"
  if ($confirm -ne "RESTORE") {
    Write-Host "Cancelled."
    exit 0
  }
}

Write-Host "Restoring $restoreFile -> $Database@$Host`:$Port ..."

# Execute psql restore
& psql `
  --host $Host `
  --port $Port `
  --username $Username `
  --dbname $Database `
  --file $restoreFile `
  --echo-errors 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "SUCCESS: Database restored from $restoreFile"
  exit 0
} else {
  Write-Host "FAILED: See errors above"
  exit 1
}
