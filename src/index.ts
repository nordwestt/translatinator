import { Translatinator } from './translatinator.js';
import { ConfigLoader } from './config.js';

export { Translatinator, ConfigLoader };
export * from './types.js';

// Main programmatic API
export async function translate(configPath?: string): Promise<void> {
  const config = await ConfigLoader.loadConfig(configPath);
  
  // Check for API key with backwards compatibility
  const hasApiKey = config.apiKey || config.deeplApiKey;
  if (!hasApiKey || hasApiKey === 'your-api-key-here' || hasApiKey === 'your-deepl-api-key-here') {
    throw new Error('API key is required. Set it in config file or TRANSLATION_API_KEY/DEEPL_API_KEY environment variable.');
  }

  // Handle backwards compatibility for deeplApiKey
  if (config.deeplApiKey && !config.apiKey) {
    config.apiKey = config.deeplApiKey;
    if (!config.engine) {
      config.engine = 'deepl';
    }
  }

  if (!config.targetLanguages || config.targetLanguages.length === 0) {
    throw new Error('Target languages must be specified in configuration.');
  }

  const translatinator = new Translatinator(config);
  await translatinator.initialize();
  await translatinator.translateAll();

  if (config.watch) {
    await translatinator.startWatching();
    // Keep the process running
    process.on('SIGINT', async () => {
      await translatinator.stopWatching();
      process.exit(0);
    });
  }
}

// Webpack plugin
export class TranslatinatorWebpackPlugin {
  private config: any;

  constructor(options: any = {}) {
    this.config = options;
  }

  apply(compiler: any): void {
    compiler.hooks.beforeCompile.tapAsync('TranslatinatorWebpackPlugin', async (params: any, callback: Function) => {
      try {
        await translate(this.config.configPath);
        callback();
      } catch (error) {
        callback(error);
      }
    });
  }
}
