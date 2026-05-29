import fs from 'fs-extra';
import * as path from 'path';
import { TranslatinatorConfig } from './types';

export class ConfigLoader {
  static mergeConfigs(...parts: Partial<TranslatinatorConfig>[]): TranslatinatorConfig {
    let result: Partial<TranslatinatorConfig> = {};
    for (const part of parts) {
      const { llm, ...rest } = part;
      result = { ...result, ...rest };
      if (llm) {
        result.llm = { ...(result.llm || {}), ...llm };
      }
    }
    return result as TranslatinatorConfig;
  }

  static async loadConfig(configPath?: string): Promise<TranslatinatorConfig> {
    const defaultConfig: Partial<TranslatinatorConfig> = {
      engine: 'google',
      sourceFile: 'en.json',
      localesDir: './locales',
      watch: false,
      force: false,
      filePattern: '{lang}.json',
      preserveFormatting: true,
      cacheDir: '.translatinator-cache',
      verbose: false,
      targetLanguages: [],
      excludeKeys: [],
      llm: {
        model: 'translategemma',
        baseUrl: 'http://localhost:11434',
        maxSiblingContext: 3
      }
    };

    // Load environment variables first (lowest priority)
    const envConfig: Partial<TranslatinatorConfig> = {};
    
    // Support both new and legacy environment variables
    if (process.env.TRANSLATION_API_KEY) {
      envConfig.apiKey = process.env.TRANSLATION_API_KEY;
    } else if (process.env.DEEPL_API_KEY) {
      envConfig.apiKey = process.env.DEEPL_API_KEY;
      envConfig.engine = 'deepl'; // Auto-set engine if using legacy env var
    }
    
    if (process.env.TRANSLATION_ENGINE) {
      envConfig.engine = process.env.TRANSLATION_ENGINE as any;
    }
    
    if (process.env.TRANSLATION_ENDPOINT_URL) {
      envConfig.endpointUrl = process.env.TRANSLATION_ENDPOINT_URL;
    }
    
    if (process.env.TRANSLATINATOR_SOURCE_FILE) {
      envConfig.sourceFile = process.env.TRANSLATINATOR_SOURCE_FILE;
    }
    
    if (process.env.TRANSLATINATOR_TARGET_LANGUAGES) {
      envConfig.targetLanguages = process.env.TRANSLATINATOR_TARGET_LANGUAGES.split(',');
    }

    if (
      process.env.TRANSLATION_LLM_MODEL ||
      process.env.TRANSLATION_LLM_BASE_URL ||
      process.env.TRANSLATION_LLM_NUM_CTX ||
      process.env.TRANSLATION_LLM_MAX_SIBLING_CONTEXT
    ) {
      envConfig.llm = {};
      if (process.env.TRANSLATION_LLM_MODEL) {
        envConfig.llm.model = process.env.TRANSLATION_LLM_MODEL;
      }
      if (process.env.TRANSLATION_LLM_BASE_URL) {
        envConfig.llm.baseUrl = process.env.TRANSLATION_LLM_BASE_URL;
      }
      if (process.env.TRANSLATION_LLM_NUM_CTX) {
        envConfig.llm.numCtx = parseInt(process.env.TRANSLATION_LLM_NUM_CTX, 10);
      }
      if (process.env.TRANSLATION_LLM_MAX_SIBLING_CONTEXT) {
        envConfig.llm.maxSiblingContext = parseInt(
          process.env.TRANSLATION_LLM_MAX_SIBLING_CONTEXT,
          10
        );
      }
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

        return ConfigLoader.mergeConfigs(defaultConfig, envConfig, userConfig);
      }

      return ConfigLoader.mergeConfigs(defaultConfig, envConfig);
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

        return ConfigLoader.mergeConfigs(defaultConfig, envConfig, userConfig);
      }
    }

    return ConfigLoader.mergeConfigs(defaultConfig, envConfig);
  }

  static async createSampleConfig(outputPath: string = 'translatinator.config.json'): Promise<void> {
    const sampleConfig: TranslatinatorConfig = {
      engine: 'google',
      apiKey: 'your-api-key-here',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr', 'es', 'it', 'nl', 'pl'],
      localesDir: './locales',
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
