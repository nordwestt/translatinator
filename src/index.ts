import { Translatinator } from './translatinator';
import { ConfigLoader } from './config';

export { Translatinator, ConfigLoader };
export * from './types';

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

// Next.js plugin for development mode with file watching
export class TranslatinatorNextPlugin {
  private config: any;
  private translatinator?: any;
  private watcher?: any;
  private isInitialized = false;

  constructor(options: any = {}) {
    this.config = options;
  }

  apply(nextConfig: any = {}): any {
    return {
      ...nextConfig,
      webpack: (webpackConfig: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
        // Only run on the server-side in development mode
        if (dev && isServer && !this.isInitialized) {
          // Use setImmediate to avoid blocking the webpack compilation
          setImmediate(() => {
            this.setupDevModeTranslation();
          });
          this.isInitialized = true;
        }

        // Call the original webpack function if it exists
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, { dev, isServer });
        }

        return webpackConfig;
      },
      // Add experimental support for Turbopack
      experimental: {
        ...nextConfig.experimental,
        turbo: {
          ...nextConfig.experimental?.turbo,
          // Ensure our plugin works with Turbopack
          rules: {
            ...nextConfig.experimental?.turbo?.rules,
          },
        },
      },
    };
  }

  private async setupDevModeTranslation(): Promise<void> {
    try {
      const { Translatinator } = await import('./translatinator');
      const { ConfigLoader } = await import('./config');

      const config = await ConfigLoader.loadConfig(this.config.configPath);
      
      // Check for API key
      const hasApiKey = config.apiKey || config.deeplApiKey;
      if (!hasApiKey || hasApiKey === 'your-api-key-here' || hasApiKey === 'your-deepl-api-key-here') {
        console.warn('[Translatinator] No API key found, skipping translation setup');
        return;
      }

      // Handle backwards compatibility for deeplApiKey
      if (config.deeplApiKey && !config.apiKey) {
        config.apiKey = config.deeplApiKey;
        if (!config.engine) {
          config.engine = 'deepl';
        }
      }

      if (!config.targetLanguages || config.targetLanguages.length === 0) {
        console.warn('[Translatinator] No target languages specified, skipping translation setup');
        return;
      }

      // Initialize translatinator
      this.translatinator = new Translatinator(config);
      await this.translatinator.initialize();

      // Run initial translation
      await this.translatinator.translateAll();

      // Set up file watching
      await this.setupFileWatcher(config);

      console.log('[Translatinator] Dev mode translation setup complete. Watching for changes...');
    } catch (error) {
      console.error('[Translatinator] Failed to setup dev mode translation:', error);
    }
  }

  private async setupFileWatcher(config: any): Promise<void> {
    const chokidar = await import('chokidar');
    const path = await import('path');

    const sourceFilePath = path.join(config.localesDir, config.sourceFile);
    
    this.watcher = chokidar.watch(sourceFilePath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      console.log('[Translatinator] Source file changed, updating translations...');
      try {
        if (this.translatinator) {
          await this.translatinator.translateAll();
          console.log('[Translatinator] Translations updated successfully');
        }
      } catch (error) {
        console.error('[Translatinator] Auto-translation failed:', error);
      }
    });

    // Cleanup on process exit
    process.on('SIGINT', async () => {
      if (this.watcher) {
        await this.watcher.close();
      }
    });

    process.on('SIGTERM', async () => {
      if (this.watcher) {
        await this.watcher.close();
      }
    });
  }
}

// Simplified function for Next.js integration
export function withTranslatinator(options: any = {}) {
  const plugin = new TranslatinatorNextPlugin(options);
  
  return (nextConfig: any = {}) => {
    return plugin.apply(nextConfig);
  };
}

// Standalone development watcher for Turbopack and other scenarios
export class TranslatinatorDevServer {
  private config: any;
  private translatinator?: any;
  private watcher?: any;
  private isRunning = false;

  constructor(options: any = {}) {
    this.config = options;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Translatinator Dev] Already running...');
      return;
    }

    try {
      const { Translatinator } = await import('./translatinator');
      const { ConfigLoader } = await import('./config');

      const config = await ConfigLoader.loadConfig(this.config.configPath);
      
      // Check for API key
      const hasApiKey = config.apiKey || config.deeplApiKey;
      if (!hasApiKey || hasApiKey === 'your-api-key-here' || hasApiKey === 'your-deepl-api-key-here') {
        console.warn('[Translatinator Dev] No API key found, translation watcher not started');
        return;
      }

      // Handle backwards compatibility for deeplApiKey
      if (config.deeplApiKey && !config.apiKey) {
        config.apiKey = config.deeplApiKey;
        if (!config.engine) {
          config.engine = 'deepl';
        }
      }

      if (!config.targetLanguages || config.targetLanguages.length === 0) {
        console.warn('[Translatinator Dev] No target languages specified, translation watcher not started');
        return;
      }

      // Initialize translatinator
      this.translatinator = new Translatinator(config);
      await this.translatinator.initialize();

      // Run initial translation
      console.log('[Translatinator Dev] Running initial translation...');
      await this.translatinator.translateAll();

      // Set up file watching
      await this.setupFileWatcher(config);

      this.isRunning = true;
      console.log('[Translatinator Dev] Translation watcher started successfully! 🚀');
      console.log('[Translatinator Dev] Watching for changes in:', config.sourceFile);
    } catch (error) {
      console.error('[Translatinator Dev] Failed to start translation watcher:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    this.isRunning = false;
    console.log('[Translatinator Dev] Translation watcher stopped');
  }

  private async setupFileWatcher(config: any): Promise<void> {
    const chokidar = await import('chokidar');
    const path = await import('path');

    const sourceFilePath = path.join(config.localesDir, config.sourceFile);
    
    this.watcher = chokidar.watch(sourceFilePath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      console.log('[Translatinator Dev] 📝 Source file changed, updating translations...');
      try {
        if (this.translatinator) {
          await this.translatinator.translateAll();
          console.log('[Translatinator Dev] ✅ Translations updated successfully');
        }
      } catch (error) {
        console.error('[Translatinator Dev] ❌ Auto-translation failed:', error);
      }
    });

    // Cleanup on process exit
    const cleanup = async () => {
      await this.stop();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }
}

// Enhanced Next.js integration that works with both Webpack and Turbopack
export function withTranslatinatorDev(options: any = {}) {
  let devServer: TranslatinatorDevServer | null = null;
  
  return (nextConfig: any = {}) => {
    const config = {
      ...nextConfig,
      webpack: (webpackConfig: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
        // Only run on the server-side in development mode
        if (dev && isServer && !devServer) {
          devServer = new TranslatinatorDevServer(options);
          // Start the dev server asynchronously to not block webpack
          setImmediate(() => {
            devServer?.start();
          });
        }

        // Call the original webpack function if it exists
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, { dev, isServer });
        }

        return webpackConfig;
      },
    };

    // Handle process cleanup
    if (typeof process !== 'undefined') {
      const cleanup = async () => {
        if (devServer) {
          await devServer.stop();
        }
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('beforeExit', cleanup);
    }

    return config;
  };
}
