# MCP de anotações

Endpoint implementado: `POST /api/mcp`, no mesmo Next.js. Usa o SDK oficial
`@modelcontextprotocol/sdk` 1.30.1, JSON-RPC e Streamable HTTP sem sessão, com respostas JSON.
O SDK negocia a versão do protocolo na inicialização. GET e DELETE autenticados retornam 405,
pois não existe stream persistente nem sessão para encerrar. Nenhuma chamada à OpenAI é feita pelo backend.

O assistente interpreta o pedido, consulta ferramentas e envia argumentos estruturados. O servidor
valida autorização, contratos, versões e transações. Texto das notas é dado, nunca instrução de sistema.
Não há ferramenta de SQL arbitrário. CRUD de projetos continua disponível na interface local;
o MCP lista os projetos e gerencia suas notas.

## Configurar localmente

Na raiz, com `.env` existente:

```sh
yarn mcp:setup
docker compose --profile full up -d --build --wait
```

O setup gera tokens aleatórios de escrita e leitura em `.env`, com permissão 600, sem imprimi-los.
Preserva valores já preenchidos. Não altera a configuração global do Codex. O endpoint retorna 503
quando a configuração está ausente ou inválida, 401 para token inválido e 403 para host/origem indevidos.

| Variável              | Uso                                                      |
| --------------------- | -------------------------------------------------------- |
| `MCP_SERVER_URL`      | URL exata, inicialmente `http://localhost:8765/api/mcp`  |
| `MCP_ACCESS_TOKEN`    | Bearer de leitura e escrita, pelo menos 32 caracteres    |
| `MCP_READ_ONLY_TOKEN` | Bearer opcional, diferente, somente leitura              |
| `MCP_PROJECT_IDS`     | IDs autorizados separados por vírgula, ou `*` para todos |

Ambos os tokens usam o mesmo escopo de projetos. A credencial de leitura não recebe ferramentas de
escrita, e a camada de serviço também recusa mutações. A identidade de auditoria é um hash do token,
sem guardar seu valor. Trocar um token exige reiniciar o app e atualizar o cliente. A identidade muda:
prévias e chaves de idempotência da credencial antiga não migram. Não repita uma criação antiga com
nova credencial sem conferir o estado atual.

## Conectar no Codex

Exemplo para o `config.toml` do Codex, sem segredos:

```toml
[mcp_servers.interview_copilot]
url = "http://localhost:8765/api/mcp"
bearer_token_env_var = "INTERVIEW_COPILOT_TOKEN"
```

