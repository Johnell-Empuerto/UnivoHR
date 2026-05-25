#!/bin/bash
# UnivoHR Database Restore Script (Bash/Linux)
# Usage: ./restore.sh <backup_file> [database_name]
# WARNING: This will DESTROY existing data in the target database!

set -e

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: Usage: $0 <backup_file> [database_name]"
  exit 1
fi

DATABASE="${2:-univohr}"
HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
USERNAME="${PGUSER:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  RESTORE_FILE="${BACKUP_FILE%.gz}"
  if [ ! -f "$RESTORE_FILE" ]; then
    gunzip -k "$BACKUP_FILE"
    echo "Decompressed: $RESTORE_FILE"
  fi
fi

echo "WARNING: This will COMPLETELY REPLACE all data in '$DATABASE'!"
echo "Backup file: $RESTORE_FILE"
read -rp "Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Cancelled."
  exit 0
fi

echo "Restoring $RESTORE_FILE -> $DATABASE@$HOST:$PORT ..."
psql --host "$HOST" --port "$PORT" --username "$USERNAME" --dbname "$DATABASE" --file "$RESTORE_FILE" --echo-errors
echo "SUCCESS: Database restored from $RESTORE_FILE"
