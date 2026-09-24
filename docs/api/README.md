# Contrato da API local

O [MCP autenticado](mcp.md) tem endpoint e contrato próprios.

API REST JSON, sem autenticação. Não é um contrato para publicação ou múltiplos usuários.
Rotas implementadas em `src/app/api`. Respostas de dados usam `Cache-Control: no-store`.

## Notas

Todas as rotas exigem `?projectId=<id>`. Um projeto ausente ou inexistente resulta em 404.

| Método | Rota               | Entrada                       | Resultado               |
| ------ | ------------------ | ----------------------------- | ----------------------- |
| GET    | `/api/notes`       | Query do projeto              | Array de notas ordenado |
| POST   | `/api/notes`       | NoteDraft                     | Nota criada, 201        |
| PUT    | `/api/notes/:id`   | NoteDraft + version           | Nota atualizada         |
| DELETE | `/api/notes/:id`   | `{ "version": 1 }`            | `{ "ok": true }`        |
| PUT    | `/api/notes/order` | `{ "ids": ["id-a", "id-b"] }` | Array reordenado        |

`NoteDraft` contém `title`, `description`, `tags` e `content`, todos obrigatórios no payload.
Título é aparado, não vazio e limitado a 200 caracteres. Descrição até 2000, conteúdo até 100000.
Tags são aparadas, vazias removidas e duplicatas eliminadas; o schema limita cada tag, quantidade e
soma de comprimentos a 2000. Conteúdo e descrição podem ser vazios.

Uma nota retornada acrescenta `id`, `position` e `version`. Edição e exclusão exigem versão inteira
positiva. A ordenação exige todos os IDs do projeto exatamente uma vez. Alterar a ordem não muda o texto.

## Projetos

| Método | Rota                      | Entrada                                              |
| ------ | ------------------------- | ---------------------------------------------------- |
| GET    | `/api/projects`           | Nenhuma                                              |
| POST   | `/api/projects`           | `{ "title": "Projeto", "description": "Descrição" }` |
| PUT    | `/api/projects/:id`       | Título, descrição e version                          |
| DELETE | `/api/projects/:id`       | `{ "version": 1 }`                                   |
| PUT    | `/api/projects/selection` | `{ "id": "id-do-projeto" }`                          |

Todas retornam `ProjectState`: `{ projects: Project[], selectedProjectId: string | null }`.
Criação usa 201; demais sucessos usam 200. `Project` contém `id`, `title`, `description`, `version` e
`noteCount`. Título aparado de 1 a 200 caracteres; descrição aparada até 2000. Criar também seleciona.
Excluir remove as notas associadas e atualiza a seleção quando necessário.

## Erros e health

Corpos de mutação devem ser JSON. A leitura limita o corpo a 600000 bytes e verifica `Origin` quando
presente, recusando também origens malformadas. Erros dos controllers usam `{ "error": "mensagem" }`.

| Status | Significado                                            |
| ------ | ------------------------------------------------------ |
| 400    | JSON ou campos inválidos                               |
| 403    | Origem enviada não permitida                           |
| 404    | Projeto ou anotação não encontrado no escopo           |
| 409    | Versão ou lista mudou                                  |
| 413    | Corpo muito grande                                     |
| 415    | Content-Type não é JSON                                |
| 503    | Falha inesperada, incluindo indisponibilidade de banco |

`GET /api/health` retorna `{ "status": "ok" }` ou 503 com `{ "status": "unavailable" }`.
Consulta apenas `notes`; não é validação completa das funcionalidades.

Ao alterar uma rota, mantenha este contrato, tipos de domínio, cliente HTTP e testes coerentes.

O cliente valida as respostas antes de atualizar estado. Payload incompatível ou JSON inválido resulta
em erro visível, sem aplicar dados parcialmente interpretados.
