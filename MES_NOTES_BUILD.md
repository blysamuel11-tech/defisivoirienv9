# 🛠️ MES NOTES DE BUILD — « Gbê ou Moument »

Guide personnel pour générer l'APK Android (test puis **signé** à partager) depuis ma machine.
Ce fichier est conservé dans le dépôt pour ne pas perdre la procédure.

---

## ✅ Prérequis (une seule installation)

| Outil | Version | Test | Installation |
|---|---|---|---|
| **Node.js** | 18+ | `node -v` | nodejs.org |
| **JDK** | 17+ | `java -version` | Temurin 17 (Adoptium) |
| **Android Studio / SDK** | SDK API 36 + build-tools | `echo $ANDROID_HOME` | developer.android.com |

- Dans **Android Studio → SDK Manager** : cocher *Android SDK Platform 36* et *Build-Tools*.
- Définir la variable d'environnement **`ANDROID_HOME`** :
  - Windows : `C:\Users\<Vous>\AppData\Local\Android\Sdk`
  - macOS : `~/Library/Android/sdk`
  - Linux : `$HOME/Android/Sdk`

> ⚠️ Le build télécharge **Gradle 8.14.3** + les dépendances → une **connexion internet** est requise sur la machine.

---

## 📥 1. Récupérer la dernière version du code

```bash
git clone https://github.com/blysamuel11-tech/defisivoirienv9.git
cd defisivoirienv9
git checkout arena/01a06de6-defisivoirienv9
git pull origin arena/01a06de6-defisivoirienv9
```

---

## 🧪 2. APK de TEST (debug) — à installer sur mon téléphone

```bash
./build-apk.sh
```

Sur Windows (via Git Bash) :
```bash
bash build-apk.sh
```

Le script enchaîne : `npm install` → `npm run build` → `npx cap sync android` → `gradlew assembleDebug`.

**Résultat :** `android/app/build/outputs/apk/debug/app-debug.apk`

> Première exécution = longue (téléchargement de Gradle + dépendances). Normal.

### Installer sur le téléphone
- **USB** : activer *mode développeur* + *débogage USB*, brancher, puis :
  ```bash
  cd android && ./gradlew installDebug
  ```
- **Direct** : copier `app-debug.apk` sur le téléphone → l'ouvrir → autoriser « sources inconnues ».

---

## 📦 3. APK RELEASE SIGNÉ — à partager avec mes amis

Un APK **release signé** s'installe sur n'importe quel téléphone et ne se désinstalle pas
automatiquement au redémarrage. Il utilise un **keystore** (clé de signature).

### 3.1 Générer le keystore (à faire UNE fois, à conserver précieusement)

```bash
bash scripts/create-android-keystore.sh --alias gbe-moument
```
- Crée `android/gbe-moument-release.keystore` + `android/keystore.properties`.
- **Si les mots de passe sont générés aléatoirement, ils sont affichés UNE seule fois** → notez-les.
- Ces deux fichiers sont **ignorés par git** (jamais partagés).

> 🔐 **IMPORTANT** : sans ce keystore et ses mots de passe, vous ne pourrez **jamais**
> mettre à jour une app déjà publiée avec. Sauvegardez-les (fichier + mots de passe) en lieu sûr.

> Pour la production (Play Store), choisissez vos propres mots de passe :
> ```bash
> bash scripts/create-android-keystore.sh --alias gbe-moument \
>   --storepass "MotDePasseDuKeystoreLong" \
>   --keypass "MotDePasseDeLaClef"
> ```

### 3.2 Compiler l'APK release signé

```bash
./build-apk.sh --release --sign
```

**Résultat signé :** `android/app/build/outputs/apk/release/app-release.apk`

> La signature est activée automatiquement parce que `android/keystore.properties` existe.
> Sans lui, `./build-apk.sh --release` produirait un APK *unsigned*.

### 3.3 Partager
- Envoyez le fichier **`app-release.apk`** à vos amis (WhatsApp, Drive, lien…).
- Ils devront autoriser « Installer depuis des sources inconnues » (1× par téléphone).

---

## 🔁 Rebuild après une modification du code

```bash
git pull origin arena/01a06de6-defisivoirienv9
./build-apk.sh            # debug
# ou
./build-apk.sh --release --sign   # signé
```

---

## 🖼️ Partie iOS (Mac + Xcode uniquement)

```bash
./build-ios.sh            # prépare et ouvre le projet dans Xcode
```
Dans Xcode : choisir son **team** (Signing), son iPhone, **▶ Run** pour tester,
ou **Product → Archive → Distribute App** pour l'`.ipa`.

---

## 📸 Tester la preuve Caméra / Galerie (après installation)
1. Ouvrir l'app → profil → **Salon** → lancer une partie.
2. Choisir **MOUMENT (ACTION)** → à la validation, bouton « PREUVE REQUISE » désactivé.
3. **CAMÉRA / GALERIE** → accepter les permissions (caméra/galerie, + micro pour la vidéo).
4. Joindre photo/vidéo → le bouton devient « SOUMETTRE AUX VOTES » → elle apparaît dans le vote.

---

## 🔧 Dépannage rapide

| Problème | Solution |
|---|---|
| `java` introuvable | Installer JDK 17, définir `JAVA_HOME`. |
| SDK introuvable | Vérifier `ANDROID_HOME` ; installer SDK 36 via SDK Manager. |
| Erreur de téléchargement Gradle | Vérifier la connexion internet ; relancer. |
| Erreur SDK 36 | Installer « Android SDK Platform 36 ». |
| APK non signé | `android/keystore.properties` absent → lancer `create-android-keystore.sh`. |

---

## 🗂️ Emplacements des sorties

| Build | Chemin |
|---|---|
| APK debug | `android/app/build/outputs/apk/debug/app-debug.apk` |
| APK release signé | `android/app/build/outputs/apk/release/app-release.apk` |
| APK release unsigned | `android/app/build/outputs/apk/release/app-release-unsigned.apk` |
| Keystore | `android/gbe-moument-release.keystore` (hors git) |
| Config signature | `android/keystore.properties` (hors git) |
