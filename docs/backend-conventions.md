# Convenções do backend

Siga [engineering-standards.md](engineering-standards.md) e o contrato em [api/README.md](api/README.md).

## Camadas

Route Handlers adaptam os parâmetros do Next.js e delegam aos controllers. Controllers leem JSON e
traduzem resultados em HTTP. Serviços validam entradas e coordenam casos de uso. Repositórios recebem
entradas validadas e cuidam de SQL e concorrência. Unidades de trabalho delimitam transações.

Os serviços usam interfaces de `domain`. Instâncias concretas são ligadas por `server/composition.ts`.
Não importe repositórios concretos em componentes ou regras de domínio. Não coloque SQL nos controllers.
Os tipos de domínio são atualmente também contratos tipados da API; não há DTO separado para cada
operação. Use projeções explícitas de campos e não exponha novas colunas por conveniência.

## Fronteiras

- Valide entradas com Zod e leia corpos com `readJson`, incluindo limite e verificação de origem existentes.
- Use consultas parametrizadas para valores. SQL estático de migração é código confiável do projeto.
- Toda operação de notas deve usar o `projectId` recebido e validar que os IDs pertencem àquele projeto.
- Edição e exclusão verificam `version`; conflitos não podem sobrescrever silenciosamente uma alteração.
- Não retorne erros internos do driver para o cliente. Preserve o tratamento centralizado de erros.
- Respostas de dados não são cacheadas. Não adicione cache que atravesse projetos ou preserve dados excluídos.
- Use o pool compartilhado. Escritas compostas devem usar a transação existente, sem commits parciais.

## Configuração e health

A aplicação recebe `DATABASE_URL` pelo ambiente. Scripts locais carregam `.env` por
`scripts/environment.ts`; Compose injeta as variáveis no container. Não copie credenciais para código
ou documentação. `GET /api/health` consulta a tabela `notes`: é uma verificação básica, não valida todas
as tabelas, recursos, recuperação de backup ou prontidão para publicação.

Importação, exportação e migração têm repositórios próprios. Os scripts cuidam apenas da leitura e
escrita de arquivos, composição e diagnóstico. Eventos de falha são registrados pelo helper
`server/logging/diagnostics.ts`; não passe mensagens brutas ou conteúdo a logs.

MCP tem fronteira própria em `server/mcp`, com autenticação antes de inicializar o SDK e limite de corpo
no transporte. Usa os mesmos contratos de notas e operações SQL, com autorização em `AutomationService`.
Não passe pelo `readJson` REST uma segunda vez: o transporte MCP precisa ler o JSON-RPC original.

## Automação e transações

`AutomationService` valida e autoriza chamadas. `AutomationOperationService` coordena lotes,
prévia de exclusão e restauração através das interfaces de `domain/automation/ports.ts`.
Modelos ficam em `models.ts`; esquemas de entrada e tipos inferidos ficam em `validation.ts`.
A composição injeta os serviços e adaptadores, sem dependência concreta entre serviços.

`PostgresAutomationUnitOfWork` fornece sessões com a mesma conexão para notas, histórico e planos
de exclusão. Escrita, histórico e idempotência são confirmados ou revertidos juntos. Consultas de
histórico, gravação de revisões restauradas e persistência dos planos têm adaptadores próprios.
`PostgresNoteQueries` aceita pool ou conexão para leitura; `PostgresNoteSession` exige `PoolClient`.
Seus chamadores devem abrir a transação antes de usá-la e nunca confirmar etapas intermediárias.

`AppError` carrega códigos de domínio (`not_found`, `conflict`, `forbidden`), sem números HTTP.
`server/http/error-status.ts` traduz esses códigos para REST e resultados MCP. `HttpError` fica na
fronteira para falhas de transporte e autenticação. Preserve os contratos de resposta existentes.
