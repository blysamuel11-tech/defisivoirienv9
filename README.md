# Gbê ou Moument — Application mobile native (Android & iOS)

**Application interactive de jeu de soirée « Vérité ou Action »** (Gbê ou Moument), adaptée
pour **mobile, tablette et ordinateur** avec les modes **Solo**, **Multi**, **Avatars**,
**Création IA** et **Bibliothèque**.

Le cœur de l'application est développé en **React + TypeScript + Vite + Tailwind CSS**, puis
empaqueté en **vraies applications natives Android et iOS** grâce à **Capacitor**.

| Plateforme | Projet natif | Fichier généré |
|-----------|--------------|----------------|
| 📱 Android | dossier `android/` (Gradle / Android Studio) | `.apk` / `.aab` |
| 🍎 iOS | dossier `ios/` (projet Xcode) | `.app` → archive → `.ipa` |

> ⚙️ La compilation du binaire iOS (`.ipa`) exige un **Mac avec Xcode** ; celle de l'APK
> Android exige le **JDK 17** et le **Android SDK**. Ce dépôt contient **tout le code prêt**
> pour produire ces fichiers (voir « Construire » ci-dessous).

---

## ✨ Fonctionnalités

- **Solo** : défis Vérité / Action générés pour jouer seul ou se tester.
- **Multi** : jeu de soirée à plusieurs joueurs (tour par tour, ambiance afro/urbaine).
- **Avatars** : création / personnalisation d'avatars (photo caméra ou galerie).
- **Création IA** *(optionnel)* : génération de défis sur-mesure via l'API **Google Gemini**.
- **Bibliothèque** : conservation et réutilisation de vos défis préférés.
- **Natif** : vibration (haptique), splash screen de marque, bouton retour Android,
  barre de statut, clavier adapté, icône & écran d'accueil de marque.

---

## 🛠️ Pile technique

- **Web** : React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion (animation), lucide-react.
- **Natif** : Capacitor 8 (Android + iOS) avec plugins `app`, `haptics`, `keyboard`,
  `splash-screen`, `status-bar`.
- **Serveur (optionnel)** : Express + Google Gemini (`@google/genai`), en fallback local
  (fonctionne hors-ligne sans clé).

---

## 📁 Structure du dépôt

```
android/                 Projet natif Android (à ouvrir dans Android Studio)
ios/                     Projet natif iOS (à ouvrir dans Xcode sur un Mac)
src/                     Code source React (application web/mobile)
  App.tsx                Composant racine & navigation
  components/            SoloView, MultiView, AvatarView, BiblioView, PlusView, auth…
  data/                  Défis initiaux, traductions
  utils/                 Audio, images, modération, natif, téléphones
public/                  Icons PWA, manifest, manifest.webmanifest
server.ts                Serveur Express + route IA Gemini (optionnel)
capacitor.config.ts      Configuration Capacitor (appId, plugins…)
scripts/
  make-native-icons.mjs   Re-génère icônes & splash natives (source par défaut : brand/app-icon-1024.png)
  build-android.sh        Compile l'APK Android (pré-requis : JDK17 + SDK)
  create-android-keystore.sh  Génère un keystore de signature release + keystore.properties
brand/app-icon-1024.png   Icône maîtresse (source des icônes natives)
android/keystore.properties.example   Modèle de config de signature (secret non versionné)
```

---

## 🚀 Démarrage (développement web)

```bash
npm install          # installe les dépendances
npm run dev          # serveur + Vite sur http://localhost:3000
```

Pour activer la **Création IA** :

```bash
cp .env.example .env
# remplir GEMINI_API_KEY=<votre clé Google AI Studio>
npm run dev
```

> Sans clé, le jeu reste 100 % fonctionnel : les défis IA utilisent des listes de secours
> intégrées (mode hors-ligne).

---

## 📶 Mode hors-ligne

L'application est **entièrement autonome** : les modes **Solo**, **Multi**, **Avatars** et
**Bibliothèque** fonctionnent **sans aucune connexion réseau**. Toute la logique de jeu et
les données persistent en local (`localStorage` / stockage du WebView natif), et la
« Création IA » utilise des défis de secours intégrés quand aucun serveur/clé n'est
disponible.

- Aucun appel réseau n'est requis par l'interface (vérifié : aucun `fetch` dans le code UI).
- Le serveur Express + Gemini est **optionnel** : il ne sert qu'à enrichir la génération IA
  si une `GEMINI_API_KEY` est configurée.
- Un bandeau discret « *Hors ligne — le jeu fonctionne sans connexion* » s'affiche quand le
  réseau est coupé, pour rassurer les joueurs.

---

## 📱 Construire l'application Android (APK)

### Pré-requis
- **JDK 17+** (`java -version`)
- **Android Studio** (fournit le SDK) avec le SDK **API 36** et les **build-tools** installés
- Variables d'environnement : `ANDROID_HOME` (ou SDK défini dans Android Studio)

### Étapes (méthode simple — script unique)