A variável `INTERVIEW_COPILOT_TOKEN` precisa estar disponível no processo que executa o Codex, com o
valor de `MCP_ACCESS_TOKEN` ou de `MCP_READ_ONLY_TOKEN`. O `.env` desta aplicação não é carregado
automaticamente pelo Codex. Não cole o token em mensagens nem em arquivos versionados.
Recarregue a conexão após configurá-la e confirme que `list_projects` aparece.
As opções `url` e `bearer_token_env_var` seguem a
[documentação oficial do OpenAI Docs](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
Esta implementação foi testada com o cliente do SDK MCP; a conexão nesta instalação do Codex
não é feita pelo script de setup.

## Ferramentas

| Ferramenta              | Comportamento                                                            |
| ----------------------- | ------------------------------------------------------------------------ |
| `list_projects`         | IDs, títulos, descrições, versões e quantidades, limitados ao escopo     |
| `search_notes`          | Busca por projeto, resumo paginado, tolerância a acentos e erros simples |
| `get_note`              | Conteúdo completo e versão atual                                         |
| `create_notes`          | Lista de 1 a 50 rascunhos, transação única                               |
| `update_notes`          | Lista de 1 a 50 patches, com versão esperada por nota                    |
| `reorder_notes`         | Todos os IDs atuais exatamente uma vez                                   |
| `prepare_note_deletion` | Prévia por IDs ou `all=true`, validade de 10 minutos                     |
| `execute_note_deletion` | Executa a prévia confirmada, validando todas as versões                  |
| `list_deleted_notes`    | Lista notas excluídas com ID e revisão para recuperação                  |
| `note_history`          | Histórico paginado, incluindo conteúdo e autoria técnica                 |
| `restore_note`          | Restaura uma revisão, com controle de versão atual                       |

Busca usa `offset` e `limit` de até 100, com resumo de até 300 caracteres de conteúdo por nota.
Histórico e excluídas usam `limit` até 100 e `beforeRevisionId` da última linha recebida.
Chamadas têm limite de 2 MiB de corpo. Lotes grandes em texto podem precisar ser separados,
mesmo abaixo de 50 notas. A atomicidade vale por chamada, não entre chamadas separadas.

## Exemplo de edição

Argumentos de `update_notes`:

```json
{
  "projectId": "interview-copilot",
  "requestId": "82357ef3-57a6-4501-a2d6-40c8a252ae35",
  "items": [
    {
      "noteId": "id-obtido-na-busca",
      "expectedVersion": 3,
      "changes": { "description": "Nova descrição" }
    },
    {
      "noteId": "outro-id",
      "expectedVersion": 2,
      "changes": { "tags": ["usando", "liderança"] }
    }
  ]
}
```

Campos omitidos permanecem intactos; `tags` substitui a lista inteira. O assistente deve ler as tags
atuais antes de adicionar uma. Se qualquer item falhar, nada do lote é persistido, inclusive histórico.
Conflitos retornam erro de ferramenta com status 409; leia novamente antes de decidir outro patch.

Criação, edição, ordem, execução da exclusão e restauração exigem `requestId` UUID.
A mesma credencial, chave e argumentos retornam o resultado original sem repetir efeitos.
Reutilizar a chave com outros argumentos ou outra ferramenta retorna 409. Falhas não gravam resultado.
As chaves persistem no PostgreSQL, inclusive após reiniciar a aplicação.

## Exclusão e recuperação

1. Resolva o projeto pelo ID, sem adivinhar por nomes ambíguos.
2. Chame `prepare_note_deletion` com `noteIds`, ou `all=true`.
3. Mostre ao usuário o projeto, a quantidade e os itens da prévia. Aguarde confirmação explícita.
4. Chame `execute_note_deletion` com `projectId`, `confirmationToken` e `requestId` novo.

O token é vinculado à credencial e ao projeto. Expira em 10 minutos e só pode ser consumido uma vez,
exceto retry idempotente da mesma chamada. Novas notas não são incluídas silenciosamente. Se uma nota
prevista mudar ou desaparecer, toda a exclusão falha. Gere nova prévia para um novo conjunto.
A confirmação humana é uma regra do assistente/cliente. O backend verifica o token da prévia,
mas não comprova criptograficamente que uma pessoa confirmou a conversa.

Para recuperar, use `list_deleted_notes`, opcionalmente `note_history`, e `restore_note` com a revisão.
Use `expectedVersion: null` para nota excluída; para nota ativa, use sua versão atual.
Uma nota excluída volta ao fim da lista com o mesmo ID e versão maior. A restauração de nota ativa
preserva a posição. O projeto deve continuar existindo. Restaurar projeto excluído exige backup;
não há ferramenta MCP para restaurar projetos. Não há tela de histórico nesta entrega.

## Publicação futura no VPS

A implementação e os testes desta entrega são locais. Não há URL pública configurada.
No VPS, use HTTPS com proxy reverso, `MCP_SERVER_URL` correspondente e tokens próprios do ambiente.
Preserve `Host` original e `Authorization` no proxy. Defina limites de requisição e taxa no proxy.
O servidor rejeita origens diferentes da URL configurada quando `Origin` é enviado.

Publique somente o caminho exato `/api/mcp`. A interface e as demais rotas REST continuam sem login
próprio: mantenha-as privadas, por exemplo acessíveis por túnel SSH, ou adicione autenticação dedicada
antes de publicá-las. O PostgreSQL permanece privado. Não encaminhe todo o Next.js para a internet
supondo que o Bearer do MCP protege as demais rotas. Não há OAuth, contas, revogação por usuário ou
rate limiting distribuído implementados. Este MCP atende um operador com tokens pré-configurados.

As notas consultadas entram no contexto do cliente de IA. O backend não envia dados espontaneamente
nem usa chave da OpenAI, mas as políticas de dados do cliente/provedor escolhido se aplicam.
Após mutação externa, recarregue a interface para atualizar a lista; não há sincronização ao vivo.
