# Convenções do projeto

## Idioma e nomes

- Comunicação, documentação e interface em português, seguindo o projeto atual.
- Identificadores TypeScript e campos da API em inglês. Arquivos em kebab-case, componentes em PascalCase e hooks com prefixo `use`.
- Preserve literalmente o idioma e o texto das anotações do usuário. Não traduza conteúdo ao refatorar.
- Não use travessões ou emojis em nova documentação. Ícones funcionais existentes na interface podem ser mantidos.
- Use links relativos entre arquivos para permitir mover a pasta do projeto.

## Organização

O projeto é uma aplicação Next.js com frontend e backend na mesma raiz, não um monorepo.
O índice em [README.md](README.md) define qual documento é responsável por cada assunto.
`AGENTS.md` e `CLAUDE.md`, na raiz, orientam seus respectivos agentes e apontam para estas regras.
Detalhes compartilhados não devem ser duplicados nos dois arquivos de agentes.

O README da raiz apresenta o projeto e aponta para `docs/`. Regras de engenharia não são histórico
de implementação. Os dois overviews registram decisões e estado do produto, cada um sob sua perspectiva.
Comandos devem corresponder a `package.json` e `compose.yaml`. Não invente scripts de lint, cobertura ou deploy.

## Manutenção

- Atualize o documento responsável na mesma mudança que alterar um comportamento ou decisão.
- Diferencie implementado, proposto, não verificado e decisão do usuário.
- Não transforme a documentação em transcrição de conversas ou em planos de recursos não solicitados.
- Regras novas orientam as próximas mudanças. Pendências anteriores devem ser identificadas, sem refatoração geral automática.
- Adoção de uma dependência ou mudança de arquitetura exige justificativa e registro em [technical-overview.md](technical-overview.md).
- Formate Markdown com os comandos do projeto e confira os links locais.

## Overviews como documentos vivos

`product-overview.md` registra problema, experiência, capacidades, decisões e limites de produto.
`technical-overview.md` registra componentes, fronteiras, persistência, integrações, execução e evidências.
Ambos devem permitir recuperar o contexto sem acesso às conversas. Atualize-os junto da mudança que
alterar o estado descrito; mantenha comandos detalhados e contratos nos documentos responsáveis.

Distinga implementação disponível, capacidade parcial, intenção declarada e decisão em aberto.
Ao registrar evidência, informe o ambiente e o que realmente foi validado. Não transforme uma execução
antiga em garantia atual, uma proposta em escopo aprovado ou uma referência externa em requisito.
Prefira substituir trechos desatualizados a acumular um diário de incrementos ou transcrições.

## Gerenciador de pacotes

Use Yarn 4.9.2, fixado em `packageManager`, via Corepack. O único lockfile é `yarn.lock`.
Instalações reproduzíveis usam `yarn install --immutable`; alterações de dependências usam
`yarn add` ou `yarn remove` e incluem o lockfile atualizado. Não gere `package-lock.json`.
O linker `node-modules` preserva a integração atual com Next.js, scripts e Docker.
