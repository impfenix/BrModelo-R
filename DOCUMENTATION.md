# Documentação do Programa - BrModelo-R

## Visão Geral
O BrModelo R é uma ferramenta de modelagem de banco de dados baseada em web, inspirada no clássico brModelo. Ele permite a criação de diagramas conceituais e lógicos de forma intuitiva, com suporte a exportação para diversos formatos (SQL, PHP, JSON, PNG, ZIP). A ferramenta é **multi-idioma**, com suporte para Português, Inglês, Espanhol e Chinês (Mandarim).

## Status de Implementação

### 1. Desenho Conceitual (Implementado Parcialmente)
O módulo conceitual permite a criação de:
- **Entidades:** Entidades fortes e fracas.
- **Relacionamentos:** Relacionamentos binários, ternários, etc.
- **Atributos:** Atributos simples, compostos, multivalorados, derivados e opcionais.
- **Auto-Relacionamentos:** Suporte a conexões de um elemento consigo mesmo com visualização melhorada.
- **Participação Total:** Representada por linhas duplas.
- **Hierarquia/Especialização:** Suporte a generalização e especialização de entidades.
- **Agregação:** Representada por um losango dentro de um retângulo.

*Nota: Algumas funcionalidades avançadas de validação de cardinalidade e restrições de integridade ainda estão em desenvolvimento.*

### 2. Desenho Lógico (Implementado)
O módulo lógico permite:
- **Geração Automática:** Conversão do modelo conceitual para o modelo lógico (tabelas).
- **Gerenciamento de Tabelas:** Criação e edição de tabelas, campos e tipos.
- **Chaves Primárias e Estrangeiras:** Definição visual de chaves.
- **Relacionamentos Lógicos:** Conexões entre tabelas representando chaves estrangeiras.

### 3. Exportação (Implementado)
- **SQL:** Geração de scripts DDL para criação de tabelas.
- **PHP:** Geração de classes de modelo em PHP.
- **JSON:** Salvamento do estado do diagrama para posterior importação.
- **Imagem (PNG):** Exportação do canvas como imagem.
- **ZIP:** Exportação de um pacote contendo os arquivos gerados.

### 4. Internacionalização (Implementado)
- **Idiomas Suportados:** Português, Inglês, Espanhol e Chinês (Mandarim).
- **Troca Dinâmica:** O idioma pode ser alterado no menu de configurações (ícone de engrenagem) e a interface é atualizada instantaneamente.
- **Persistência:** O idioma selecionado é salvo localmente no navegador.

## Interface do Usuário
- **Barra Lateral Esquerda:** Ferramentas de criação (Entidades, Relacionamentos, Atributos, Conexões).
  - **Interação Otimizada:** Menus de ferramentas (três pontos) abrem ao passar o mouse (hover) ou via touch.
  - **Seleção Persistente:** A ferramenta selecionada permanece ativa até que outra seja escolhida, facilitando a criação múltipla de elementos.
- **Barra Superior:** Gerenciamento de abas, troca de modo (Conceitual/Lógico), exportação e configurações.
- **Canvas Central:** Área de desenho interativa com suporte a arraste, zoom e seleção múltipla.
- **Painel Direito:** Propriedades do elemento selecionado.

## Tecnologias Utilizadas
- **React 19:** Framework UI.
- **Konva / React-Konva:** Biblioteca para renderização de canvas 2D.
- **Tailwind CSS:** Estilização utilitária.
- **Lucide React:** Conjunto de ícones.
- **Vite:** Build tool e servidor de desenvolvimento.
