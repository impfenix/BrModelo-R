# Instruções de Compilação e Workflow - BrModelo-R

## Versões e Compilação

O BrModelo-R pode ser compilado para três plataformas principais: Web, Desktop (Electron) e Mobile (Capacitor).

### 1. Versão Web (Vite)
Esta é a versão base que roda no navegador.
- **Desenvolvimento:** `npm run dev` (Inicia o servidor na porta 3000)
- **Build:** `npm run build` (Gera os arquivos estáticos na pasta `dist/`)

### 2. Versão Desktop (Electron)
Esta versão empacota o BrModelo-R como um aplicativo nativo para Windows, Linux e macOS.
- **Build para a plataforma atual:** `npm run electron:build`
- **Build para todas as plataformas (múltiplas arquiteturas):** `npm run electron:build:all`
  - *Nota: Gera executáveis (.exe, .AppImage, .deb, .rpm, .dmg) na pasta `release/`.*

### 3. Versão Mobile (Capacitor)
Esta versão utiliza o Capacitor para rodar como um aplicativo nativo em Android e iOS.
- **Build Base:** `npm run cap:build` (Gera o build web e sincroniza com os projetos nativos)
- **Android:** `npm run cap:build:android` (Gera o APK/AAB na pasta `android/app/build/outputs/apk/release/`)
- **iOS:** `npm run cap:build:ios` (Prepara o projeto para ser aberto no Xcode)

---

## Workflow de Desenvolvimento

O workflow recomendado para o uso da ferramenta segue as etapas clássicas de modelagem de dados:

### Etapa 1: Modelagem Conceitual
1. Selecione o modo **Conceitual** na barra superior.
2. Utilize as ferramentas da barra lateral esquerda para criar **Entidades**, **Relacionamentos** e **Atributos**.
3. Conecte os elementos usando a ferramenta de **Conexão** (Link).
4. Defina as cardinalidades (1:1, 1:N, N:N) e participações (Total/Parcial) nas propriedades do elemento (painel direito).

### Etapa 2: Modelagem Lógica
1. Clique no botão **Gerar Modelo Lógico** (ícone de tabela) na barra superior.
2. O sistema converterá automaticamente as entidades em tabelas e os relacionamentos em chaves estrangeiras.
3. Alterne para o modo **Lógico** para refinar as tabelas, tipos de dados e nomes de campos.

### Etapa 3: Implementação Física (SQL)
1. Após finalizar o modelo lógico, clique no botão **SQL** na barra superior.
2. O sistema gerará um script DDL completo contendo os comandos `CREATE TABLE` para o seu banco de dados.
3. Você também pode exportar as classes em **PHP** para agilizar o desenvolvimento do backend.

---

## Estrutura do Projeto e Ativos
- `src/`: Código fonte React.
- `public/`: **Local para colocar arquivos `.svg`, `.png`, `.ico` e outros ativos estáticos.**
  - Arquivos colocados aqui estarão disponíveis na raiz do build final (ex: `public/logo.svg` vira `/logo.svg`).
- `electron/`: Configurações e main process do Electron.
- `android/` / `ios/`: Projetos nativos do Capacitor.
- `package.json`: Gerenciamento de dependências e scripts de build.
