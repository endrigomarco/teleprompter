# Apoio de entrevista

O projeto foi migrado para React, TypeScript, Next.js e PostgreSQL local no Docker.

Consulte [README.md](README.md) para iniciar, fazer backup e entender a arquitetura.

- Desenvolvimento: `yarn setup` e `yarn dev`.
- Tudo no Docker: `docker compose --profile full up -d --build --wait`.
- Endereço: http://localhost:8765.
- Backup das anotações: `yarn db:export`.

Não é mais necessário executar `server.py`. A versão antiga está preservada em `backups/legacy-before-refactor.tar.gz`.
