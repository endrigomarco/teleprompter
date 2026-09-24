# Documentação compartilhada

Esta pasta é a referência comum para pessoas, Codex e Claude Code.
As regras se aplicam às mudanças no projeto; não representam uma certificação de que todo o código
existente já foi auditado. As instruções explícitas do usuário e as instruções superiores da ferramenta
prevalecem. Registre decisões duradouras no documento responsável.

## Ordem de leitura

Sempre leia [convenções](project-conventions.md) e [padrões de engenharia](engineering-standards.md).
Depois consulte os documentos relacionados à tarefa:

| Documento                                          | Responsabilidade                                        |
| -------------------------------------------------- | ------------------------------------------------------- |
| [Produto](product-overview.md)                     | Experiência, funcionalidades e limites                  |
| [Arquitetura](technical-overview.md)               | Stack, camadas, decisões e pendências                   |
| [Engenharia](engineering-standards.md)             | Clean code, SOLID, responsabilidade única e comentários |
| [Convenções](project-conventions.md)               | Idioma, nomes e manutenção documental                   |
| [Frontend](frontend-conventions.md)                | React, MVVM, CSS e acessibilidade                       |
| [Backend](backend-conventions.md)                  | Next.js, MVC, validação e persistência                  |
| [API](api/README.md)                               | Rotas, payloads e erros                                 |
| [MCP](api/mcp.md)                                  | Ferramentas, autenticação, lotes e recuperação          |
| [Banco](database.md)                               | Modelo, invariantes e migrações                         |
| [Testes](testing.md)                               | Comandos existentes e critérios de validação            |
| [Segurança](security-basic.md)                     | Revisão proporcional e limites locais                   |
| [Privacidade](privacy-and-data-protection.md)      | Dados, cópias e fluxos existentes                       |
| [Operação](operations.md)                          | Execução local, backup e transferência                  |
| [Git](git-workflow.md)                             | Operações sobre o histórico                             |
| [Mensagens de commit](commit-message-generator.md) | Formato sob demanda                                     |

Os documentos foram adaptados de referências fornecidas pelo usuário. As decisões daquele produto
não foram importadas: esta aplicação não usa NestJS, Prisma, GraphQL, Terraform ou serviços de pagamento.
