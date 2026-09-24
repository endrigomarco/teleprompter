# Visão do produto

Documento vivo do Interview Copilot. Registra o problema que a aplicação resolve, a experiência
existente, as decisões tomadas e o que ainda depende de definição. Deve permitir retomar o projeto
sem consultar conversas anteriores. Atualize-o na mesma mudança que alterar o comportamento descrito.

Para implementação, infraestrutura e evidências técnicas, consulte
[technical-overview.md](technical-overview.md). Para instalação, use o [README](../README.md).

**Estado de referência, 24/09/2026:** aplicação local funcional com projetos, notas, teleprompter e
MCP autenticado. O servidor MCP foi validado localmente; seu cadastro no Codex e a publicação no VPS
não foram concluídos. Não há contas de usuário ou autenticação da interface.

## 1. Problema e propósito

Durante uma entrevista, localizar uma resposta entre muitos textos e acompanhar sua leitura pode
interromper a conversa. A aplicação organiza esse material, permite encontrar um assunto rapidamente
e exibe o conteúdo selecionado em um formato adequado à leitura contínua.

O uso atual é pessoal, com uma coleção pequena. Projetos permitem separar contextos sem misturar
listas de notas. Outros usos de roteiros são possíveis, mas não representam uma definição de público
comercial, plano de assinatura ou produto multiusuário.

## 2. Experiência existente

A tela tem duas áreas: lista de notas à esquerda e teleprompter à direita. O título do projeto fica
acima da linha com troca de projeto, nova anotação e filtro. A busca do leitor fica junto de seus
controles, separada da busca que filtra a lista.

Cada nota tem título, descrição, tags e conteúdo. O usuário pode escrever em qualquer idioma;
a interface permanece em português. A aplicação não traduz nem reescreve respostas automaticamente.

O botão de formatação nos formulários converte texto corrido em linhas curtas. Essa transformação é
local, preserva as palavras e não consulta um modelo de IA.

## 3. Escopo e mapa de capacidades

Os estados abaixo têm significado específico:

- **Implementado:** comportamento disponível na aplicação ou no servidor local.
- **Parcial:** parte da capacidade existe, com a parte ausente explicitada.
- **Direção declarada:** intenção expressa pelo usuário, sem entrega concluída.
- **Em aberto:** falta uma decisão; não significa aprovação de implementação.

| Capacidade                           | Estado               | O que existe e seu limite                                                 |
| ------------------------------------ | -------------------- | ------------------------------------------------------------------------- |
| Projetos                             | Implementado         | Criar, selecionar, editar e excluir pela interface; seleção persistida    |
| Notas por projeto                    | Implementado         | Cadastro, edição, tags, confirmação de exclusão e ordem persistida        |
| Busca da lista                       | Implementado         | Título, descrição, tags e conteúdo; tolerância a acentos e pequenos erros |
| Teleprompter                         | Implementado         | Rolagem, pausa, reinício, fonte, velocidade e progresso                   |
| Busca no leitor                      | Implementado         | Destaque e navegação entre ocorrências                                    |
| Formatação para leitura              | Implementado         | Conversão local nos formulários, sem geração de conteúdo                  |
| Operação por conversa com IA         | Parcial              | MCP implementado; conexão no Codex ainda não cadastrada                   |
| Alterações em lote                   | Implementado         | Ferramentas MCP para criar e editar várias notas atomicamente             |
| Recuperação de notas                 | Implementado via MCP | Histórico e restauração; não há tela de lixeira ou histórico              |
| Uso no VPS                           | Direção declarada    | Hospedagem pretendida pelo usuário, ainda não configurada                 |
| Contas, colaboração e acesso público | Em aberto            | Não implementados e sem escopo de produto aprovado                        |

Projetos organizam contextos de um operador. Não representam organizações, clientes pagantes ou contas
isoladas entre pessoas. A migração inicial associou a coleção anterior ao projeto Interview Copilot.
Textos pessoais dessa coleção não são exemplos públicos nem instruções para agentes.

## 4. Fluxos do produto

### Preparar e usar uma nota

1. Selecionar um projeto ou criar um novo pelo modal **Alterar projeto**.
2. Cadastrar título, descrição, tags e conteúdo em **+ Nova anotação**.
3. Se necessário, converter o texto para o formato de teleprompter antes de salvar.
4. Filtrar a lista e abrir a nota desejada.
5. Ajustar fonte e velocidade e iniciar a leitura.
6. Editar, excluir com confirmação ou reordenar quando necessário.

A reordenação exige a busca da lista limpa. Criar um projeto também o seleciona. Excluir o projeto
atual seleciona o primeiro restante; se não houver outro, a interface apresenta o estado vazio.

### Pedir alterações ao assistente

O pedido é digitado no cliente de IA conectado, não em uma caixa de chat dentro desta aplicação.
O assistente consulta os projetos e as notas, resolve os IDs e prepara as alterações estruturadas.
O servidor valida os argumentos e executa as operações autorizadas.

