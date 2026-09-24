# Dados e privacidade

Registro técnico do que esta aplicação armazena. Não constitui parecer jurídico ou declaração de
conformidade com LGPD. Não presuma bases legais, responsáveis organizacionais ou políticas de retenção.

## Dados e fluxo

Projetos contêm título e descrição. Notas contêm título, descrição, tags e texto livre, que pode
incluir histórico profissional e informações pessoais ou de empresas. IDs, versões, posições e datas
apoiam persistência. A seleção do projeto fica no banco.

O navegador recebe as notas do projeto pela API local; PostgreSQL armazena os dados em volume Docker.
O JSON inicial, os backups JSON e dumps podem conter cópias integrais. A aplicação não chama um modelo de IA nem possui analytics. O MCP responde com notas ao cliente
autenticado que as solicitar; esse cliente pode enviá-las ao provedor de IA da conversa. Dependências e ferramentas de desenvolvimento têm
seu próprio funcionamento; a ausência de integração no produto não é garantia sobre todo o ambiente.

## Ciclo de vida

- Não há expiração automática ou política de retenção implementada.
- Excluir nota ou projeto remove dados ativos; histórico, resultados de operações MCP, backups e JSON inicial continuam existindo.
- Backups são manuais. Não há criptografia de backup gerenciada pela aplicação.
- `data/initial-notes.json` pode conter dados reais. Fica fora do contexto de build e é montado somente para leitura em `/app/data` pelo Compose. Imagens antigas ainda podem conter esse arquivo; a alteração não apaga imagens anteriores. Não distribua a pasta pessoal ou backups como exemplos públicos.
- Arquivos ignorados pelo Git ainda existem no disco e podem entrar numa cópia manual da pasta.

Não copie textos pessoais para fixtures, documentação, screenshots públicos ou relatórios sem
necessidade autorizada. Use conteúdo sintético para validar comportamento.
Mudanças de armazenamento, logging, backup, exclusão ou integrações exigem atualização deste registro.

Os diagnósticos próprios de falha contêm apenas código de evento, nível e horário. Não recebem texto
das notas, mensagens do driver ou objetos de erro. Logs do framework, banco e runtime têm escopo próprio
e não são cobertos por essa garantia. Os testes automatizados usam dados sintéticos.

O histórico guarda snapshots integrais de notas, inclusive excluídas, e a identidade técnica da
credencial (hash, nunca o token). Resultados idempotentes também podem conter texto completo. Esses
registros não são purgados automaticamente. A restauração não equivale a eliminação de dados pessoais.
Backup JSON não inclui esses registros; dumps completos incluem. Proteja ambos como dados pessoais.
