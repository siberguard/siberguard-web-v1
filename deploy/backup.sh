#!/usr/bin/env bash
# Backup harian MongoDB + media. Disimpan di ./deploy/backups, dihapus setelah BACKUP_KEEP_DAYS hari.
set -euo pipefail
KEEP="${BACKUP_KEEP_DAYS:-14}"

run_backup() {
  local stamp
  stamp="$(date +%Y%m%d-%H%M)"
  echo "[backup] mulai ${stamp}"
  mongodump --uri="${MONGO_URI}" --db=soc-merdeka --gzip --archive="/backups/db-${stamp}.archive.gz"
  tar -czf "/backups/media-${stamp}.tar.gz" -C /media .
  find /backups -type f -mtime +"${KEEP}" -delete
  echo "[backup] selesai ${stamp}"
}

# "bash /backup.sh once" → satu kali backup lalu keluar.
if [ "${1:-}" = "once" ]; then
  run_backup
  exit 0
fi

while true; do
  run_backup || echo "[backup] GAGAL — periksa log"
  # Jalankan lagi pukul 02.00 WIB berikutnya.
  now=$(date +%s)
  next=$(date -d "tomorrow 02:00" +%s)
  sleep $((next - now))
done
