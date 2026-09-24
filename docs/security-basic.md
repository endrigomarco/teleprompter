# Segurança básica

Em cada mudança de código, revise os riscos que ela altera. A avaliação deve ser proporcional,
sem transformar um ajuste visual em auditoria completa.

## Limite atual

A interface e a API REST são locais e sem autenticação. O endpoint MCP exige Bearer. Compose publica app e banco em `127.0.0.1`; o bind em
`0.0.0.0` do Next.js ocorre dentro do container. Isso reduz exposição, mas não autentica pessoas ou
processos locais. Projetos não são contas nem fronteiras de autorização.
Não publique nem amplie interfaces de rede como efeito colateral de uma tarefa.

## Regras obrigatórias

- Não registrar ou versionar senhas, tokens, `.env` ou backups pessoais.
- Parametrizar SQL, validar entradas e manter limites de corpo, campos e tags.
- Preservar isolamento por projeto e verificação de versão em mutações.
- Manter texto do usuário como texto na renderização, incluindo busca e destaque.
- Não expor stack traces, SQL ou credenciais nas respostas.
- Manter confirmações de exclusão e proteger dados durante migração.
- Não adicionar serviços externos ou telemetria que recebam notas sem autorização.

`readJson` confere a origem quando ela é enviada, exige JSON e limita o corpo a 600000 bytes.
Não é autenticação, e chamadas sem `Origin` são aceitas. Origens malformadas são recusadas com 403.
Falhas próprias registram apenas código de evento, nível e horário, sem mensagens internas.
Isso não constitui redação dos logs de Next.js, PostgreSQL ou Docker.

Antes de uso público, autenticação, autorização, proteção de requisições, logs e operação precisam
ser definidos e validados em tarefa própria. Esta documentação não aprova essa mudança de escopo.
Dados e cópias estão descritos em [privacy-and-data-protection.md](privacy-and-data-protection.md).

## Fronteira MCP

[MCP](api/mcp.md) verifica Bearer, escopo de projeto, permissão de escrita, Host e Origin, com comparação
de hash do token em tempo constante. Configuração inválida fecha o endpoint. A consulta de ferramentas
é autenticada. Corpo limitado a 2 MiB e schemas estritos limitam lotes e rejeitam campos extras.
Prévias de exclusão são vinculadas à credencial, versão, projeto e prazo; confirmação humana permanece
responsabilidade do cliente. A REST local mantém suas confirmações pela UI e não usa prévias MCP.
O endpoint não aceita SQL ou instruções arbitrárias. Texto recuperado não deve virar instrução do agente.
Bearer não protege a interface nem outras rotas. Publicação só do caminho MCP e operação remota estão
descritas em seu contrato; não há rate limiting no processo ou autorização multiusuário.
