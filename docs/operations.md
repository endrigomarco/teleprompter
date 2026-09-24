# Operação local

Execute os comandos na raiz do projeto, onde ficam `package.json` e `compose.yaml`.

## Requisitos

- Make para operação e validação em containers.
- Node.js 24 e Yarn somente para os comandos executados no computador.
- Docker com Docker Compose em execução.

## Iniciar para desenvolvimento

```sh
corepack enable
yarn install --immutable
cp .env.example .env
```

Se a pasta já veio com `.env`, mantenha esse arquivo. Para uma instalação nova, escolha uma senha local em `POSTGRES_PASSWORD` e use a mesma senha em `DATABASE_URL`. Não envie `.env` para um repositório público.

```sh
yarn setup
yarn dev
```

Abra http://localhost:8765. O PostgreSQL usa a porta local 55432 e um volume persistente do Docker. `yarn setup` inicia o banco, aplica as migrações e importa `data/initial-notes.json` uma única vez. Executá-lo novamente não duplica notas nem recria notas excluídas.

## Executar a versão compilada

Com o banco iniciado e migrado:

```sh
yarn build
yarn start
```

## Executar tudo no Docker

Pare o servidor Node da porta 8765 antes de usar este modo:

```sh
docker compose --profile full up -d --build --wait
```

O serviço `app` compila e executa Next.js; o serviço `db` executa PostgreSQL. A aplicação continua disponível em http://localhost:8765. As migrações e a importação inicial são executadas antes de iniciar a aplicação. A API não precisa de acesso a serviços externos.

```sh
docker compose --profile full down
```

Esse comando para os serviços e preserva os dados. Não use `down -v` se quiser manter o banco: essa opção apaga o volume.

## Backup e transferência

```sh
yarn db:export
```

Gera um JSON com todos os projetos, anotações, versões, ordem e projeto selecionado, em `backups/`. A importação inicial aceita esse formato e também o JSON legado. Para copiar o projeto para outro computador, copie a pasta sem `node_modules` e `.next`, junto de um backup recente. Em uma instalação nova e com banco vazio, use esse backup como `data/initial-notes.json` antes de executar `yarn setup`.

Para um backup completo do PostgreSQL, incluindo migrações e versões:

```sh
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/database.dump
```

A pasta `backups/` é criada sob demanda pelos comandos de exportação e backup e fica fora do Git.

A aplicação permanece local e sem publicação. A interface e a API REST continuam sem login. A estrutura está pronta para evoluir, mas acesso público e múltiplos usuários exigiriam uma etapa própria de autenticação e autorização.

## MCP

Execute `yarn mcp:setup` para gerar credenciais locais, depois reinicie o container da aplicação.
Configuração, conexão ao Codex e limites para VPS estão em [api/mcp.md](api/mcp.md).
O JSON exporta somente dados ativos. Preserve também o dump PostgreSQL para manter histórico de notas,
recuperação de exclusões e resultados idempotentes. Não sobrescreva a única cópia de segurança.

## Estrutura Docker e Makefile

O Compose principal continua na raiz para preservar os comandos existentes, o nome
`interview-teleprompter` e seu volume `postgres_data`. A estrutura de `anki-automation` serviu como
referência para separar responsabilidades, sem importar seus serviços ou regras de negócio.

- `docker/app/Dockerfile`: dependências, ferramentas, compilação e runtime.
- `docker/app/entrypoint.sh`: aplica migrações, executa seed idempotente e inicia o comando do app.
- `docker/compose.test.yaml`: runner e PostgreSQL descartável, sem acesso ao volume pessoal.
- `docker/backup.sh`: dump completo com nome único; remove arquivo parcial quando o dump falha.
- `.dockerignore`: lista permitida de arquivos; exclui dados pessoais, backups e segredos.

A imagem runtime não contém testes, documentação ou notas pessoais. Ainda contém dependências de
ferramentas necessárias à compilação TypeScript dos scripts de banco em execução (`tsx`), e não é uma
imagem com dependências estritamente de produção. O seed vem do bind mount somente leitura `./data`.
O diretório precisa existir. Após importar, o marcador evita ler o arquivo novamente.

`make help` lista todos os comandos. `make up` compila e aguarda saúde dos serviços; `make down`
preserva dados. `make restart` recria somente o app com as variáveis atuais, sem recompilar código.
`make db-migrate` e `make db-seed` escrevem no banco da aplicação. `make db-export` grava JSON no host.
`make db-backup` inicia o banco se necessário e grava dump completo em `backups/`, com permissão
restrita. O nome não precisa de extensão: `pg_restore` reconhece o formato custom do dump.

Para testes e validações, use `make check`. Requer Docker, Make e `.env` para validar a configuração
principal, mas não precisa de Node no computador. `make test`, `make typecheck`, `make format-check`
e `make integration-test` usam a imagem de ferramentas. Somente integração inicia o banco descartável.
O armazenamento desse banco é tmpfs, sem publicação de portas. A rotina remove os containers e a rede
de testes ao terminar; interrupção não capturável, como desligamento do computador, pode exigir:

```sh
docker compose --project-name interview-teleprompter-tests --project-directory . -f docker/compose.test.yaml down --remove-orphans
```

Não execute integrações simultâneas com esse nome de projeto fixo. `make install`, `make dev`,
`make format` e `make mcp-setup` continuam sendo comandos de desenvolvimento no computador e exigem
Node.js 24. `make dev` não para o app Docker automaticamente; libere a porta 8765 antes de usá-lo.
