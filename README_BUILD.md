# BrModelo F - Sistema de Build Multi-Plataforma

Este projeto está configurado para gerar aplicativos nativos para diversas plataformas utilizando **Electron** (Desktop) e **Capacitor** (Mobile).

## Plataformas Suportadas

### Desktop (via Electron & electron-builder)
- **Windows:** Executável portátil (.exe) para arquiteturas x64, ia32 (x86) e ARM64.
- **macOS:** Pacote Universal (x64 + ARM64) em formato .dmg.
- **Linux:** Pacotes .deb, .rpm, AppImage e Flatpak para múltiplas arquiteturas.

### Mobile (via Capacitor)
- **Android:** APK para arquiteturas ARM e x86.
- **iOS/iPadOS:** Projeto Xcode pronto para compilação.

## Como Compilar Localmente

### Pré-requisitos
- Node.js 20+
- Para Android: Android Studio & SDK
- Para iOS/macOS: Xcode (apenas em macOS)

### Comandos
```bash
# Instalar dependências
npm install

# Build para Web
npm run build

# Build para Desktop (Gera arquivos na pasta /release)
npm run electron:build:all

# Sincronizar para Mobile (Android/iOS)
npm run cap:build
```

## GitHub Actions (CI/CD)

O arquivo `.github/workflows/build.yml` está configurado para compilar automaticamente todas as versões sempre que houver um push na branch `main`.

Os artefatos gerados (APKs, EXEs, DMGs, DEBs, etc.) estarão disponíveis na aba **Actions** do seu repositório GitHub após a conclusão do workflow.

### Arquiteturas Incluídas
O sistema de build está configurado para gerar binários para:
- **x86 / ia32**
- **amd64 / x64**
- **arm (v7l)**
- **arm64**

---
*Nota: A compilação de iOS e macOS requer um runner macOS no GitHub Actions (incluído no workflow).*
