#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const configDir = process.platform === 'darwin'
  ? path.join(os.homedir(), 'Library', 'Application Support', 'Claude')
  : path.join(os.homedir(), 'AppData', 'Roaming', 'Claude');

const configPath = path.join(configDir, 'claude_desktop_config.json');

async function promptApiKey() {
  return new Promise((resolve) => {
    rl.question('Veuillez entrer votre clé API E2B: ', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('=== Installation de SMART-E2B pour Claude AI Desktop ===');
  
  let configExists = false;
  let config = { mcpServers: {} };
  
  try {
    if (fs.existsSync(configPath)) {
      configExists = true;
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
      console.log('Configuration Claude AI Desktop existante trouvée.');
    } else {
      console.log(`Aucune configuration Claude AI Desktop trouvée à ${configPath}`);
      console.log('Un nouveau fichier de configuration sera créé.');
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(`Répertoire de configuration créé: ${configDir}`);
      }
    }
    
    // S'assurer que mcpServers existe
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    const apiKey = await promptApiKey();
    
    if (!apiKey) {
      console.error('Erreur: Clé API E2B requise.');
      process.exit(1);
    }
    
    // Ajouter la configuration smart-e2b
    config.mcpServers['smart-e2b'] = {
      command: 'smart-e2b',
      env: {
        E2B_API_KEY: apiKey
      }
    };
    
    // Écrire la configuration
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    console.log('=== Installation terminée ===');
    console.log(`Configuration mise à jour: ${configPath}`);
    console.log('Redémarrez Claude AI Desktop pour utiliser SMART-E2B.');
  } catch (error) {
    console.error('Erreur lors de l\'installation:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
