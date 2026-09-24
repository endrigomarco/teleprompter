#!/bin/sh
set -eu
umask 077
mkdir -p backups
backup="$(mktemp "backups/database-$(date -u +%Y-%m-%dT%H-%M-%SZ)-XXXXXX")"
trap 'rm -f "$backup"' EXIT
trap 'exit 1' HUP INT TERM
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup"
trap - EXIT
printf 'Backup completo salvo em %s\n' "$backup"
