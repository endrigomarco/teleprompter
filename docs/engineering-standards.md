# Padrões de engenharia

Leitura obrigatória para qualquer criação, edição ou revisão de código. Estes padrões se aplicam a
pessoas e agentes. Clean code e SOLID devem orientar a implementação, com responsabilidade única como
prioridade. O objetivo é código claro e coeso, sem criar camadas ou abstrações apenas para cumprir um desenho.

## Regras e orientações

As regras de integridade, segurança e separação de camadas são obrigatórias. Limites de tamanho são
sinais de revisão, não métricas automáticas de qualidade. Desvios de orientação precisam de justificativa
concreta; mudanças duradouras devem ser registradas na arquitetura. Não use uma exceção para enfraquecer
validação, isolamento entre projetos ou proteção de dados.

## Clean code

### Nomes e funções

- Use nomes descritivos, substantivos para entidades e verbos para ações. Evite abreviações obscuras.
- Prefira funções com uma responsabilidade e poucos parâmetros. Agrupe entradas relacionadas em um objeto tipado quando melhorar a leitura.
- Prefira retornos antecipados a condicionais profundas.
- Uma função acima de aproximadamente 50 linhas ou um arquivo acima de 300 linhas pede revisão de coesão. Não divida mecanicamente um fluxo que fica mais claro junto.
- Evite nomes genéricos como `Utils`, `Helper` ou `Manager` quando ocultarem responsabilidades distintas.

### Estado e tipos

- Use TypeScript estrito e contratos explícitos nas fronteiras públicas.
- Receba dados externos como `unknown`, valide e só então trate como dados de domínio. Um cast não valida JSON.
- Não use `any`, asserções não nulas ou coerções para esconder um problema de modelagem. Exceções precisam de motivo verificável.
- Prefira dados imutáveis e atualizações funcionais de estado. Não altere arrays ou objetos compartilhados silenciosamente.
- Nomeie constantes que representem limites ou regras. Evite números mágicos com significado de negócio.

### Erros e operações assíncronas

- Trate erros onde houver recuperação, tradução de fronteira ou contexto útil. Não capture e ignore falhas.
- Use os erros de aplicação existentes e o tratamento HTTP centralizado. Não exponha SQL, credenciais ou stack traces ao usuário.
- Use `async`/`await`. Aguarde operações ou torne explícito o tratamento de uma tarefa iniciada sem espera.
- Execute operações independentes em paralelo quando adequado. Preserve a ordem de operações dependentes e transacionais.
- Em efeitos React, cancele requisições e remova listeners e timers. Evite respostas antigas sobrescrevendo a seleção atual.
- Nunca indique sucesso antes da confirmação do backend.

### Dependências e fronteiras

- Mantenha dependências substituíveis explícitas. A composição concreta do backend fica em `src/server/composition.ts`.
- O domínio não importa React, Next.js, `pg` ou código de infraestrutura.
- Componentes não executam SQL. Controllers não contêm consultas. Repositórios não conhecem HTTP.
- Prefira biblioteca padrão e ferramentas existentes. Nova dependência precisa de uma necessidade real.
- Evite duplicação de regras. Não una trechos apenas porque parecem semelhantes se mudam por razões diferentes.
- Valide rede, arquivo e importação nas fronteiras. Parametrize valores nas consultas SQL.
- Não introduza chamadas externas para busca, formatação ou funcionalidades que já funcionam localmente.

### Logs e desempenho

- Nunca registre segredos ou conteúdo integral das anotações. Não use logs como cópia de payloads.
- Mantenha diagnóstico de falhas na fronteira responsável, sem espalhar `console.log` pelo código.
- Falhas da aplicação passam por `server/logging/diagnostics.ts`, que aceita apenas códigos de evento definidos e produz JSON sem mensagens ou objetos de erro. Scripts podem exibir progresso sem dados pessoais. Não contorne essa fronteira com logs brutos.
- Antes de uma operação pública, avalie também logs do framework, banco e infraestrutura, redação e retenção. O helper local não controla esses emissores. Não introduza uma biblioteca sem necessidade real.
- Evite I/O repetido e consultas N+1. Só introduza cache ou otimizações adicionais com evidência.

## SOLID

### Responsabilidade única

Cada unidade deve ter um motivo coeso para mudar. Separe renderização, estado e comandos, regras de
domínio, transporte HTTP e persistência. Um fluxo pode ter várias etapas e continuar coeso.

Sinais de problema: alterar um comportamento exige mexer em outro sem relação; um orquestrador monta
SQL ou formata textos; um teste precisa de conjuntos de dados sem relação para exercitar a mesma unidade.
Separe orquestração de cálculo e transformação. Conexão, validação de entrada e protocolo não devem
se acumular numa unidade genérica.

Responsabilidade única não significa um método por classe, nem fragmentos que sempre mudam juntos.
No frontend, estado exclusivamente visual de um formulário pode ficar no componente; coordenação de
API e regras do fluxo pertencem ao view-model.

### Aberto/fechado

Preserve a lógica estável ao acrescentar um caso real. Só crie pontos de extensão quando uma variação
concreta demonstrar a necessidade. Não antecipe plugins, registries ou estratégias para casos imaginários.

### Substituição de Liskov

Implementações de um contrato devem preservar suas garantias, inclusive erros, isolamento e ordem.
Um fake que aceita operações que o repositório real rejeita não comprova o comportamento de persistência.

### Segregação de interfaces

Prefira contratos coesos e pequenos. Não obrigue consumidores a depender de capacidades que não usam.
Não crie interfaces só por cerimônia; preserve as fronteiras de repositório já existentes.

### Inversão de dependência

Os serviços dependem dos contratos de repositório do domínio. Implementações PostgreSQL são montadas
na composição. As regras de negócio não devem conhecer detalhes substituíveis de banco ou transporte.
No frontend, acesso HTTP pertence a `client/api`, orquestrado pelos view-models.

## Comentários

Para código novo ou alterado, expresse intenção por nomes, funções pequenas, constantes e descrições
dos testes. Não adicione comentários narrativos, blocos de documentação ou TODOs para compensar código
confuso. Registre decisões e pendências no documento responsável em `docs/`.

Diretivas necessárias a ferramentas e arquivos gerados, como `next-env.d.ts`, não são comentários
explicativos e não devem ser removidos. Comentários existentes não justificam uma limpeza geral fora
do escopo. A adoção desta regra não significa que todos os arquivos anteriores já foram revisados.

## Revisão final

Confirme coesão, direção das dependências, contratos, tratamento de erros, preservação de dados e
validação proporcional. Consulte [testes](testing.md) e [segurança](security-basic.md).
