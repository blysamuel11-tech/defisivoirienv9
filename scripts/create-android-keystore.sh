#!/usr/bin/env bash
#
# create-android-keystore.sh — génère un keystore de signature Android
# (release) et le fichier android/keystore.properties correspondant.
#
# Pré-requis : JDK (keytool) disponible sur la machine. Le JDK 17 fourni par
# Android Studio suffit.
#
# Usage :
#   bash scripts/create-android-keystore.sh \
#       --alias gbe-moument \
#       --storepass "VotreMotDePasseSecret" \
#       --keypass "AutreMotDePasseSecret" \
#       --dname "CN=Gbê ou Moument, O=BlySamuel, C=CI"
#
# Par défaut (si aucun argument) : alias gbe-moument, mots de passe générés
# aléatoirement puis affichés UNE FOIS (conservez-les précieusement).
#
# ⚠️  Le fichier android/keystore.properties et le .keystore sont ignorés par
# git. Ne commitez jamais ces secrets. Sans le keystore vous ne pourrez pas
# mettre à jour l'app publiée.

set -euo pipefail
cd "$(dirname "$0")/.."

ALIAS="gbe-moument"
STOREPASS=""
KEYPASS=""
DNAME="CN=Gbê ou Moument, O=BlySamuel, C=CI"
KEYS_DIR="android"
KEYSTORE="$KEYS_DIR/gbe-moument-release.keystore"
PROPS="$KEYS_DIR/keystore.properties"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --alias) ALIAS="$2"; shift 2;;
    --storepass) STOREPASS="$2"; shift 2;;
    --keypass) KEYPASS="$2"; shift 2;;
    --dname) DNAME="$2"; shift 2;;
    *) echo "Option inconnue: $1"; exit 1;;
  esac
done

if ! command -v keytool >/dev/null 2>&1; then
  echo "❌ keytool introuvable. Installez un JDK (ex. via Android Studio) et réessayez."
  exit 1
fi

# Générer des mots de passe aléatoires si non fournis
RANDOM_GEN=0
if [[ -z "$STOREPASS" ]]; then STOREPASS=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24); RANDOM_GEN=1; fi
if [[ -z "$KEYPASS" ]]; then KEYPASS=$(openssl rand -base64 18 | tr -d '/+=' | head -c 24); RANDOM_GEN=1; fi

mkdir -p "$KEYS_DIR"

# Générer le keystore (validité 10000 jours ≈ 27 ans)
keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$STOREPASS" \
  -keypass "$KEYPASS" \
  -dname "$DNAME" 2>&1 | grep -v "Entrez le mot de passe" || true

# Écrire keystore.properties (relatif à android/app, d'où ../)
cat > "$PROPS" <<EOF
# Généré par scripts/create-android-keystore.sh
storeFile=../gbe-moument-release.keystore
storePassword=$STOREPASS
keyAlias=$ALIAS
keyPassword=$KEYPASS
EOF

chmod 600 "$KEYSTORE" "$PROPS"

echo ""
echo "✅ Keystore créé :"
echo "   Fichier : $KEYSTORE"
echo "   Alias   : $ALIAS"
echo ""
echo "📄 Config de signature écrite : $PROPS (hors git)"

if [[ "$RANDOM_GEN" == "1" ]]; then
  echo ""
  echo "🔐 MOTS DE PASSE GÉNÉRÉS (à conserver — plus jamais affichés) :"
  echo "   storePassword : $STOREPASS"
  echo "   keyPassword   : $KEYPASS"
fi
echo ""
echo "➡️  Compilez ensuite un APK release signé :"
echo "   npm run build && npx cap sync android && bash scripts/build-android.sh"
echo "   → android/app/build/outputs/apk/release/app-release.apk (signé)"
