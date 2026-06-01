#!/bin/bash

# Script de Compilação Automatizada - BrModelo R (macOS)
# Este script verifica dependências, instala o necessário e compila o projeto.

echo "====================================================="
echo "   BrModelo R - Assistente de Compilação (macOS)     "
echo "====================================================="
echo ""

# Função para verificar se um comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificações básicas
if ! command_exists brew; then
  echo "[!] Homebrew não encontrado. Instalando Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

if ! command_exists node; then
  echo "[!] Node.js não encontrado. Instalando via Homebrew..."
  brew install node
fi

echo "Dependências básicas (Node/npm) OK."
echo ""

echo "O que você deseja compilar?"
echo "1) Versão Web (Gera a pasta dist/ para hospedagem)"
echo "2) Versão Android (Gera o APK)"
echo "3) Versão iOS / iPadOS (Abre o Xcode)"
echo "4) Versão Desktop (Gera executáveis Linux, Windows, Mac via Electron)"
echo "5) Versão Servidor (Gera executáveis do Backend para Linux, Windows, Mac e Android/ARM)"
echo "6) Sair"
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
      echo "[!] Java não encontrado. Instalando OpenJDK..."
      brew install openjdk@17
    fi

    if [ -z "$ANDROID_HOME" ]; then
      export ANDROID_HOME=$HOME/Library/Android/sdk
      export PATH=$PATH:$ANDROID_HOME/emulator
      export PATH=$PATH:$ANDROID_HOME/tools
      export PATH=$PATH:$ANDROID_HOME/tools/bin
      export PATH=$PATH:$ANDROID_HOME/platform-tools
    fi

    echo "1. Instalando dependências Node..."
    npm install

    echo "2. Compilando projeto Web..."
    npm run build

    echo "3. Sincronizando com Capacitor..."
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
      echo "Passo 1: Gerar sua chave:"
      echo "keytool -genkey -v -keystore brmodelo.keystore -alias brmodelo_alias -keyalg RSA -keysize 2048 -validity 10000"
      echo ""
      echo "Passo 2: Assinar os APKs:"
      echo "apksigner sign --ks brmodelo.keystore --out BrModelo-R.apk $APK_CLIENT"
      echo "apksigner sign --ks brmodelo.keystore --out BrModelo-R-Server.apk $APK_SERVER"
    else
      echo "❌ Falha ao gerar os APKs."
    fi
    ;;
  3)
    echo "Iniciando preparação para iOS / iPadOS..."
    npm install
    npm run build
    npx cap sync ios
    npx capacitor-assets generate --ios 2>/dev/null
    echo "✅ Projeto iOS sincronizado. Abrindo Xcode..."
    npx cap open ios
    ;;
  4)
    echo "Iniciando compilação Desktop (Electron)..."
    npm install
    npm run build:client
    npm run build:server-app
    npx electron-builder build --config electron-builder-client.json -mwl --x64 --arm64
    npx electron-builder build --config electron-builder-server.json -mwl --x64 --arm64
    echo "✅ Compilação Desktop (Mac, Windows, Linux) concluída! Os executáveis estão na pasta 'release/'."
    ;;
  5)
    echo "Iniciando compilação do App Servidor (Standalone)..."
    npm install
    npm run pkg:server
    echo "✅ Compilação do Servidor concluída! Os executáveis estão na pasta 'release-server/'."
    ;;
  6)
    echo "Saindo..."
    exit 0
    ;;
  *)
    echo "Opção inválida."
    exit 1
    ;;
esac
