# Convenções do frontend

Siga [engineering-standards.md](engineering-standards.md). A interface usa React, TypeScript e CSS próprio.

- Views ficam em `client/components`; coordenação de dados e comandos em `client/view-models`; fetch em `client/api`.
- Funções puras de busca, reordenação e formatação ficam no domínio. Não duplique regras no JSX.
- Estado visual simples pode permanecer na View. Extraia quando houver regra, coordenação ou reutilização real.
- Preserve labels, nomes acessíveis, foco, teclado e estados de carregamento, vazio, erro e operação em andamento.
- Use o componente `Modal` existente e o elemento `dialog`; bloqueie ações concorrentes durante salvamento.
- Pausar e limpar a leitura na troca de projeto deve continuar funcionando. Não deixe respostas antigas contaminar o projeto atual.
- Use chaves estáveis. Remova listeners, timers e requisições em cleanup dos efeitos.
- Nunca renderize conteúdo das notas com `dangerouslySetInnerHTML`. Destaques devem manter texto literal.
- Preserve os atalhos e a experiência responsiva de [product-overview.md](product-overview.md).
- Organize CSS por responsabilidade e reutilize padrões existentes antes de introduzir dependências visuais.
- Valide visualmente alterações de layout na aplicação local, incluindo largura reduzida quando pertinente.
