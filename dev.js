#!/usr/bin/env node

// Script simple pour exécuter le serveur en mode développement
import { spawn } from 'child_process';
import process from 'node:process';

console.log('Starting SMART-E2B in development mode...');

// Exécuter avec ts-node-esm
const proc = spawn('node', [
  '--loader', 'ts-node/esm',
  '--experimental-specifier-resolution=node',
  'src/index.ts'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_PROJECT: 'tsconfig.node.json',
  }
});

proc.on('exit', code => {
  console.log(`SMART-E2B development server exited with code ${code}`);
});
