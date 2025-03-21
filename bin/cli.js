#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--install') || args.includes('-i')) {
  // Run the installation script
  const installScriptPath = path.join(__dirname, '..', 'scripts', 'install.js');
  const installProcess = spawn('node', [installScriptPath], { stdio: 'inherit' });
  
  installProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
SMART-E2B - Serveur MCP pour exécution de code avec E2B

Options:
  --install, -i    Exécuter le script d'installation pour Claude AI Desktop
  --help, -h       Afficher ce message d'aide
  
Sans option, le serveur SMART-E2B démarre normalement (utilisé par Claude AI Desktop).
  `);
  process.exit(0);
} else {
  // Default: start the MCP server
  import('../build/index.js');
}
