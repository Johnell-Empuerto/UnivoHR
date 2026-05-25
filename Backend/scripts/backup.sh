#!/bin/bash
# UnivoHR Database Backup Script (Bash/Linux)
# Usage: ./backup.sh [output_dir] [database_name]
# Requires: pg_dump, gzip

OUTPUT_DIR="${1:-./backups}"
DATABASE="${2:-univohr}"
HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
USERNAME="${PGUSER:-postgres}"

mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="univohr_backup_${TIMESTAMP}.sql"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"
LOGPATH="${OUTPUT_DIR}/backup_${TIMESTAMP}.log"

echo "Starting backup: $DATABASE@$HOST:$PORT -> $FILEPATH"

pg_dump \
  --host "$HOST" \
  --port "$PORT" \
  --username "$USERNAME" \
  --dbname "$DATABASE" \
  --format plain \
  --no-owner \
  --no-privileges \
  --file "$FILEPATH" 2>"$LOGPATH"

if [ $? -eq 0 ]; then
  gzip -f "$FILEPATH"
  echo "SUCCESS: Backup compressed -> ${FILEPATH}.gz"
  # Cleanup backups older than 30 days
  find "$OUTPUT_DIR" -name "univohr_backup_*.sql*" -mtime +30 -delete
  exit 0
else
  echo "FAILED: See $LOGPATH for details"
  exit 1
fi
