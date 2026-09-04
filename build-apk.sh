#!/usr/bin/env bash
#
# build-apk.sh — génère l'APK Android de « Gbê ou Moument » en une commande.
#
# Ce script enchaîne automatiquement :
#   1. installation des dépendances (npm install)
#   2. compilation du web React → dist/
#   3. synchronisation Capacitor → projet natif android/
#   4. compilation Gradle → APK
#
# Utilisation :
#   ./build-apk.sh                  → APK debug (installation sur téléphone)
#   ./build-apk.sh --release        → APK release (signé si keystore présent, sinon unsigned)
#   ./build-apk.sh --release --sign → tente de créer le keystore si absent, puis signé
#
# Pré-requis :
#   - Node.js 18+
#   - Android Studio / Android SDK (API 36 + build-tools)
#   - Java JDK 17+
#   - Variable ANDROID_HOME définie (ou SDK connu de Gradle)
#
# Sorties :
#   android/app/build/outputs/apk/debug/app-debug.apk
#   android/app/build/outputs/apk/release/app-release.apk        (si signé)
#   android/app/build/outputs/apk/release/app-release-unsigned.apk
#
set -euo pipefail
cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Options par défaut
# ---------------------------------------------------------------------------
MODE="debug"        # debug | release
SIGN_RELEASE=false  # pour --release, forcer la création du keystore si absent
CLEAN=false

usage() {
  sed -n '2,24p' "$0"
  exit 0
}

# ---------------------------------------------------------------------------
# Lecture des arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --release) MODE="release"; shift;;
    --sign)    SIGN_RELEASE=true; shift;;
    --clean)   CLEAN=true; shift;;
    -h|--help) usage;;
    *) echo "Option inconnue : $1"; usage;;
  esac
done

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🎯 Build APK Android — Gbê ou Moument"
echo "  Mode : $MODE"
echo "══════════════════════════════════════════════════════════"
echo ""

# ---------------------------------------------------------------------------
# Vérification des pré-requis
# ---------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || { echo "❌ Node.js introuvable. Installez Node 18+."; exit 1; }
command -v java  >/dev/null 2>&1 || { echo "❌ Java (JDK) introuvable. Installez le JDK 17+."; exit 1; }

# ---------------------------------------------------------------------------
# 1) Dépendances
# ---------------------------------------------------------------------------
echo "📦 [1/4] Installation des dépendances (npm install)…"
if ! command -v npm >/dev/null 2>&1; then echo "❌ npm introuvable."; exit 1; fi
npm install

# ---------------------------------------------------------------------------
# 2) Build web
# ---------------------------------------------------------------------------
echo ""
echo "🧱 [2/4] Compilation web React (vite build)…"
npm run build

# ---------------------------------------------------------------------------
# 3) Sync Capacitor
# ---------------------------------------------------------------------------
echo ""
echo "🔗 [3/4] Synchronisation Capacitor (android)…"
npx cap sync android

# ---------------------------------------------------------------------------
# 3b) Signature release optionnelle
# ---------------------------------------------------------------------------
if [[ "$MODE" == "release" ]]; then
  KEYSTORE_PROP="android/keystore.properties"
  if [[ ! -f "$KEYSTORE_PROP" ]] && [[ "$SIGN_RELEASE" == "true" ]]; then
    echo ""
    echo "🔑 Aucun keystore détecté. Création d'un keystore de développement…"
    bash scripts/create-android-keystore.sh --alias gbe-moument
  fi
  if [[ -f "$KEYSTORE_PROP" ]]; then
    echo ""
    echo "✅ Signature release détectée (keystore.properties) → APK signé."
  else
    echo ""
    echo "ℹ️  Pas de signature release : l'APK sera 'unsigned'. Pour un APK signé :"
    echo "   ./build-apk.sh --release --sign"
  fi
fi

# ---------------------------------------------------------------------------
# 4) Build Gradle
# ---------------------------------------------------------------------------
echo ""
echo "⚙️  [4/4] Compilation Gradle (assemble$([ "$MODE" = "release" ] && echo Release || echo Debug))…"
cd android
if [[ "$CLEAN" == "true" ]]; then
  ./gradlew clean
fi
if [[ "$MODE" == "release" ]]; then
  ./gradlew assembleRelease --no-daemon
else
  ./gradlew assembleDebug --no-daemon
fi
cd ..

# ---------------------------------------------------------------------------
# Résultat
# ---------------------------------------------------------------------------
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ Build terminé !"
echo "══════════════════════════════════════════════════════════"

case "$MODE" in
  debug)
    APK="android/app/build/outputs/apk/debug/app-debug.apk"
    ;;
  release)
    if [[ -f "android/keystore.properties" ]]; then
      APK="android/app/build/outputs/apk/release/app-release.apk"
    else
      APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
    fi
    ;;
esac

if [[ -f "$APK" ]]; then
  SIZE=$(du -h "$APK" | cut -f1)
  echo ""
  echo "   📦 $APK   ($SIZE)"
  echo ""
  echo "   Pour installer sur un téléphone Android branché (débogage USB activé) :"
  echo "   cd android && ./gradlew install$([ "$MODE" = "release" ] && echo Release || echo Debug)"
else
  echo ""
  echo "   ⚠️  APK introuvable à l'emplacement attendu. Consultez la sortie Gradle ci-dessus."
fi
echo ""
