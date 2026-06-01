#!/bin/bash

# Este script compila as versões Android (Cliente e Servidor) via CLI (sem Android Studio)
# Certifique-se de ter o JDK 17 (ou superior) e o Android CMDLINE Tools instalados e as variáveis de ambiente ANDROID_HOME definidas.

echo "Iniciando compilação do Android nativo via CLI..."

echo "======================================"
echo "Verificando ambiente..."
if ! command -v java &> /dev/null; then
    echo "❌ Java (JDK) não encontrado. Por favor, instale o openjdk-17-jdk."
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️ A variável ANDROID_HOME não está definida."
    echo "Como configurar via CLI no Linux (Debian/Ubuntu):"
    echo "  sudo apt install openjdk-17-jdk wget unzip"
    echo "  mkdir -p ~/Android/Sdk/cmdline-tools"
    echo "  wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    echo "  unzip commandlinetools-linux-11076708_latest.zip -d ~/Android/Sdk/cmdline-tools"
    echo "  mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest"
    echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools"
    echo "  yes | sdkmanager --licenses"
    echo "  sdkmanager \"platform-tools\" \"platforms;android-34\" \"build-tools;34.0.0\""
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N) " resp
    if [[ ! "$resp" =~ ^[sS]$ ]]; then
        exit 1
    fi
fi

# Inicializando platforma android se não existir
if [ ! -d "android" ]; then
    echo "📁 A pasta 'android' não existe. Adicionando plataforma Android via Capacitor..."
    npm run build:client
    npx cap add android
fi

# Aplicar a configuração de flavors e permissões se tiver o script
if [ -f "configure_android.js" ]; then
    echo "⚙️  Configurando AndroidManifest.xml e build.gradle com os flavors (client/server)..."
    node configure_android.js
fi

SIGN_ARGS=""
if [ -f "brmodelo-key.jks" ]; then
    echo ""
    echo "🔑 Keystore 'brmodelo-key.jks' encontrado!"
    echo "Deseja assinar os APKs automaticamente agora? (s/N)"
    read -p "Opção: " sign_opt
    if [[ "$sign_opt" =~ ^[sS]$ ]]; then
        read -sp "Senha do Keystore: " KS_PASS
        echo ""
        read -p "Alias da Chave (ex: brmodelo, key0): " KS_ALIAS
        read -sp "Senha da Chave: " KEY_PASS
        echo ""
        # Passar os parametros de build para o Gradle embutir a assinatura
        SIGN_ARGS="-Pandroid.injected.signing.store.file=$PWD/brmodelo-key.jks -Pandroid.injected.signing.store.password=$KS_PASS -Pandroid.injected.signing.key.alias=$KS_ALIAS -Pandroid.injected.signing.key.password=$KEY_PASS"
    fi
fi

# Escolher qual Flavor construir
echo ""
echo "Escolha o que deseja compilar para Android:"
echo "1) Cliente APK"
echo "2) Servidor APK"
echo "3) Ambos (Cliente e Servidor APK)"
read -p "Opção: " opt_android

mkdir -p release/android

case $opt_android in
  1)
    echo "🚀 Compilando o Frontend/Cliente (React)..."
    npm run build:client
    echo "🔄 Sincronizando arquivos com o Capacitor (Android)..."
    npx cap sync android
    echo "🔨 Compilando APK via Gradle (assembleClientRelease)..."
    cd android
    ./gradlew assembleClientRelease $SIGN_ARGS
    cd ..
    mkdir -p release/client
    APK_FILE=$(find android/app/build/outputs/apk/client/release -name "*.apk" | head -n 1)
    if [ -n "$APK_FILE" ]; then
        cp "$APK_FILE" "release/client/BrModelo R-1.0.0-universal.apk"
        echo "✅ Cliente Android compilado e movido para release/client/BrModelo R-1.0.0-universal.apk"
    else
        echo "❌ APK não encontrado em android/app/build/outputs/apk/client/release"
    fi
    ;;
  2)
    echo "🚀 Compilando o Frontend/Servidor (React)..."
    npm run build:server-app
    echo "🔄 Sincronizando arquivos com o Capacitor (Android)..."
    npx cap sync android
    echo "🔨 Compilando APK via Gradle (assembleServerRelease)..."
    cd android
    ./gradlew assembleServerRelease $SIGN_ARGS
    cd ..
    mkdir -p release/server
    APK_FILE=$(find android/app/build/outputs/apk/server/release -name "*.apk" | head -n 1)
    if [ -n "$APK_FILE" ]; then
        cp "$APK_FILE" "release/server/BrModelo R Server-1.0.0-universal.apk"
        echo "✅ Servidor Android compilado e movido para release/server/BrModelo R Server-1.0.0-universal.apk"
    else
        echo "❌ APK não encontrado em android/app/build/outputs/apk/server/release"
    fi
    ;;
  3)
    echo "========== INICIANDO PARTE 1: CLIENTE =========="
    echo "🚀 Compilando o Frontend/Cliente (React)..."
    npm run build:client
    echo "🔄 Sincronizando arquivos com o Capacitor (Android)..."
    npx cap sync android
    echo "🔨 Compilando APK via Gradle (assembleClientRelease)..."
    cd android
    ./gradlew assembleClientRelease $SIGN_ARGS
    cd ..
    mkdir -p release/client
    APK_FILE=$(find android/app/build/outputs/apk/client/release -name "*.apk" | head -n 1)
    if [ -n "$APK_FILE" ]; then
        cp "$APK_FILE" "release/client/BrModelo R-1.0.0-universal.apk"
    fi
    
    echo "========== INICIANDO PARTE 2: SERVIDOR =========="
    echo "🚀 Compilando o Frontend/Servidor (React)..."
    npm run build:server-app
    echo "🔄 Sincronizando arquivos com o Capacitor (Android)..."
    npx cap sync android
    echo "🔨 Compilando APK via Gradle (assembleServerRelease)..."
    cd android
    ./gradlew assembleServerRelease $SIGN_ARGS
    cd ..
    mkdir -p release/server
    APK_FILE_SERVER=$(find android/app/build/outputs/apk/server/release -name "*.apk" | head -n 1)
    if [ -n "$APK_FILE_SERVER" ]; then
        cp "$APK_FILE_SERVER" "release/server/BrModelo R Server-1.0.0-universal.apk"
    fi
    
    echo "✅ Cliente e Servidor compilados com sucesso nas pastas release/client/ e release/server/"
    ;;
  *)
    echo "Opção inválida. Saindo."
    exit 1
    ;;
esac

echo "🎉 Build Android concluído com sucesso!"
