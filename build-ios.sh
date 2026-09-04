#!/usr/bin/env bash
#
# build-ios.sh — prépare l'application iOS de « Gbê ou Moument » en une commande.
#
# Ce script enchaîne automatiquement :
#   1. installation des dépendances (npm install)
#   2. compilation du web React → dist/
#   3. synchronisation Capacitor → projet natif ios/
#   4. ouverture du projet dans Xcode (ou affichage du chemin si Xcode absent)
#
# Utilisation :
#   ./build-ios.sh            → prépare et ouvre ios/App/App.xcodeproj dans Xcode
#   ./build-ios.sh --no-open  → prépare seulement, sans ouvrir Xcode
#   ./build-ios.sh --archive  → après préparation, ouvre Xcode pour Archiver
#
# Pré-requis :
#   - macOS avec Xcode + outils ligne de commande (xcode-select --install)
#   - Node.js 18+
#   - Compte Apple (gratuit pour tester sur appareil branché, payant pour diffuser)
#
set -euo pipefail
cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Options par défaut
# ---------------------------------------------------------------------------
OPEN_XCODE=true
ACTION="run"

usage() {
  sed -n '2,20p' "$0"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-open) OPEN_XCODE=false; shift;;
    --archive) ACTION="archive"; shift;;
    -h|--help) usage;;
    *) echo "Option inconnue : $1"; usage;;
  esac
done

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🍎 Préparation iOS — Gbê ou Moument"
echo "══════════════════════════════════════════════════════════"
echo ""

# ---------------------------------------------------------------------------
# Vérification des pré-requis
# ---------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || { echo "❌ Node.js introuvable. Installez Node 18+."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm introuvable."; exit 1; }

XCODEBUILD=""
if command -v xcodebuild >/dev/null 2>&1; then
  XCODEBUILD="xcodebuild"
fi
if [[ -z "$XCODEBUILD" ]]; then
  echo "⚠️  xcodebuild introuvable — ce script doit tourner sur macOS avec Xcode."
  echo "   (La préparation web/Capacitor reste possible, mais Xcode est requis"
  echo "   pour compiler et installer l'application iOS.)"
fi

# ---------------------------------------------------------------------------
# 1) Dépendances
# ---------------------------------------------------------------------------
echo "📦 [1/4] Installation des dépendances (npm install)…"
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
echo "🔗 [3/4] Synchronisation Capacitor (ios)…"
npx cap sync ios

# ---------------------------------------------------------------------------
# 4) Ouverture Xcode / infos
# ---------------------------------------------------------------------------
XCODEPROJ="ios/App/App.xcodeproj"
if [[ ! -d "$XCODEPROJ" ]]; then
  echo ""
  echo "❌ Projet Xcode introuvable : $XCODEPROJ"
  echo "   Le sync Capacitor aurait dû le créer. Vérifiez le dossier ios/."
  exit 1
fi

echo ""
if [[ "$OPEN_XCODE" == "true" ]] && [[ -n "$XCODEBUILD" ]]; then
  echo "📂 [4/4] Ouverture de Xcode…"
  if [[ "$ACTION" == "archive" ]]; then
    echo "   ▶ Pour archiver/diffuser : dans Xcode → Product → Archive, puis Distribute."
  else
    echo "   ▶ Pour installer sur votre iPhone : choisissez votre appareil puis cliquez ▶ Run."
  fi
  open "$XCODEPROJ"
else
  echo "✅ [4/4] Projet prêt (Xcode non ouvert)."
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ Préparation iOS terminée !"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "   📂 Projet Xcode : $XCODEPROJ"
if [[ -n "$XCODEBUILD" ]]; then
  echo "   Ouvrir manuellement :  open $XCODEPROJ"
else
  echo "   ℹ️  Compilez ce projet sur un Mac équipé de Xcode."
fi
echo ""
echo "   Dans Xcode, n'oubliez pas :"
echo "   1. Signing & Capabilities → choisir votre team (Bundle Identifier"
echo "      par défaut : com.gbeoumoument.app)."
echo "   2. Choisir votre iPhone branché comme cible."
echo "   3. ▶ Run pour tester, ou Product → Archive pour générer l'IPA."
echo ""
