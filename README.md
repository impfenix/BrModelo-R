# BrModelo-R - Ferramenta de Modelagem e Servidor

Este projeto é uma versão modernizada, refatorada (em React/TypeScript) e multiplataforma inspirada na clássica e excelente ferramenta brasileira **brModelo** (focada em modelagem de dados MER/DER). 

Este é um projeto completo de modelagem de dados (DER/ER) e gerenciamento de servidor, construído com React, Konva, TypeScript e Express.

## 🚀 Funcionalidades

- **App de Modelagem**: Ferramenta iterativa focada em diagramas Lógico e Conceitual (MER/DER) baseados na notação do brModelo.
  - *Nota:* Os componentes de UML, topologia de rede e planta baixa encontram-se na interface, porém **estão parcialmente implementados e não indisponíveis para uso**, pendentes de criação dos modelos e conectores para desenho (veja [CONTRIBUTING.md](CONTRIBUTING.md) caso deseje contribuir).
- **App Servidor**: Painel de controle para gerenciar instâncias, usuários, domínios e backups.
- **Multi-plataforma**: Web, Windows, Linux, macOS, Android, iOS e **Docker**.

## 📋 TODO (Próximos Passos)

- [ ] Integrar Shapes/Modelos Visuais geométricos para **UML** e programar as uniões/setas adequadas.
- [ ] Implementar Shapes/Elementos para **Topologia de Rede** (Roteadores, Switches, Nuvens, Servidores).
- [ ] Desenvolver catálogo de Shapes para **Planta Baixa**.
- [ ] Implementar o motor Realtime para ambientes colaborativos.
- [ ] API backend para autenticação e nuvem.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend**: [Express](https://expressjs.com/)
- **Canvas**: [Konva](https://konvajs.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Desktop**: [Electron](https://www.electronjs.org/)
- **Mobile**: [Capacitor](https://capacitorjs.com/)
- **Container**: [Docker](https://www.docker.com/)

## 📦 Como Rodar Localmente

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Docker (opcional, para versão containerizada)

### Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/impfenix/BrModelo-R.git
   cd brmodelo-r
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🏗️ Compilação (Build)

### Compilação e Cross-Compilation

- **Windows**: Use `npm run electron:build:client:win` / `electron:build:server:win` para gerar arquivos `.exe` (que podem ser gerados a partir do Linux usando o Wine empacotado pelo electron-builder automaticamente).
- **Linux**: Execute o utilitário `./build_linux.sh` no seu sistema para obter DEB, RPM, AppImage e Flatpak perfeitamente empacotados.
- **macOS**: Utilize `./cross_build_mac.sh` do seu Linux para construir portáteis ZIPs com suporte Apple Silicon (.arm64) e processadores Intel (.x64).
- **Android**: Compile .APK com sua chave Keystore oficial pelo `./build_android.sh` integrado.
- **iOS/iPadOS**: _Requer um dispositivo Apple (Mac) para realizar compilação nativa_. Execute `npx cap open ios` no projeto dentro de um macOS local e preencha as "Signs & Capabilities" com sua conta Apple.
  Consulte [`README_BUILD.md`](README_BUILD.md) e [`BUILD_INSTRUCTIONS.md`](BUILD_INSTRUCTIONS.md) para detalhes mais granulares e tutoriais guiados.

### Docker (Versão Containerizada)

Para rodar em um container Docker:

```bash
docker build -t brmodelo-r .
docker run -p 3000:3000 brmodelo-r
```

### Desktop (Electron)

```bash
# Compilar para a plataforma atual
npm run electron:build
```

### Mobile (Capacitor)

```bash
# Sincronizar com as plataformas nativas
npm run cap:build

# Abrir no Android Studio
npx cap open android

# Abrir no Xcode (macOS apenas)
npx cap open ios
```

## 📄 Licença

Este projeto está sob a licença GNU GPLv3. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos / Créditos Especiais

Gostaríamos de expressar nossa profunda gratidão aos autores originais do software **brModelo** (particularmente ao Prof. Carlos Heitor), que tem sido uma ferramenta de valor inestimável para fins acadêmicos e ensino de Banco de Dados no Brasil há anos. O **BrModelo-R** busca honrar esse legado, expandindo-o para a era da web moderna e dispositivos móveis.
