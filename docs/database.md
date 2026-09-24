# Banco de dados

PostgreSQL local no Docker, acessado pelo driver `pg`. O schema é definido pelas migrações SQL em
[migrations](../migrations), aplicadas por `scripts/migrate.ts`.

## Modelo

| Tabela              | Finalidade e invariantes                                                                |
| ------------------- | --------------------------------------------------------------------------------------- |
| `projects`          | ID textual, título obrigatório, descrição, versão positiva e data de criação            |
| `notes`             | Título, descrição, conteúdo, tags, posição, versão, datas e FK obrigatória para projeto |
| `app_settings`      | Uma linha com `singleton=true`, projeto selecionado ou `NULL`                           |
| `schema_migrations` | Registra nomes das migrações aplicadas                                                  |
| `data_imports`      | Marca importação inicial já realizada                                                   |

A FK de notas usa `ON DELETE CASCADE`. A seleção usa `ON DELETE SET NULL`; o repositório escolhe outro
projeto na mesma transação quando necessário. A posição é não negativa e única por projeto, com
constraint diferida para permitir reordenação. A exclusão de uma nota recompõe posições desse projeto.
IDs legados são preservados; novos registros usam `randomUUID()`. Não converta o tipo textual por
supor que todo ID antigo é UUID.

## Concorrência

O helper de transação aplica uma advisory lock por schema, compartilhada pelas operações que o usam.
É uma serialização deliberada para esta pequena coleção. Versões detectam conflitos de edição e
exclusão. A ordenação exige a lista completa de IDs do projeto, sem duplicatas ou IDs de outro projeto.
A ordem muda sem incrementar a versão de conteúdo das notas.

## Migrações e importação

`001_notes.sql` criou a coleção original; `002_projects.sql` criou projetos e relacionou as notas
existentes a Interview Copilot. Não reescreva migrações aplicadas. Acrescente uma nova migração,
considere bases vazias e preenchidas, teste em schema isolado e preserve IDs, conteúdo, tags e ordem.
O runner registra nomes, não checksums, e não fornece rollback automático de schema.

A importação é executada uma vez, registrada como `legacy-json-v1`, e aceita JSON legado ou backup
`teleprompter-projects-v1`. O marcador impede recriar registros excluídos em reinícios.
Não remova o marcador ou limpe tabelas como solução para falhas de inicialização.

## Dados reais

Antes de mudança de schema que afete dados, faça backup pertinente e planeje recuperação.
Testes usam schemas temporários, não a coleção pessoal. Projetos não implementam multi-tenancy seguro.
Exclusões removem notas do banco ativo, mas mantêm snapshots no histórico. Backups e JSON inicial também permanecem.
Comandos e transferência estão em [operations.md](operations.md).

## Histórico e automação

`003_note_history_mcp.sql` registra baseline das notas atuais sem modificá-las e cria:

- `note_history`: snapshots completos, operação, identidade técnica e data, sem FK em cascata.
- `mcp_requests`: resultados e hash de argumentos para idempotência por credencial e requestId.
- `mcp_deletion_plans`: projeto, IDs/versões congelados, expiração e consumo da prévia.

Triggers de INSERT/UPDATE/DELETE registram mudanças de conteúdo feitas por UI ou MCP na mesma
transação. Mudanças apenas de posição não criam revisão. A identidade MCP vem de `set_config` local
à transação; outras escritas usam `local-ui-or-database`, que não identifica uma pessoa autenticada.
TRUNCATE e alterações por administrador que desabilite triggers não são auditados por esse mecanismo.
O histórico é operacional, não um registro inviolável contra administradores do banco.

Histórico e resultados idempotentes não têm expiração automática. Planos expirados há mais de um dia
são removidos ao preparar uma nova exclusão. Restaurar uma nota excluída incrementa a maior versão
histórica e insere no final da ordem, desde que o projeto exista. Excluir projeto mantém os snapshots,
mas recuperação do projeto depende de backup. Veja [MCP](api/mcp.md).

O backup JSON v1 contém apenas projetos e notas ativos. Para preservar histórico, prévias e chaves de
idempotência, use o dump completo do PostgreSQL. Importar JSON em uma base nova inicia outro histórico.
