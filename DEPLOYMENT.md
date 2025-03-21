# Déploiement de SMART-E2B

Ce document explique comment compiler, installer et déployer l'outil SMART-E2B sur NPM et l'utiliser avec Claude AI Desktop.

## Compilation du projet

Avant de déployer, vous devez compiler le code TypeScript en JavaScript :

```bash
# Installer les dépendances
npm install

# Compiler le code TypeScript
npm run build
```

## Tester en local sans déploiement

Cette section est particulièrement importante pour le développement et les tests rapides :

```bash
# Dans le répertoire du projet
cd /Users/leghis/Desktop/smart-e2b/

# Installer les dépendances
npm install

# Exécuter en mode développement (compile et exécute automatiquement)
npm run dev

# OU pour tester directement avec Claude AI Desktop sans installation globale
# Modifier le fichier de configuration claude_desktop_config.json manuellement :

{
  "mcpServers": {
    "smart-e2b": {
      "command": "node",
      "args": ["/chemin/absolu/vers/Desktop/smart-e2b/bin/cli.js"],
      "env": {
        "E2B_API_KEY": "votre_clé_api_e2b"
      }
    }
  }
}
```

Cette méthode vous permet de tester les modifications en direct sans avoir à publier ou installer globalement le package. C'est idéal pendant le développement car vous pouvez facilement itérer et déboguer.

## Options de déploiement

### 1. Installation locale (développement)

Pour tester localement sans publier sur NPM :

```bash
# Installer globalement depuis le répertoire local
npm install -g .

# Vérifier l'installation
smart-e2b --help

# Configurer Claude AI Desktop
smart-e2b --install
```

### 2. Publication sur NPM

Pour rendre l'outil disponible publiquement :

```bash
# Connectez-vous à votre compte NPM
npm login

# Publiez le package
npm publish
```

Après la publication, les utilisateurs peuvent installer votre package avec :

```bash
npm install -g smart-e2b
```

### 3. Installation depuis GitHub

Si vous préférez héberger le code sur GitHub sans le publier sur NPM :

```bash
# Créez un dépôt GitHub et poussez le code
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-compte/smart-e2b.git
git push -u origin main

# Les utilisateurs peuvent installer directement depuis GitHub
npm install -g git+https://github.com/votre-compte/smart-e2b.git
```

## Configuration avec Claude AI Desktop

Une fois installé, configurez Claude AI Desktop :

1. **Automatiquement** : Exécutez `smart-e2b --install` et suivez les instructions

2. **Manuellement** : Modifiez le fichier de configuration Claude AI Desktop
   - Sur macOS : `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Sur Windows : `%APPDATA%/Claude/claude_desktop_config.json`

   Ajoutez la configuration suivante :
   ```json
   {
     "mcpServers": {
       "smart-e2b": {
         "command": "smart-e2b",
         "env": {
           "E2B_API_KEY": "votre_clé_api_e2b"
         }
       }
     }
   }
   ```

3. Redémarrez Claude AI Desktop

## Pourquoi SMART-E2B est meilleur que les outils qui buggent souvent

SMART-E2B a été spécifiquement conçu pour résoudre les problèmes communs des autres implémentations E2B/MCP :

1. **Gestion robuste des erreurs** : Les erreurs sont captées, transformées et rapportées de manière cohérente, minimisant les échecs silencieux ou les crashs inattendus.

2. **Gestion intelligente des sessions sandbox** :
   - Réutilisation des sandbox existantes pour éviter les délais de démarrage
   - Nettoyage automatique des sessions inactives pour éviter les fuites de ressources
   - Isolation des sessions par identifiant pour permettre des contextes d'exécution multiples

3. **Timeouts sophistiqués** : Protection contre les exécutions infinies qui bloquent souvent d'autres outils

4. **Structure de code modulaire** :
   - Code bien structuré et facile à maintenir/modifier
   - Séparation claire des préoccupations entre différents modules
   - Tests intégrés pour assurer la fiabilité

5. **Support de fichiers robuste** :
   - Création automatique des répertoires parents
   - Gestion des erreurs d'E/S détaillée
   - Opérations atomiques quand c'est possible

6. **Documentation et expérience utilisateur** :
   - Installation guidée avec assistant interactif
   - Messages d'erreur clairs et utiles
   - Documentation complète pour tous les cas d'utilisation

7. **Compatibilité cross-platform** : 
   - Fonctionne de façon identique sur Windows, macOS et Linux
   - Gestion automatique des permissions d'exécution

Tous ces éléments combinés font de SMART-E2B une solution beaucoup plus fiable et robuste que les alternatives existantes.

## Mise à jour du package

Pour mettre à jour une version existante sur NPM :

1. Modifiez la version dans `package.json`
2. Compilez le code avec `npm run build`
3. Publiez avec `npm publish`

## Résolution des problèmes courants

- **Erreur "Command not found"** : Assurez-vous que le package est bien installé globalement (`npm install -g smart-e2b`)
- **Erreur de connexion avec Claude AI Desktop** : Vérifiez la configuration dans le fichier `claude_desktop_config.json`
- **Erreur E2B** : Vérifiez votre clé API E2B et assurez-vous que votre compte est actif
