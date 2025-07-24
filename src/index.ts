import { Translatinator } from './translatinator';
import { ConfigLoader } from './config';

export { Translatinator, ConfigLoader };
export * from './types';

// Main programmatic API
export async function translate(configPath?: string): Promise<void> {
  const config = await ConfigLoader.loadConfig(configPath);
  
  if (!config.deeplApiKey) {
    throw new Error('DeepL API key is required. Set it in config file or DEEPL_API_KEY environment variable.');
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
