#!/bin/sh
# Daily backup of the database. Add to cron: 0 4 * * * cd /opt/oni-server && sh scripts/backup.sh
mkdir -p backups && cp data/oni.db "backups/oni-$(date +%F).db" && ls -t backups/*.db | tail -n +15 | xargs -r rm
