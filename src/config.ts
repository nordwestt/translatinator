import * as fs from 'fs-extra';
import * as path from 'path';
import { TranslatinatorConfig } from './types';

export class ConfigLoader {
  static async loadConfig(configPath?: string): Promise<TranslatinatorConfig> {
    const defaultConfig: Partial<TranslatinatorConfig> = {
      sourceFile: 'en.json',
      localesDir: './locales',
      deeplFree: true,
      watch: false,
      force: false,
      filePattern: '{lang}.json',
      preserveFormatting: true,
      cacheDir: '.translatinator-cache',
      verbose: false,
      targetLanguages: [],
      excludeKeys: []
    };

    // Load environment variables first (lowest priority)
    const envConfig: Partial<TranslatinatorConfig> = {};
    
    if (process.env.DEEPL_API_KEY) {
      envConfig.deeplApiKey = process.env.DEEPL_API_KEY;
    }
    
    if (process.env.TRANSLATINATOR_SOURCE_FILE) {
      envConfig.sourceFile = process.env.TRANSLATINATOR_SOURCE_FILE;
    }
    
    if (process.env.TRANSLATINATOR_TARGET_LANGUAGES) {
      envConfig.targetLanguages = process.env.TRANSLATINATOR_TARGET_LANGUAGES.split(',');
    }

    // If a specific config path is provided, only try to load that file
    if (configPath) {
      if (await fs.pathExists(configPath)) {
        const fileExt = path.extname(configPath);
        let userConfig: Partial<TranslatinatorConfig> = {};

        if (fileExt === '.js') {
          // For JS files, we'll need to require them
          const configModule = require(path.resolve(configPath));
          userConfig = configModule.default || configModule;
        } else {
          // For JSON files
          userConfig = await fs.readJson(configPath);
        }

        // Config file takes precedence over environment variables
        return { ...defaultConfig, ...envConfig, ...userConfig } as TranslatinatorConfig;
      }
      
      // If specific path was provided but doesn't exist, just use defaults + env vars
      return { ...defaultConfig, ...envConfig } as TranslatinatorConfig;
    }

    // No specific path provided, search for config files in current directory
    const possibleConfigPaths = [
      'translatinator.config.js',
      'translatinator.config.json',
      '.translatinatorrc',
      '.translatinatorrc.json'
    ];

    for (const configFile of possibleConfigPaths) {
      if (await fs.pathExists(configFile)) {
        const fileExt = path.extname(configFile);
        let userConfig: Partial<TranslatinatorConfig> = {};

        if (fileExt === '.js') {
          // For JS files, we'll need to require them
          const configModule = require(path.resolve(configFile));
          userConfig = configModule.default || configModule;
        } else {
          // For JSON files
          userConfig = await fs.readJson(configFile);
        }

        // Config file takes precedence over environment variables
        return { ...defaultConfig, ...envConfig, ...userConfig } as TranslatinatorConfig;
      }
    }

    // No config file found, use defaults + environment variables
    return { ...defaultConfig, ...envConfig } as TranslatinatorConfig;
  }

  static async createSampleConfig(outputPath: string = 'translatinator.config.json'): Promise<void> {
    const sampleConfig: TranslatinatorConfig = {
      deeplApiKey: 'your-deepl-api-key-here',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr', 'es', 'it', 'nl', 'pl'],
      localesDir: './locales',
      deeplFree: true,
      watch: false,
      force: false,
      filePattern: '{lang}.json',
      preserveFormatting: true,
      excludeKeys: ['version', 'build', 'debug'],
      cacheDir: '.translatinator-cache',
      verbose: false
    };

    await fs.writeJson(outputPath, sampleConfig, { spaces: 2 });
  }
}
