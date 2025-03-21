# SMART-E2B

Un serveur MCP (Model Context Protocol) qui intègre E2B pour exécuter du code dans des environnements sandbox sécurisés dans le cloud, spécialement conçu pour fonctionner avec Claude AI Desktop.

## Caractéristiques

- Exécution sécurisée de code JavaScript et Python dans le cloud
- Gestion de fichiers intégrée (upload, lecture, liste)
- Réutilisation intelligente des sessions sandbox pour optimiser les performances
- Gestion automatique des timeouts et des erreurs
- Compatible avec Claude AI Desktop via MCP

## Prérequis

- Node.js (v16 ou supérieur)
- Clé API E2B (obtenue sur [e2b.dev](https://e2b.dev))
- Claude AI Desktop

## Installation

```bash
# Installation globale depuis NPM
npm install -g smart-e2b

# OU installation directe depuis GitHub
npm install -g git+https://github.com/Leghis/smart-e2b.git
```

## Configuration avec Claude AI Desktop

1. Ouvrez Claude AI Desktop
2. Allez dans les paramètres > onglet Développeur > Modifier la configuration
3. Ajoutez la configuration suivante au fichier `claude_desktop_config.json` :

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

4. Redémarrez Claude AI Desktop

## Utilisation

Une fois configuré, vous pourrez accéder aux outils SMART-E2B directement depuis les conversations avec Claude AI Desktop.

### Outils disponibles

- **executeJavaScript** : Exécute du code JavaScript dans un sandbox cloud
- **executePython** : Exécute du code Python dans un sandbox cloud
- **uploadFile** : Téléverse un fichier dans le sandbox
- **listFiles** : Liste les fichiers dans un répertoire du sandbox
- **readFile** : Lit le contenu d'un fichier dans le sandbox

### Exemples

Voici quelques exemples d'utilisation avec Claude AI Desktop :

#### Exécution de code JavaScript

```
Je voudrais tester ce code JavaScript :

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}

console.log(fibonacci(10));
```

#### Exécution de code Python

```
Pourrais-tu exécuter ce code Python pour analyser des données ?

import numpy as np
import matplotlib.pyplot as plt

# Générer des données aléatoires
data = np.random.normal(0, 1, 1000)

# Calculer les statistiques
mean = np.mean(data)
std = np.std(data)

print(f"Moyenne: {mean:.4f}")
print(f"Écart-type: {std:.4f}")

# Créer un histogramme
plt.hist(data, bins=30)
plt.title('Distribution normale')
plt.savefig('histogram.png')
```

## Développement

Pour contribuer ou modifier le projet :

```bash
# Cloner le dépôt
git clone https://github.com/Leghis/smart-e2b.git
cd smart-e2b

# Installer les dépendances
npm install

# Compiler
npm run build

# Tester localement
npm start
```

## Licence

MIT
