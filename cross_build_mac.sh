#!/bin/bash

# Este script faz "Cross-Compile" para Mac a partir do Linux usando o formato ZIP.

echo "Iniciando compilação do MacOS via CLI no Linux..."

# Aplicar a configuração de flavors
if [ -f "configure_android.js" ]; then
    node configure_android.js
fi

# Ajusta temporariamente os arquivos de configuração (client/server) para exportar para "zip" em vez de "dmg"
sed -i 's/"target": "dmg"/"target": "zip"/g' electron-builder-client.json
sed -i 's/"target": "dmg"/"target": "zip"/g' electron-builder-server.json

echo ""
echo "Escolha o que deseja compilar para Mac (ZIP):"
echo "1) Cliente"
echo "2) Servidor"
echo "3) Ambos"
read -p "Opção: " opt_mac

case $opt_mac in
  1)
    echo "🍏 Compilando Cliente MacOS (Intel x64 e Apple Silicon arm64)..."
    npm run build:client
    npx electron-builder build --config electron-builder-client.json --mac zip --x64 --arm64
    ;;
  2)
    echo "🍏 Compilando Servidor MacOS (Intel x64 e Apple Silicon arm64)..."
    npm run build:server-app
    npx electron-builder build --config electron-builder-server.json --mac zip --x64 --arm64
    ;;
  3)
    echo "🍏 Compilando Cliente e Servidor MacOS (Intel x64 e Apple Silicon arm64)..."
    npm run build:client
    npx electron-builder build --config electron-builder-client.json --mac zip --x64 --arm64
    npm run build:server-app
    npx electron-builder build --config electron-builder-server.json --mac zip --x64 --arm64
    ;;
  *)
    echo "Opção inválida. Saindo."
    ;;
esac

# Desfaz a alteração que fizemos de zip para dmg (volta ao padrão de segurança)
sed -i 's/"target": "zip"/"target": "dmg"/g' electron-builder-client.json
sed -i 's/"target": "zip"/"target": "dmg"/g' electron-builder-server.json

echo "🎉 Build de Mac concluído! Verifique a pasta 'release/client' ou 'release/server'."
