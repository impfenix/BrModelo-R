#!/bin/bash

# Script de Compilação Automatizada - BrModelo R (Linux)
# Este script verifica dependências, instala o necessário e compila o projeto.

echo "====================================================="
echo "   BrModelo R - Assistente de Compilação (Linux)     "
echo "====================================================="
echo ""

# Função para verificar se um comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificações básicas
if ! command_exists node; then
  echo "[!] Node.js não encontrado. Por favor, instale o Node.js (v18+)."
  echo "    Sugestão: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi

if ! command_exists npm; then
  echo "[!] npm não encontrado. Instale o npm junto com o Node.js."
  exit 1
fi

echo "Dependências básicas (Node/npm) OK."
echo ""

echo "O que você deseja compilar?"
echo "1) Versão Web (Gera a pasta dist/ para hospedagem)"
echo "2) Versão Android (Gera o APK)"
echo "3) Versão Desktop (Gera executáveis Linux, Windows, Mac via Electron)"
echo "4) Versão Servidor (Gera executáveis do Backend para Linux, Windows, Mac e Android/ARM)"
echo "5) Sair"
read -p "Digite o número da opção desejada: " opcao

case $opcao in
  1)
    echo "Iniciando compilação Web..."
    npm install
    npm run build
    echo "✅ Compilação Web concluída! Os arquivos estão na pasta 'dist/'."
    ;;
  2)
    echo "Iniciando compilação Android..."
    
    if ! command_exists java; then
      echo "[!] Java não encontrado. Instalando OpenJDK 17..."
      sudo apt-get update && sudo apt-get install -y openjdk-17-jdk
    fi

    if [ -z "$ANDROID_HOME" ]; then
      echo "[!] Variável ANDROID_HOME não definida."
      echo "    Certifique-se de que o Android Studio / SDK Command Line Tools está instalado."
      echo "    Normalmente fica em ~/Android/Sdk"
      read -p "Deseja continuar mesmo assim? (s/n): " cont
      if [ "$cont" != "s" ]; then exit 1; fi
    fi

    echo "1. Instalando dependências Node..."
    npm install

    echo "2. Compilando projeto Web..."
    npm run build

    echo "3. Verificando plataforma Android..."
    if [ ! -d "android" ]; then
      echo "[!] Pasta 'android' não encontrada. Adicionando plataforma..."
      npx cap add android
    fi
    npx cap sync android

    echo "4. Gerando ícones e compilando APK Cliente..."
    if [ -f "icone.png" ]; then
      mkdir -p assets
      cp icone.png assets/icon.png
      cp icone.png assets/splash.png
      npx @capacitor/assets generate --android 2>/dev/null || echo "   (Aviso: @capacitor/assets falhou)"
    fi
    if [ ! -d "android" ] || [ ! -f "android/gradlew" ]; then
      echo "   (Aviso: gradlew não encontrado, tentando recriar a plataforma Android...)"
      rm -rf android
      npx cap add android
      node configure_android.js
    fi
    chmod +x android/gradlew
    cd android
    ./gradlew :app:assembleClientRelease
    cd ..

    echo "5. Gerando ícones e compilando APK Servidor..."
    if [ -f "icone-server.png" ]; then
      mkdir -p assets
      cp icone-server.png assets/icon.png
      cp icone-server.png assets/splash.png
      npx @capacitor/assets generate --android 2>/dev/null || echo "   (Aviso: @capacitor/assets falhou)"
    fi
    if [ ! -d "android" ] || [ ! -f "android/gradlew" ]; then
      echo "   (Aviso: gradlew não encontrado, tentando recriar a plataforma Android...)"
      rm -rf android
      npx cap add android
      node configure_android.js
    fi
    chmod +x android/gradlew
    cd android
    ./gradlew :app:assembleServerRelease
    cd ..

    APK_CLIENT="android/app/build/outputs/apk/client/release/app-client-release-unsigned.apk"
    APK_SERVER="android/app/build/outputs/apk/server/release/app-server-release-unsigned.apk"
    
    if [ -f "$APK_CLIENT" ] && [ -f "$APK_SERVER" ]; then
      echo "✅ APKs gerados com sucesso!"
      echo "   - Cliente: $APK_CLIENT"
      echo "   - Servidor: $APK_SERVER"
      echo ""
      echo "====================================================="
      echo "   INSTRUÇÕES PARA ASSINAR OS APKs (Obrigatório)     "
      echo "====================================================="
      echo "Para instalar no celular, você precisa assinar os APKs."
      echo ""
      echo "Passo 1: Gerar sua chave (execute apenas uma vez na vida):"
      echo "keytool -genkey -v -keystore brmodelo.keystore -alias brmodelo_alias -keyalg RSA -keysize 2048 -validity 10000"
      echo ""
      echo "Passo 2: Assinar os APKs:"
      echo "apksigner sign --ks brmodelo.keystore --out BrModelo-R.apk $APK_CLIENT"
      echo "apksigner sign --ks brmodelo.keystore --out BrModelo-R-Server.apk $APK_SERVER"
      echo ""
      echo "Se o 'apksigner' não estiver no seu PATH, ele fica na pasta do Android SDK (build-tools/)."
    else
      echo "❌ Falha ao gerar os APKs. Verifique se o Android SDK e o Gradle estão configurados corretamente."
    fi
    ;;
  3)
    echo "Iniciando compilação Desktop (Electron)..."
    echo "Lembrete: Este script no Linux não gera nativamente DMG (Mac) sem uma conta de dev da Apple, e EXE (Windows) requer o Wine instalado no Linux. Use os scripts build_mac.sh ou build_windows.bat nos respectivos sistemas para melhor compatibilidade."
    echo ""
    echo "Escolha o formato de empacotamento para Linux (Cliente e Servidor):"
    echo "1) Todos (AppImage, deb, rpm, flatpak, tar.xz)"
    echo "2) Apenas AppImage"
    echo "3) Apenas .deb (Debian/Ubuntu)"
    echo "4) Apenas .rpm (Fedora/RedHat/SUSE)"
    echo "5) Apenas Flatpak"
    echo "6) Apenas Windows (.exe NSIS/Portable) - requer Wine"
    echo "7) Voltar"
    read -p "Opção: " desktop_opt
    
    npm install
    npm run build:client
    npm run build:server-app

    case $desktop_opt in
      1) 
        npx electron-builder build --config electron-builder-client.json --linux AppImage deb rpm flatpak tar.xz --x64 --arm64
        npx electron-builder build --config electron-builder-server.json --linux AppImage deb rpm flatpak tar.xz --x64 --arm64
        ;;
      2) 
        npx electron-builder build --config electron-builder-client.json --linux AppImage --x64 --arm64
        npx electron-builder build --config electron-builder-server.json --linux AppImage --x64 --arm64
        ;;
      3) 
        npx electron-builder build --config electron-builder-client.json --linux deb --x64 --arm64
        npx electron-builder build --config electron-builder-server.json --linux deb --x64 --arm64
        ;;
      4) 
        npx electron-builder build --config electron-builder-client.json --linux rpm --x64 --arm64
        npx electron-builder build --config electron-builder-server.json --linux rpm --x64 --arm64
        ;;
      5) 
        npx electron-builder build --config electron-builder-client.json --linux flatpak --x64 --arm64
        npx electron-builder build --config electron-builder-server.json --linux flatpak --x64 --arm64
        ;;
      6)
        npx electron-builder build --config electron-builder-client.json --win portable --x64 --ia32
        npx electron-builder build --config electron-builder-server.json --win portable --x64 --ia32
        ;;
      *) exit 0 ;;
    esac
    
    echo "✅ Compilação Desktop concluída! Os executáveis estão nas subpastas apropriadas de 'release/'."
    ;;
  4)
    echo "Iniciando compilação do App Servidor (Standalone)..."
    echo "Arquiteturas suportadas: x64, ARM64, ARMv7 (Android/TVBox/Raspberry), RISC-V"
    npm install
    npm run pkg:server
    echo "✅ Compilação do Servidor concluída! Os executáveis estão na pasta 'release-server/'."
    ;;
  5)
    echo "Saindo..."
    exit 0
    ;;
  *)
    echo "Opção inválida."
    exit 1
    ;;
esac
