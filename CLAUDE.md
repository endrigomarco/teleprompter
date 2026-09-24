# Instruções para Claude Code

Este arquivo orienta o Claude Code na raiz do projeto `interview-teleprompter` e suas subpastas.
As instruções específicas do Codex ficam em [AGENTS.md](AGENTS.md). Ambos seguem os padrões compartilhados em `docs/`.

O Claude Code pode investigar, implementar, testar e revisar as tarefas solicitadas neste projeto.
Não assuma que existem agentes, skills, comandos ou permissões provenientes de outro repositório.
Se receber um plano ou relatório de outro agente, confira sua relação com esta aplicação e valide as
alegações no código antes de continuar. Respeite pedidos explícitos para apenas planejar ou revisar.

## Leitura obrigatória

Antes de alterar o projeto, leia [README.md](README.md), [docs/README.md](docs/README.md),
[convenções do projeto](docs/project-conventions.md) e [padrões de engenharia](docs/engineering-standards.md).
Clean code, SOLID e responsabilidade única são requisitos para código novo e alterações.
Leia também os documentos de arquitetura, API, banco, testes, segurança e privacidade afetados pela tarefa.
Não substitua a leitura dos documentos por esta lista de links.

## Execução

- Inspecione o código e o estado atual antes de editar. Documentação e relatos não provam implementação.
- Implemente as tarefas solicitadas dentro do escopo autorizado. Pedidos de análise ou planejamento não autorizam implementação.
- Preserve comportamentos existentes e dados reais. Não use anotações pessoais como fixtures de teste.
- Mantenha regras compartilhadas em `docs/`, sem duplicá-las nos arquivos dos agentes.
- Faça mudanças pequenas e coesas. Não inclua refatorações, dependências ou funcionalidades alheias à tarefa.
- Registre divergências entre regras e código; não afirme conformidade integral sem revisar e validar.
- Resolva escolhas rotineiras e reversíveis com base no contexto. Peça esclarecimento apenas quando faltar uma decisão material.
- Não publique, exponha a aplicação na rede, envie dados a terceiros ou descarte dados sem autorização compatível com a ação.
- Siga [git-workflow.md](docs/git-workflow.md); não faça staging, commit ou push automaticamente.
- Não crie subagentes, integrações ou skills por supor que existem no projeto de referência.
- Não use travessões em textos produzidos. Use vírgulas, parênteses, dois-pontos ou pontos.

## Conclusão

Execute a validação pertinente em [testing.md](docs/testing.md), atualize a documentação responsável
pelo comportamento alterado e relate resultado, validações executadas e limitações reais.
Não diga que um teste passou se não foi executado. Uma verificação local não comprova prontidão para produção.
