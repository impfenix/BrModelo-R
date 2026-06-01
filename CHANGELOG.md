# CHANGELOG - BrModelo-R

Este projeto utiliza um modelo de lançamento contínuo (*Rolling Release*). Não há versões Alpha ou Beta, apenas atualizações contínuas.

## [Atual] - Em Desenvolvimento Contínuo

### Totalmente Implementado (Funcionando)
- **Interface Multi-idioma:** Suporte para Português (BR e PT), Inglês, Espanhol e Chinês.
- **Desenho Lógico:** Criação de tabelas, campos, chaves primárias e estrangeiras.
- **Geração Automática:** Conversão do modelo conceitual para lógico.
- **Exportação:** Geração de SQL (DDL), classes PHP, JSON, PNG e ZIP.
- **Interação UI:** Menus suspensos com ativação por hover/touch, seleção persistente de ferramentas.
- **Auto-Relacionamento:** Desenho aprimorado com linhas que convergem para o centro da entidade.
- **Modal de Primeira Execução:** Configuração inicial de sincronização (Local vs Nuvem).

### Parcialmente Implementado (Em Progresso)
- **Desenho Conceitual:** Entidades, Relacionamentos, Atributos funcionam, mas validações avançadas de cardinalidade estão em refinamento.
- **Sincronização em Nuvem:** A interface permite selecionar Google Drive/OneDrive/Servidor Local, mas a API de sincronização real no backend está em desenvolvimento.
- **Servidor Multiplataforma:** A base do servidor Express foi criada, mas a gestão completa de usuários, equipes e contas institucionais (OAuth) está em fase de estruturação.
- **Mapeamento de 9 Passos:** A ferramenta foi adicionada à interface, mas a lógica de geração passo-a-passo está sendo codificada.
- **Carregamento Dinâmico de Temas e Idiomas:** A estrutura de pastas foi criada, mas o carregamento direto do GitHub via API ainda não está ativo.

### Correções Recentes
- Corrigido o nome do aplicativo para **BrModelo-R** em todos os arquivos de configuração (Capacitor, Electron, package.json).
- Removido o reset automático da ferramenta de seleção, melhorando o fluxo de trabalho.
