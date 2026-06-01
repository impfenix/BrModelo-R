# Guia de Contribuição - BrModelo-R

Bem-vindo ao guia de contribuição do BrModelo-R! Como este é um projeto *Rolling Release*, encorajamos contribuições contínuas.

## 1. Adicionando Novos Tipos de Desenhos / Ferramentas

Existem várias ferramentas ocultas ou parcialmente implementadas (ex: UML, Topologia, Planta Baixa). Para contribuir com elas:

1.  **Localize o Enum:** No arquivo `src/App.tsx`, procure por `enum ElementType` e `enum DiagramMode`.
2.  **Ative a Ferramenta:** Adicione o botão correspondente na barra lateral dentro do componente principal.
3.  **Lógica de Renderização:** No método `renderElement` (ou similar), adicione o `case` para o novo `ElementType` usando componentes do `react-konva` (Rect, Circle, Path, etc.).
4.  **Propriedades:** Adicione os campos necessários no painel direito (Sidebar de Propriedades) para permitir a edição do novo elemento.

## 2. Pacotes de Idiomas

A estrutura de idiomas fica na pasta `public/idiomas/`. O padrão é `pt-BR`.

### Como criar um novo idioma:
1.  Copie o arquivo `public/idiomas/en.json` e renomeie para a sigla do idioma (ex: `fr.json` para francês).
2.  Traduza os valores (mantenha as chaves intactas).
3.  No arquivo `src/i18n.ts` (ou no sistema de carregamento dinâmico), adicione a referência para o novo pacote.

## 3. Temas

Os temas ficam na pasta `public/temas/`.
1.  Crie um arquivo JSON (ex: `dark-dracula.json`).
2.  Defina as variáveis de cor (background, text, primary, secondary, canvasGrid).
3.  O sistema lerá esta pasta e adicionará a opção no menu de configurações.

## 4. Servidor e Sincronização

O backend está sendo estruturado em Node.js (Express).
-   **Contas Institucionais:** Se for contribuir com login (Google/Microsoft), utilize as bibliotecas oficiais de OAuth2.
-   **Sincronização:** Os arquivos devem ser salvos na pasta `Documentos/BrModelo-R/desenhos-brModeloR` do usuário ou no banco de dados do servidor.

Siga as boas práticas de IHC, UX e UI. **Não altere o estilo visual base (Tailwind/Lucide)**, apenas expanda-o.
