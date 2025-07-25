#!/usr/bin/env node

import { Command } from 'commander';
import { translate, ConfigLoader } from './index';

const program = new Command();

program
  .name('translatinator')
  .description('Automated translation management for web applications')
  .version('1.0.0');

program
  .command('translate')
  .description('Translate source file to target languages')
  .option('-c, --config <path>', 'path to config file')
  .option('-f, --force', 'force retranslation of all entries')
  .option('-w, --watch', 'watch for file changes and auto-translate')
  .option('-v, --verbose', 'enable verbose logging')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.loadConfig(options.config);
      
      // Override config with CLI options
      if (options.force) config.force = true;
      if (options.watch) config.watch = true;
      if (options.verbose) config.verbose = true;

      await translate();
    } catch (error) {
      console.error('Translation failed:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create a sample configuration file')
  .option('-o, --output <path>', 'output path for config file', 'translatinator.config.json')
  .action(async (options) => {
    try {
      await ConfigLoader.createSampleConfig(options.output);
      console.log(`Sample configuration created at ${options.output}`);
    } catch (error) {
      console.error('Failed to create config file:', error);
      process.exit(1);
    }
  });

program
  .command('usage')
  .description('Show DeepL API usage information')
  .option('-c, --config <path>', 'path to config file')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.loadConfig(options.config);
      
      // Check for API key with backwards compatibility
      const hasApiKey = config.apiKey || config.deeplApiKey;
      if (!hasApiKey) {
        throw new Error('API key is required');
      }

      const { Translatinator } = require('./index');
      const translatinator = new Translatinator(config);
      await translatinator.initialize();
      
      const info = await translatinator.getUsageInfo();
      console.log('DeepL API Usage:', info.deeplUsage);
      console.log('Cache Statistics:', info.cacheStats);
    } catch (error) {
      console.error('Failed to get usage info:', error);
      process.exit(1);
    }
  });

program
  .command('clear-cache')
  .description('Clear translation cache')
  .option('-c, --config <path>', 'path to config file')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.loadConfig(options.config);
      const { Translatinator } = require('./index');
      const translatinator = new Translatinator(config);
      await translatinator.initialize();
      await translatinator.clearCache();
      console.log('Translation cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      process.exit(1);
    }
  });

program.parse();
