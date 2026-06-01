@echo off
:: Script de Compilação Automatizada - BrModelo R (Windows)
:: Este script verifica dependências e compila o projeto.

echo =====================================================
echo    BrModelo R - Assistente de Compilação (Windows)
echo =====================================================
echo.

:: Verificações básicas
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js não encontrado. Por favor, instale o Node.js (v18+).
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] npm não encontrado. Instale o npm junto com o Node.js.
    pause
    exit /b 1
)

echo Dependências básicas (Node/npm) OK.
echo.

echo O que você deseja compilar?
echo 1) Versão Web (Gera a pasta dist/)
echo 2) Versão Android (Gera o APK)
echo 3) Versão Desktop (Gera executáveis .exe via Electron)
echo 4) Versão Servidor (Gera executáveis standalone do Backend)
echo 5) Sair
set /p opcao="Digite o número da opção desejada: "

if "%opcao%"=="1" goto web
if "%opcao%"=="2" goto android
if "%opcao%"=="3" goto desktop
if "%opcao%"=="4" goto server
if "%opcao%"=="5" goto sair

:web
echo Iniciando compilação Web...
call npm install
call npm run build
echo ✅ Compilação Web concluída! Os arquivos estão na pasta 'dist/'.
pause
goto sair

:android
echo Iniciando compilação Android...
call npm install
call npm run build
call npx cap sync android

echo Gerando icones e compilando APK Cliente...
if exist icone.png (
    if not exist assets mkdir assets
    copy /Y icone.png assets\icon.png
    copy /Y icone.png assets\splash.png
    call npx @capacitor/assets generate --android
)
cd android
if not exist gradlew.bat (
    echo    (Aviso: gradlew.bat nao encontrado, tentando recriar a plataforma Android...)
    cd ..
    rmdir /S /Q android
    call npx cap add android
    node configure_android.js
    cd android
)
call gradlew.bat :app:assembleClientRelease
cd ..

echo Gerando icones e compilando APK Servidor...
if exist icone-server.png (
    if not exist assets mkdir assets
    copy /Y icone-server.png assets\icon.png
    copy /Y icone-server.png assets\splash.png
    call npx @capacitor/assets generate --android
)
cd android
if not exist gradlew.bat (
    echo    (Aviso: gradlew.bat nao encontrado, tentando recriar a plataforma Android...)
    cd ..
    rmdir /S /Q android
    call npx cap add android
    node configure_android.js
    cd android
)
call gradlew.bat :app:assembleServerRelease
cd ..
echo ✅ Compilação Android concluída!
echo Os APKs estão nas pastas:
echo - Cliente: android\app\build\outputs\apk\client\release\
echo - Servidor: android\app\build\outputs\apk\server\release\
pause
goto sair

:desktop
echo Iniciando compilação Desktop (Electron)...
echo 1) Cliente apenas
echo 2) Servidor apenas
echo 3) Ambos
set /p desc_opt="Opcao: "

call npm install

if "%desc_opt%"=="1" (
    call npm run build:client
    call npx electron-builder build --config electron-builder-client.json --win portable --x64 --ia32
) else if "%desc_opt%"=="2" (
    call npm run build:server-app
    call npx electron-builder build --config electron-builder-server.json --win portable --x64 --ia32
) else (
    call npm run build:client
    call npx electron-builder build --config electron-builder-client.json --win portable --x64 --ia32
    call npm run build:server-app
    call npx electron-builder build --config electron-builder-server.json --win portable --x64 --ia32
)

echo ✅ Compilação Desktop concluída! Os executáveis estão na pasta 'release/'.
pause
goto sair

:server
echo Iniciando compilação do App Servidor (Standalone)...
call npm install
call npm run pkg:server
echo ✅ Compilação do Servidor concluída! Os executáveis estão na pasta 'release-server/'.
pause
goto sair

:sair
exit /b 0
