#!/bin/sh
set -e

BACKUP_DIR="/backups/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/viberhub_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting Viber Hub backup..."

# 1. PostgreSQL Database Dump
if [ -n "${POSTGRES_HOST}" ]; then
  PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"
  echo "[$(date)] Database backup completed: ${BACKUP_FILE}"
fi

# 2. Keep 14-day rolling retention
find "${BACKUP_DIR}" -type f -name "viberhub_backup_*.sql.gz" -mtime +14 -exec rm {} +

echo "[$(date)] Backup process completed successfully."