Le plus simple : un seul script à la racine enchaîne **tout** (install → build web →
sync Capacitor → compilation Gradle).

```bash
./build-apk.sh                # APK debug → android/app/build/outputs/apk/debug/app-debug.apk
./build-apk.sh --release      # APK release (signé si keystore présent, sinon unsigned)
./build-apk.sh --release --sign   # signé : crée le keystore automatiquement si absent
```

*(Équivaut manuellement à `npm run build && npx cap sync android && bash scripts/build-android.sh`.)*

Les APK sont produits dans `android/app/build/outputs/apk/`.

### Générer un APK release **signé** (installable partout)

La signature release est configurée dans Gradle mais activée **uniquement** si
`android/keystore.properties` existe (jamais commité). Pour créer un keystore de
développement et la config associée :

```bash
bash scripts/create-android-keystore.sh \
  --alias gbe-moument \
  --storepass "VotreMotDePasseLong" \
  --keypass "VotreMotDePasseClef"
```

Puis recompiler :

```bash
bash scripts/build-android.sh
# → android/app/build/outputs/apk/release/app-release.apk  (signé)
```

Pour la mise en **production** (Play Store) : conservez précieusement le keystore et ses
mots de passe (sans eux, impossible de mettre à jour l'app publiée), et générez plutôt un
`.aab` signé via Android Studio (`Build → Generate Signed App Bundle`).

### Étapes (via Android Studio)
1. `npm run build && npx cap sync android`
2. Ouvrir le dossier `android/` dans **Android Studio**.
3. Menu **Build → Generate Signed App Bundle / APK** (ou `Build > Build Bundle(s)/APK(s) > Build APK`).
4. Créer ou sélectionner un **keystore** et suivre l'assistant de signature (`.aab`/`.apk` signé).

---

## 🍎 Construire l'application iOS (IPA) — sur Mac uniquement

### Pré-requis
- **macOS** avec **Xcode** (dernière version) et l'outil en ligne de commande (`xcode-select --install`)
- Compte **Apple Developer** (payant) pour signer et diffuser ; en développement, un
  compte gratuit suffit pour tester sur un appareil branché.

### Étapes
```bash
npm install
npm run build                 # construit le web dans dist/
npx cap sync ios              # synchronise dist/ vers le projet Xcode
npx cap open ios              # ouvre ios/App/App.xcodeproj dans Xcode
```

…ou, en une seule commande (sur un Mac équipé de Xcode) :

```bash
./build-ios.sh            # prépare et ouvre le projet dans Xcode
./build-ios.sh --no-open  # prépare seulement, sans ouvrir Xcode
```

Dans Xcode :
1. Sélectionner le **team** de signature (onglet *Signing & Capabilities*).
2. Sélectionner un simulateur ou un iPhone branché.
3. **Run (▶)** pour tester, puis **Product → Archive** et *Distribute App* pour générer l'`.ipa`
   (App Store / Ad Hoc / Enterprise).

---

## 🎨 Icônes & écran d'accueil (splash) de marque

### Icône par défaut
L'icône maîtresse se trouve dans `brand/app-icon-1024.png`. Pour régénérer toutes les
icônes natives (Android mipmaps + adaptive icon, iOS AppIcon) et les fonds de splash de
marque **éméraude** `#05130D` :

```bash
npm i -D sharp                 # outil de traitement d'image (une fois)
node scripts/make-native-icons.mjs
```

### Utiliser **votre propre icône** (personnalisation)

1. Préparez votre visuel au format **carré 1024×1024 PNG** (idéalement sans arrière-plan
   détouré si vous fournissez un logo rond, sinon l'image complète est utilisée comme
   icône et découpée en cercle pour les variantes rondes / adaptatives).
2. Régénérez toutes les icônes natives en passant le chemin en argument (ou via la
   variable `ICON_SOURCE`) :

```bash
node scripts/make-native-icons.mjs chemin/vers/mon-icone.png
# ou
ICON_SOURCE=chemin/vers/mon-icone.png node scripts/make-native-icons.mjs
```

3. Si l'icône change aussi l'apparence PWA/web, remplacez `public/` et relancez :
   `npm run build && npx cap sync`.

> Astuce : pour un résultat propre sur Android, fournissez un **logo centré** occupant
> ~60 % du canvas (la zone de sécurité des icônes adaptatives), le reste étant
> transparent ou uni. Vous pouvez aussi directement remplacer
> `brand/app-icon-1024.png` puis relancer la génération.

---

## 🔁 Notes de synchronisation Capacitor

Chaque modification du code React doit être re-empaquetée dans le natif :

```bash
npm run build && npx cap sync
```

---

## ⚠️ Limitations actuelles du sandbox de build

Ce dépôt est livré prêt à compiler. Le binaire **APK** / **IPA** doit être généré sur une
machine disposant du JDK 17 + Android SDK (APK) ou d'un Mac + Xcode (IPA), car ces
téléchargements réseau sont restreints dans certains environnements. Toutes les commandes
ci-dessus produisent les fichiers installables sans aucune autre modification.
