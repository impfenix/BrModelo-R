# Guia de Contribuição - BrModelo-R

Bem-vindo ao guia de contribuição do BrModelo-R! Como este é um projeto *Rolling Release*, encorajamos contribuições contínuas da comunidade. Seja codando, corrigindo bugs, traduzindo ou desenhando novos *shapes*, toda ajuda é bem-vinda.

## 🚀 Como Contribuir (O Fluxo do GitHub)

Para organizar as contribuições, utilizamos o fluxo padrão de código aberto (Fork & Pull Request):

1. **Faça um Fork do Repositório**: Vá no repositório original no GitHub e clique em "Fork" no canto superior direito. Isso criará uma cópia do projeto na sua conta.
2. **Clone seu Fork**: Copie a URL do seu fork e rode no seu terminal:
   ```bash
   git clone https://github.com/SEU-USUARIO/BrModelo-R.git
   cd BrModelo-R
   ```
3. **Crie uma Branch**: Não faça alterações direto na branch `main`. Crie uma nova para a sua feature:
   ```bash
   git checkout -b feature/minha-nova-funcionalidade
   ```
4. **Faça as Alterações**: Edite o código, adicione os novos recursos ou corrija bugs (veja os tópicos abaixo).
5. **Comite (Commit) e Envie (Push)**:
   ```bash
   git add .
   git commit -m "feat: adiciona modelo de ator para UML"
   git push origin feature/minha-nova-funcionalidade
   ```
6. **Abra um Pull Request (PR)**: Vá para o repositório original e você verá um botão para comparar e criar um Pull Request com sua branch. Descreva detalhadamente o que foi feito.

---

## 🎨 1. Adicionando Novos Tipos de Desenhos (URGENTE)

Atualmente, **UML, Topologia de Rede e Planta Baixa** não estão disponíveis para uso pois estão listadas na interface mas carecem dos *shapes* (formatos/modelos) para desenhar no palco (canvas). A comunidade pode ajudar muito nisso!

Para contribuir com essas funcionalidades:

1. **Localize o Enum:** No arquivo `src/components/DiagramBoard.tsx` (ou arquivo de paleta similar) e no `src/types.ts` procure por `enum ElementType` e `enum DiagramMode`.
2. **Ative a Ferramenta:** Habilite o botão correspondente na barra lateral (se estivar oculto ou desabilitado).
3. **Lógica de Renderização:** No método de renderização no canvas (usualmente usando Konva), crie o componente visual para a sua nova figura utilizando as tags do `react-konva` (`<Rect>`, `<Circle>`, `<Path>`, `<Text>` etc.). Por exemplo:
   * Para *UML*, precisamos de `Classes`, `Casos de Uso (Actor, UseCase)`, `Interfaces`, `Relacionamentos (Herança, Composição, Agregação)`.
   * Para *Topologia*, precisamos do desenho em vetor (Path/Image) para roteadores, switches, instâncias EC2, nós, etc.
   * Para *Planta Baixa*, paredes ajustáveis, portas, janelas e mobília.
4. **Propriedades:** Adicione os campos necessários na *Sidebar* Direita (Painel de Propriedades) para permitir que o usuário altere as configurações (nomes, métodos, largura das paredes, etc) quando selecionar seu *shape*.

## 🌐 2. Pacotes de Idiomas

A estrutura de idiomas fica na pasta `public/idiomas/`. O padrão é `pt-BR`. O projeto quer abraçar o mundo!

### Como criar um novo idioma:
1. Copie o arquivo `public/idiomas/en.json` (ou `pt-BR.json`) e renomeie para a sigla do idioma pretendido (ex: `fr.json` para francês, `de.json` para alemão).
2. Traduza todos os valores entre as aspas à direita (mantenha as *chaves* à esquerda intactas).
3. No arquivo `src/i18n.ts` (ou no inicializador de idiomas na interface), adicione a referência e ative o botão para o novo pacote.

## 🖌️ 3. Criação de Temas

A estética é importante. Os temas de layout ficam na pasta `public/temas/`.

1. Crie um arquivo JSON com o nome do tema (ex: `dark-dracula.json`).
2. Defina rigorosamente a mesma estrtura de variáveis de cor (background, text, primary, secondary, toolPalette, canvasGrid) inspirando-se em `dark-theme.json`.
3. Certifique-se de referenciar o tema livremente de forma acessível. O sistema listará a opção na modal baseando-se nos nomes.

## 💻 4. Servidor Express e Autenticação

O backend está sendo estruturado em Node.js (Express) focado em ser rápido e independente:
- **Autenticação:** O código deve estar preparado para uso Offline no cliente, mas quando rodando o servidor com banco de dados, devemos ter Login com OAuth.
- **Integrações:** Pense em APIs prontas para exportar scripts DDL ou aceitar colaboração real-time. Quaisquer contribuições à rede WebSocket ou bibliotecas Socket.io são bem-vindas.

## 🛑 Regras de Ouro
1. Siga as boas práticas de usabilidade e não polua a interface.
2. Pense em Mobile, Desktop e Web simultaneamente - o `<canvas>` precisa reagir corretamente e as Sidebars e menus não podem estourar na tela pequena.
3. Não instale dezenas de pacotes pesados de dependência no `package.json` sem necessidade clara. Priorize os já incluídos como `react-konva`, `tailwind`, e ferramentas padrão do React.

Obrigado por ajudar a evoluir o BrModelo-R!
