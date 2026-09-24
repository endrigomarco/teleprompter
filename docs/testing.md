# Testes e validação

## Ferramentas e comandos existentes

Execute os comandos na raiz do projeto. Node Test Runner com `tsx` executa os testes TypeScript.

| Comando                 | O que verifica                                                        |
| ----------------------- | --------------------------------------------------------------------- |
| `yarn typecheck`        | TypeScript, sem executar a aplicação                                  |
| `yarn test`             | `tests/*.test.ts`, domínio, contratos, diagnósticos e fronteiras      |
| `yarn check`            | Typecheck e testes sem banco                                          |
| `yarn test:integration` | `tests/*.integration.ts`, controllers e repositórios com PostgreSQL   |
| `yarn build`            | Compilação Next.js                                                    |
| `yarn format:check`     | Formatação de código, configuração e documentação incluídos no script |

`yarn format` modifica arquivos. Não o use para incluir reformatação alheia ao escopo.
Não há ESLint, comando de cobertura, meta de 100% ou suíte de navegador automatizada instalada.

## Critérios proporcionais

- Domínio: testes de comportamento, limites, regressões e preservação dos textos.
- API, banco ou projetos: integração, incluindo isolamento entre projetos, versão, rollback e ordenação.
- Migração: base preenchida e preservação dos dados, além de base vazia quando pertinente.
- Interface: TypeScript/build quando pertinente e verificação visual e de interação no navegador local.
- Documentação: conferir comandos, links, consistência e formatação. Não reinicie Docker nem execute migrações por causa de Markdown.

Não crie testes que apenas repetem a implementação ou contagens arbitrárias de componentes.
Não amplie a execução de testes sem mudança, falha ou risco que justifique a ampliação.

## Isolamento e limites da evidência

Os testes de integração criam um schema com nome aleatório, aplicam migrações e removem apenas esse
schema ao terminar. Precisam do PostgreSQL local e de permissão para criar schema. A URL de conexão
vem do ambiente; confirme que aponta ao banco local correto sem imprimir credenciais.

A suíte cobre busca, Unicode, formatação, reordenação, CRUD, conflitos e isolamento de projetos.
Ela chama controllers diretamente, não comprova sozinha o transporte HTTP real do Next.js nem a UI.
Testes locais não devem acessar serviços externos ou usar conteúdo pessoal como fixture.

O relatório final deve dizer quais verificações foram executadas, resultados e o que ficou sem
validação. Passar TypeScript não prova comportamento; screenshots não provam persistência.

## Verificações adicionadas na adequação

`architecture.test.ts` inspeciona imports estáticos, exports e imports dinâmicos literais com a API
TypeScript. Não permite `any` explícito ou asserção não nula em `src`. É uma proteção de fronteiras,
não um analisador completo de semântica, casts, aliases em runtime ou responsabilidade única.

`contracts.test.ts` valida respostas HTTP, payloads malformados, origem, media type, importação literal
e ausência de mensagens sensíveis nos diagnósticos próprios. O fetch é simulado nesses testes.
`backup.integration.ts` executa migrações e roundtrip de backup em schema temporário, incluindo rollback
e marcador de importação. Nenhum desses testes lê as anotações pessoais.

`error-boundaries.test.ts` verifica que erros de domínio e transporte mantêm os status e mensagens
contratados tanto na REST quanto nos resultados MCP.

## MCP

`mcp.test.ts` verifica configuração fechada, Bearer, origem, Host, patches estritos e limites.
`mcp.integration.ts` usa schema temporário para migração de base preenchida, rollback de lote/histórico,
idempotência, conflitos, escopo, prévia expirada/consumida, novas notas fora da prévia, restauração,
reordenação e revisões da UI. O cliente oficial MCP exercita initialize, tools/list e tools/call pelo
handler HTTP real com transporte fetch local substituído, inclusive credencial somente leitura.
O teste automatizado não comprova proxy HTTPS, VPS ou carregamento das ferramentas no Codex Desktop.

## Validação pelo Makefile

`make check` (ou `make check-all`) executa em sequência a validação de Compose, testes sem banco,
TypeScript, formatação, integração e build da imagem runtime. As etapas de qualidade usam o estágio
`tools` do Dockerfile e não dependem de Node instalado no computador. Os scripts Yarn mantêm seus
comportamentos e continuam disponíveis para desenvolvimento local.

`make integration-test` usa `docker/compose.test.yaml`, com PostgreSQL próprio em tmpfs, credenciais
sintéticas, nenhuma porta publicada e nenhum volume da aplicação. Os testes ainda criam schemas
isolados dentro desse banco. O alvo tenta remover o ambiente descartável tanto no sucesso quanto
na falha. Não execute duas instâncias ao mesmo tempo, pois o projeto Compose de testes tem nome fixo.

Para alterar a infraestrutura, confira `make config`, sintaxe dos scripts shell, build dos estágios,
integração, ausência de segredos/dados pessoais na imagem e preservação do volume da aplicação.
