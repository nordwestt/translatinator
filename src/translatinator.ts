import fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { TranslatinatorConfig } from './types';
import { TranslationService } from './translator';
import { CacheManager } from './cache';
import { Logger } from './logger';
import { ProgressBar } from './progress';
import { setAtPath } from './json-path';

export class Translatinator {
  private config: TranslatinatorConfig;
  private translator: TranslationService;
  private cache: CacheManager;
  private logger: Logger;
  private watcher?: chokidar.FSWatcher;

  constructor(config: TranslatinatorConfig) {
    this.config = {
      engine: 'google',
      watch: false,
      force: false,
      filePattern: '{lang}.json',
      preserveFormatting: true,
      cacheDir: '.translatinator-cache',
      verbose: false,
      ...config
    };

    this.logger = new Logger(this.config.verbose);
    this.cache = new CacheManager(this.config.cacheDir!, this.logger);
    this.translator = new TranslationService(this.config, this.cache, this.logger);
  }

  async initialize(): Promise<void> {
    await this.cache.initialize();
    this.logger.info('Translatinator initialized');
  }

  async translateAll(): Promise<void> {
    try {
      this.logger.info('Starting translation process...');

      // Ensure locales directory exists
      await fs.ensureDir(this.config.localesDir);

      // Read source file
      const sourceFilePath = path.join(this.config.localesDir, this.config.sourceFile);
      
      if (!(await fs.pathExists(sourceFilePath))) {
        throw new Error(`Source file not found: ${sourceFilePath}`);
      }

      const sourceData = await fs.readJson(sourceFilePath);
      this.logger.info(`Loaded source data from ${this.config.sourceFile}`);

      // Translate to each target language
      for (const targetLang of this.config.targetLanguages) {
        await this.translateToLanguage(sourceData, targetLang);
      }

      // Save cache
      await this.cache.saveCache();
      
      this.logger.success('Translation process completed successfully!');
    } catch (error) {
      this.logger.error('Translation process failed:', error);
      throw error;
    }
  }

  private async translateToLanguage(sourceData: any, targetLang: string): Promise<void> {
    this.logger.info(`Translating to ${targetLang}...`);

    const targetFileName = this.config.filePattern!.replace('{lang}', targetLang);
    const targetFilePath = path.join(this.config.localesDir, targetFileName);
    const saveBatchSize = this.config.saveBatchSize ?? 10;
    const showProgress =
      this.config.showProgress ??
      (typeof process.stderr?.isTTY === 'boolean' && process.stderr.isTTY);
    const progressBar = new ProgressBar(targetLang, showProgress);

    try {
      // Load existing translations if not forcing
      let existingData = {};
      const fileExists = await fs.pathExists(targetFilePath);
      if (!this.config.force && fileExists) {
        existingData = await fs.readJson(targetFilePath);
        this.logger.debug(`Loaded existing translations for ${targetLang}`);
      }

      let dataToTranslate: any;
      let finalData: any;
      let translationsPerformed = false;

      if (this.config.force) {
        dataToTranslate = sourceData;
        finalData = JSON.parse(JSON.stringify(sourceData));
        translationsPerformed = true;
      } else {
        const keysToTranslate = this.getMissingKeys(sourceData, existingData);

        if (Object.keys(keysToTranslate).length === 0) {
          if (fileExists) {
            this.logger.success(`✓ No translation required for ${targetFileName}`);
          } else {
            await fs.writeJson(targetFilePath, existingData, { spaces: 2 });
            this.logger.success(`✓ Created ${targetFileName}`);
          }
          return;
        }

        dataToTranslate = keysToTranslate;
        finalData = JSON.parse(JSON.stringify(existingData));
        translationsPerformed = true;
      }

      let pendingSave = 0;
      let keysTranslated = 0;
      const flushToDisk = async (): Promise<void> => {
        await fs.writeJson(targetFilePath, finalData, { spaces: 2 });
        await this.cache.saveCache();
        pendingSave = 0;
      };

      try {
        const translated = await this.translator.translateObject(
          dataToTranslate,
          targetLang,
          'en',
          [],
          {
            progress: {
              onProgress: (completed, total, keyPath) => {
                progressBar.update(completed, total, keyPath);
              },
              onKeyTranslated: async (keyPath, value) => {
                setAtPath(finalData, keyPath, value);
                keysTranslated++;
                pendingSave++;
                if (saveBatchSize > 0 && pendingSave >= saveBatchSize) {
                  await flushToDisk();
                }
              }
            }
          }
        );

        finalData = this.config.force
          ? translated
          : this.deepMerge(finalData, translated);

        await flushToDisk();
        progressBar.finish();

        if (translationsPerformed) {
          this.logger.success(`✓ Created/updated ${targetFileName}`);
        } else {
          this.logger.success(`✓ Created ${targetFileName}`);
        }
      } catch (error) {
        progressBar.finish();
        if (keysTranslated > 0) {
          try {
            await flushToDisk();
            this.logger.warn(`Saved partial progress for ${targetFileName} before failure`);
          } catch (saveError) {
            this.logger.error(`Failed to save partial progress for ${targetFileName}:`, saveError);
          }
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to translate to ${targetLang}:`, error);
      throw error;
    }
  }

  private deepMerge(target: any, source: any): any {
    if (typeof source !== 'object' || source === null) {
      return source;
    }

    if (Array.isArray(source)) {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private getMissingKeys(source: any, existing: any): any {
    if (typeof source !== 'object' || source === null) {
      return source;
    }

    if (Array.isArray(source)) {
      return source;
    }

    const result: any = {};

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (!(key in existing)) {
          // Key is missing, include it
          result[key] = source[key];
        } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          // Recursively check nested objects
          const nestedMissing = this.getMissingKeys(source[key], existing[key] || {});
          if (Object.keys(nestedMissing).length > 0) {
            result[key] = nestedMissing;
          }
        }
      }
    }

    return result;
  }

  async startWatching(): Promise<void> {
    if (!this.config.watch) {
      this.logger.warn('Watch mode is not enabled in configuration');
      return;
    }

    const sourceFilePath = path.join(this.config.localesDir, this.config.sourceFile);
    
    this.logger.info(`Starting file watcher for ${sourceFilePath}...`);

    this.watcher = chokidar.watch(sourceFilePath, {
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', async () => {
      this.logger.info('Source file changed, triggering retranslation...');
      try {
        await this.translateAll();
      } catch (error) {
        this.logger.error('Auto-translation failed:', error);
      }
    });

    this.logger.info('File watcher started successfully');
  }

  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.logger.info('File watcher stopped');
    }
  }

  async clearCache(): Promise<void> {
    await this.cache.clearCache();
  }

  async getUsageInfo(): Promise<any> {
    try {
      const usage = await this.translator.getUsage();
      const cacheStats = this.cache.getCacheStats();
      
      return {
        deeplUsage: usage,
        cacheStats
      };
    } catch (error) {
      this.logger.error('Failed to get usage info:', error);
      throw error;
    }
  }

}