O servidor está disponível localmente, mas esse fluxo por conversa depende do cadastro da conexão no
cliente. Para notas novas, o assistente pode ajudar a desenvolver o texto com o usuário antes de
cadastrá-lo. O backend não gera respostas por conta própria.

### Excluir e recuperar pelo MCP

O assistente prepara uma prévia com projeto, quantidade e notas, apresenta-a ao usuário e aguarda
confirmação. A execução usa os alvos congelados: notas criadas depois não entram na exclusão e
conflitos de versão impedem a operação inteira. A prévia expira após 10 minutos.

Essa confirmação é uma regra do assistente; o servidor valida a prévia, mas não comprova que uma
pessoa confirmou a conversa. A interface mantém seu próprio modal de confirmação.

Notas excluídas podem ser localizadas e recuperadas pelo MCP. A recuperação exige que o projeto
continue existindo e coloca a nota no fim da lista. Recuperar um projeto excluído exige backup.

## 5. Atalhos e continuidade da leitura

| Atalho                                   | Comportamento                             |
| ---------------------------------------- | ----------------------------------------- |
| Ctrl/Command + K                         | Foca e seleciona o filtro da lista        |
| Escape no filtro                         | Limpa a busca da lista                    |
| Setas e Enter no filtro                  | Navega e abre uma anotação                |
| Ctrl/Command + F                         | Foca a busca no teleprompter              |
| Enter / Shift + Enter na busca do leitor | Próxima / anterior ocorrência             |
| Escape na busca do leitor                | Limpa apenas essa busca                   |
| Espaço fora dos controles                | Inicia ou pausa a leitura                 |
| Escape no modal                          | Fecha quando não há operação em andamento |

Trocar de anotação ou projeto interrompe a leitura. Rolagem manual e saída da aba também pausam.
O último projeto selecionado é uma preferência única da instalação, compartilhada entre janelas.

## 6. Decisões estabelecidas

| Decisão                                     | Resultado atual                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Manter a experiência simples                | Uma tela principal com lista e leitor, usando modais para cadastro e projetos |
| Separar contextos                           | Cada nota pertence a um projeto                                               |
| Preservar o comportamento ao evoluir a base | React, TypeScript e PostgreSQL substituíram a implementação inicial           |
| Dar acesso estruturado à IA                 | MCP consulta e altera notas sem ferramenta de SQL arbitrário                  |
| Manter a interpretação no assistente        | O backend executa contratos, sem chamada própria à OpenAI                     |
| Suportar vários itens por operação          | Criação e edição em lote, com falha integral em caso de conflito              |
| Permitir recuperação                        | Histórico persistido, incluindo alterações da interface                       |
| Preservar textos pessoais                   | Não reescrever conteúdo em refatorações ou usá-lo como fixture                |

As escolhas de stack, camadas e infraestrutura são detalhadas na visão técnica. Serviços e recursos
dos projetos usados como referência não são importados automaticamente para este produto.

## 7. O que foi validado e o que falta comprovar

A interface foi verificada localmente nas entregas anteriores. Os testes automatizados exercitam
CRUD, separação por projeto, busca, ordenação, versões, lotes, exclusão e restauração.
O MCP foi consultado por um cliente do SDK e por HTTP na aplicação local. Na reorganização Docker,
a comparação de backups confirmou preservação dos dados ativos.

Essas verificações não demonstram uso pelo MCP já cadastrado no Codex, funcionamento em um VPS,
colaboração entre usuários, disponibilidade contínua ou experiência com uma coleção grande.
Os detalhes e limites da evidência estão em [testing.md](testing.md).

## 8. Limitações e decisões em aberto

- A interface e a REST não têm login. Bearer do MCP não protege essas superfícies.
- Alterações externas não atualizam a tela automaticamente; é necessário recarregar.
- Não existe interface de histórico ou lixeira, embora a recuperação por MCP exista.
- Excluir uma nota ativa não elimina histórico, resultados idempotentes ou backups.
- Não há colaboração, contas individuais ou preferências por pessoa.
- Publicação no VPS, domínio, forma de acesso à interface e operação de backups ainda precisam de definição.
- Eventual uso comercial, cobrança e distribuição como produto não têm requisitos aprovados.

## 9. Continuidade do produto

A continuidade indicada pelo objetivo do usuário é conectar o MCP ao cliente de IA e preparar o uso no
VPS. O servidor já existe; conexão e hospedagem ainda são entregas pendentes. Não há outro incremento
funcional escolhido após a organização da infraestrutura e desta documentação.

Antes de publicar, é necessário definir quem acessará a interface e como esse acesso será protegido.
Isso não implica adotar o onboarding, pagamentos ou demais funcionalidades do `saas-scaffold`.
Novas decisões devem ser registradas aqui, sem transformar possibilidades em funcionalidades prometidas.

## Referências

- [Visão técnica](technical-overview.md): implementação, decisões e evidências.
- [MCP](api/mcp.md): ferramentas, conexão e recuperação.
- [Dados e privacidade](privacy-and-data-protection.md): histórico, exclusão e cópias.
- [Convenções](project-conventions.md): manutenção destes documentos.
