#!/usr/bin/env bash
#
# build-android.sh — compile le projet Capacitor en APK Android.
#
# Pré-requis :
#   - JDK 17+  (java -version)
#   - Android SDK avec API 36 + build-tools, et la variable ANDROID_HOME définie,
#     OU l'éditeur de localisation Android dans ~/.config or ~/.android/local.properties
#   - Avoir déjà lancé :  npm install && npm run build && npx cap sync android
#
# Sorties (selon la config Gradle) :
#   android/app/build/outputs/apk/debug/app-debug.apk
#   android/app/build/outputs/apk/release/app-release-unsigned.apk

set -euo pipefail
cd "$(dirname "$0")/../android"

echo "➡️  Construction de l'APK Android (Gradle)…"

# Le wrapper Gradle télécharge la version requise automatiquement (réseau requis).
./gradlew assembleDebug assembleRelease --no-daemon

echo ""
echo "✅ Terminé ! APK disponibles :"
echo "   - android/app/build/outputs/apk/debug/app-debug.apk"
echo "   - android/app/build/outputs/apk/release/app-release-unsigned.apk"
