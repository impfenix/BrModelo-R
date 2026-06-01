import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(buildGradlePath)) {
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Add abiFilters if not present
    if (!buildGradle.includes("abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64', 'riscv64'")) {
        buildGradle = buildGradle.replace(
            /defaultConfig\s*\{/,
            `defaultConfig {\n        ndk {\n            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64', 'riscv64'\n        }`
        );
    }

    // Add productFlavors if not present
    if (!buildGradle.includes('flavorDimensions "appType"')) {
        const flavors = `
    flavorDimensions "appType"
    productFlavors {
        client {
            dimension "appType"
            applicationId "com.brmodelo.app"
            manifestPlaceholders = [appName: "BrModelo R", appIcon: "@mipmap/ic_launcher", appIconRound: "@mipmap/ic_launcher_round"]
        }
        server {
            dimension "appType"
            applicationId "com.brmodelo.server"
            manifestPlaceholders = [appName: "BrModelo R Server", appIcon: "@mipmap/ic_launcher", appIconRound: "@mipmap/ic_launcher_round"]
        }
    }
`;
        buildGradle = buildGradle.replace(
            /buildTypes\s*\{/,
            flavors + '\n    buildTypes {'
        );
    }
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('✅ android/app/build.gradle configurado com sucesso.');
}

if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    
    // Replace hardcoded app name and icons with placeholders
    manifest = manifest.replace(/android:label="[^"]*"/g, 'android:label="${appName}"');
    manifest = manifest.replace(/android:icon="[^"]*"/g, 'android:icon="${appIcon}"');
    manifest = manifest.replace(/android:roundIcon="[^"]*"/g, 'android:roundIcon="${appIconRound}"');
    
    fs.writeFileSync(manifestPath, manifest);
    console.log('✅ AndroidManifest.xml configurado com sucesso.');
}
