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

    // Try to find config file
    const possibleConfigPaths = [
      configPath,
      'translatinator.config.js',
      'translatinator.config.json',
      '.translatinatorrc',
      '.translatinatorrc.json'
    ].filter(Boolean);

    for (const configFile of possibleConfigPaths) {
      if (await fs.pathExists(configFile!)) {
        const fileExt = path.extname(configFile!);
        let userConfig: Partial<TranslatinatorConfig> = {};

        if (fileExt === '.js') {
          // For JS files, we'll need to require them
          const configModule = require(path.resolve(configFile!));
          userConfig = configModule.default || configModule;
        } else {
          // For JSON files
          userConfig = await fs.readJson(configFile!);
        }

        return { ...defaultConfig, ...userConfig } as TranslatinatorConfig;
      }
    }

    // No config file found, check for environment variables
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
