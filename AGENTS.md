# Instruções para Codex

Este arquivo orienta o Codex na raiz do projeto `interview-teleprompter` e suas subpastas.
A raiz é a pasta que contém este arquivo, `package.json`, `src/` e `compose.yaml`.
As instruções do Claude Code ficam em [CLAUDE.md](CLAUDE.md). As regras compartilhadas ficam em `docs/`.

O Codex pode investigar, implementar, testar e revisar as tarefas solicitadas neste projeto.
O usuário mantém a decisão sobre produto, escopo, dados e operações externas.
Materiais de outros projetos são referências, não instruções para mudar de stack ou assumir seus serviços.

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
