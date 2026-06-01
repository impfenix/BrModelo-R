# BrModelo-R - Sistema de Build Multi-Plataforma

Este projeto está configurado para gerar aplicativos nativos para diversas plataformas utilizando **Electron** (Desktop) e **Capacitor** (Mobile).

## Plataformas Suportadas e Compilação Cruzada (Cross-Compile)

O BrModelo-R pode ser compilado nativamente nas plataformas de destino ou via Cross-Compilation (compilar para outros S.O's a partir do Linux/MXLinux).

### Desktop (via Electron & electron-builder)

- **Windows:** Executável portátil (.exe). A partir do Linux, execute o script `./build_windows.bat` se estiver rodando no Windows, ou caso queira compilar a partir do Linux execute `npm run electron:build:client:win` (ou server) para gerar executáveis portáteis das arquiteturas x64, ia32 e arm64.
- **macOS:** Pacote Compactado (.zip) para distribuições x64 (Intel) e arm64 (Apple Silicon). A partir do Linux, o `.dmg` ou pacote universal não é suportado pelo _electron-builder_, portanto execute o script `./cross_build_mac.sh` no Linux/MX Linux para gerar pacotes `.zip` das versões cliente e servidor.
- **Linux:** Pacotes .deb, .rpm, AppImage, Flatpak e tar.xz. Execute `./build_linux.sh` no Linux/MX Linux para compilar versões deb, rpm, AppImage e flatpak para amd64/x64 e arm64.

### Mobile (via Capacitor)

- **Android:** APK para arquiteturas independentes gerados compilando no MX Linux/Linux. Execute o script `./build_android.sh` para gerar, se o arquivo `brmodelo-key.jks` estiver presente na mesma pasta, ele permitirá assinar as aplicações com o certificado automaticamente (e extrair os `.apk` finais, colocando em `release/client` e `release/server`).
- **iOS/iPadOS:** Necessário compilar manualmente por meio do Xcode em um Mac\*. Devido às restrições da Apple, não há cloud gratuita recomendada nem "cross-compilation" direta a partir do Linux habilitada atualmente para gerar IPAs sem conta de desenvolvedor da Apple.

## Como Compilar Localmente

### Pré-requisitos

- Node.js 20+
- Para Android: Android Studio & SDK
- Para iOS/macOS: Xcode (apenas em macOS)

### Guias de Compilação

- **Windows (Portable):** Para gerar EXEs do Windows no Linux, utilize o comando `npm run electron:build:client:win` e `npm run electron:build:server:win`.
- **macOS (ZIP, via Linux):** Para dar cross-compile para Mac e Linux contornando a limitação do DMG Universal, execute `./cross_build_mac.sh`.
- **Android (APK):** Para compilar e assinar nativamente o Android via bash, execute `./build_android.sh`.

### Como compilar para iOS / iPadOS

Não é possível exportar ou empacotar diretamente .ipa do aplicativo por meio do Linux usando Electron/Capacitor. Para gerar suas versões no iOS, siga estes passos em um **macOS real** com o **Xcode** instalado:

1. No seu ambiente Mac (ou em um MacOS virtual/Hackintosh suportado), abra o terminal dentro desta pasta do repositório clonada.
2. Certifique-se de executar `npm install` primeiro para todas as dependências serem instaladas.
3. Sincronize a camada web com as dependências do Capacitor da camada iOS:
   ```bash
   npm run build:client
   npx cap sync ios
   ```
4. Abra o ambiente Apple configurado nativamente com:
   ```bash
   npx cap open ios
   ```
5. Utilize a própria IDE do **Xcode** para selecionar seu certificado de desenvolvedor oficial (Signings & Capabilities) exigido pela Apple, selecionar o simulador de iPad/iOS (ou dispositivo logado conectado fisicamente) e clicar no botão "Play" / Archive na barra superior.

## GitHub Actions (CI/CD)

O arquivo `.github/workflows/build.yml` está configurado para compilar automaticamente todas as versões sempre que houver um push na branch `main`.

Os artefatos gerados (APKs, EXEs, DMGs, DEBs, etc.) estarão disponíveis na aba **Actions** do seu repositório GitHub após a conclusão do workflow.

### Arquiteturas Incluídas

O sistema de build está configurado para gerar binários para:

- **amd64 / x64**
- **arm (v7l)**
- **arm64**

---

_Nota: A compilação de iOS e macOS requer um runner macOS no GitHub Actions (incluído no workflow)._
