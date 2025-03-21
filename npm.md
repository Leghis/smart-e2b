# Guide de déploiement sur NPM

Voici les étapes pour déployer votre package SMART-E2B sur NPM :

## 1. Préparation du package

Assurez-vous d'avoir compilé votre code et que tout est prêt :

```bash
cd /Users/leghis/Desktop/smart-e2b
npm run build
```

## 2. Connexion à NPM

Vous devez vous connecter à votre compte NPM :

```bash
npm login
```

Cette commande vous demandera votre nom d'utilisateur, mot de passe et email associés à votre compte NPM.

## 3. Publication du package

Une fois connecté, vous pouvez publier votre package :

```bash
npm publish
```

Si vous obtenez une erreur concernant le scope public/privé, utilisez cette commande à la place :

```bash
npm publish --access=public
```

## 4. Mises à jour futures

Pour les futures mises à jour, vous devrez incrémenter la version de votre package avant de le republier :

```bash
# Pour une correction de bug (0.1.0 → 0.1.1)
npm version patch

# Pour une nouvelle fonctionnalité (0.1.0 → 0.2.0)
npm version minor

# Pour un changement majeur (0.1.0 → 1.0.0)
npm version major
```

Puis publiez à nouveau :

```bash
npm publish
```

## 5. Installation par les utilisateurs

Une fois publié, les utilisateurs pourront installer votre package avec :

```bash
# Installation globale
npm install -g smart-e2b

# Configuration avec Claude AI Desktop
smart-e2b --install
```

## 6. Test local avant publication (facultatif)

Si vous souhaitez tester le package avant de le publier :

```bash
# Créer un package .tgz local
npm pack

# Installer ce package localement
npm install -g ./smart-e2b-0.1.0.tgz

# Tester l'installation
smart-e2b --help
```

