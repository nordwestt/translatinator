#!/usr/bin/env node

import { TranslatinatorDevServer } from './index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Simple development server for standalone usage
async function startDevServer() {
  const configPath = process.argv[2];
  
  const devServer = new TranslatinatorDevServer({ configPath });
  
  console.log('🌍 Starting Translatinator development server...');
  await devServer.start();
  
  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Translatinator development server...');
    await devServer.stop();
    process.exit(0);
  });
}

// Check if this module is being run directly (ES modules)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  startDevServer().catch(error => {
    console.error('Failed to start development server:', error);
    process.exit(1);
  });
}
