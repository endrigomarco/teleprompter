# Apoio de entrevista

O projeto foi migrado para React, TypeScript, Next.js e PostgreSQL local no Docker.

Consulte [README.md](README.md) para iniciar, fazer backup e entender a arquitetura.

- Desenvolvimento: `yarn setup` e `yarn dev`.
- Tudo no Docker: `docker compose --profile full up -d --build --wait`.
- Endereço: http://localhost:8765.
- Backup das anotações: `yarn db:export`.

A aplicação atual usa Next.js. Não é necessário executar `server.py`.
