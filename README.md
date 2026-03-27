# BrModelo F - Ferramenta de Modelagem de Dados

Este é um projeto de ferramenta de modelagem de dados (DER/ER) moderna, construída com React, Konva e TypeScript. Ele suporta diagramas conceituais, no futuro lógicos e diversas notações UML, além de topologia de rede e planta baixa.

## 🚀 Funcionalidades

- **Múltiplos Modos de Diagrama**: Conceitual, Lógico, no futuro UML (Classe, Caso de Uso, Sequência, Atividade, Estado), Topologia de Redes e Planta Baixa.
- **Auto-relacionamento**: Suporte a relacionamentos recursivos com linhas paralelas e rótulos de papel.
- **Exportação**: Suporte para exportar como imagem (PNG/JPG) e arquivo de projeto (.json).
- **Multi-abas**: Organize seus modelos em diferentes abas.
- **Propriedades Detalhadas**: Personalize cores, fontes, tamanhos e rotações de cada elemento.
- **Multi-plataforma**: Disponível para Web, Windows, Linux, macOS, Android e iOS.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Canvas**: [Konva](https://konvajs.org/) + [React-Konva](https://konvajs.org/docs/react/index.html)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Motion](https://motion.dev/)
- **Desktop**: [Electron](https://www.electronjs.org/)
- **Mobile**: [Capacitor](https://capacitorjs.com/)

## 📦 Como Rodar Localmente

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/brmodelo-f.git
   cd brmodelo-f
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

### Web
```bash
npm run build
```

### Desktop (Electron)
```bash
# Compilar para a plataforma atual
npm run electron:build

# Compilar para todas as plataformas (Windows, Linux, Mac)
npm run electron:build:all
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

## 🤖 GitHub Actions (Release)

O projeto está configurado com GitHub Actions para compilar automaticamente em cada tag de versão:
- **Linux**: `.deb`, `.rpm`, `AppImage` (x64, arm64, armv7l)
- **Windows**: `.exe` portátil (x64, arm64, ia32)
- **macOS**: `.dmg` (Universal)
- **Android**: `.apk` universal
- **iOS**: `.ipa` (Requer conta de desenvolvedor Apple para assinatura)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou enviar Pull Requests.
