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
  make-native-icons.mjs  Re-génère icônes & splash natives depuis brand/app-icon-1024.png
  build-android.sh       Compile l'APK Android (pré-requis : JDK17 + SDK)
brand/app-icon-1024.png  Icône maîtresse (source des icônes natives)
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

## 📱 Construire l'application Android (APK)

### Pré-requis
- **JDK 17+** (`java -version`)
- **Android Studio** (fournit le SDK) avec le SDK **API 36** et les **build-tools** installés
- Variables d'environnement : `ANDROID_HOME` (ou SDK défini dans Android Studio)

### Étapes (méthode simple — script)

```bash
npm install
npm run build                 # construit le web dans dist/
npx cap sync android          # synchronise dist/ vers le projet natif
bash scripts/build-android.sh # génère app-debug.apk (+ app-release-unsigned.apk)
```

Les APK sont produits dans `android/app/build/outputs/apk/`.

### Étapes (via Android Studio)
1. `npm run build && npx cap sync android`
2. Ouvrir le dossier `android/` dans **Android Studio**.
3. Menu **Build → Generate Signed App Bundle / APK** (ou `Build > Build Bundle(s)/APK(s) > Build APK`).
4. Pour une mise en production (Play Store) : créer un **keystore** et suivre l'assistant
   de signature (cela génère un `.aab`/`.apk` signé).

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

Dans Xcode :
1. Sélectionner le **team** de signature (onglet *Signing & Capabilities*).
2. Sélectionner un simulateur ou un iPhone branché.
3. **Run (▶)** pour tester, puis **Product → Archive** et *Distribute App* pour générer l'`.ipa`
   (App Store / Ad Hoc / Enterprise).

---

## 🎨 Icônes & écran d'accueil (splash) de marque

L'icône maîtresse se trouve dans `brand/app-icon-1024.png`. Pour régénérer toutes les
icônes natives (Android mipmaps + adaptive icon, iOS AppIcon) et les fonds de splash de
marque **éméraude** `#05130D` :

```bash
npm i -D sharp                 # outil de traitement d'image (une fois)
node scripts/make-native-icons.mjs
```

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
