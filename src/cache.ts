import * as fs from 'fs-extra';
import * as path from 'path';
import { TranslationCache, TranslationEntry } from './types';
import { Logger } from './logger';

export class CacheManager {
  private cacheDir: string;
  private cachePath: string;
  private cache: TranslationCache;
  private logger: Logger;

  constructor(cacheDir: string, logger: Logger) {
    this.cacheDir = cacheDir;
    this.cachePath = path.join(cacheDir, 'translations.json');
    this.cache = {};
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      await fs.ensureDir(this.cacheDir);
      
      if (await fs.pathExists(this.cachePath)) {
        const cacheData = await fs.readJson(this.cachePath);
        this.cache = cacheData || {};
        this.logger.debug(`Loaded translation cache with ${Object.keys(this.cache).length} entries`);
      } else {
        this.logger.debug('No existing cache found, starting fresh');
      }
    } catch (error) {
      this.logger.warn('Failed to load translation cache:', error);
      this.cache = {};
    }
  }

  getCachedTranslation(sourceText: string, targetLang: string): TranslationEntry | null {
    if (this.cache[sourceText] && this.cache[sourceText][targetLang]) {
      return this.cache[sourceText][targetLang];
    }
    return null;
  }

  setCachedTranslation(sourceText: string, targetLang: string, entry: TranslationEntry): void {
    if (!this.cache[sourceText]) {
      this.cache[sourceText] = {};
    }
    this.cache[sourceText][targetLang] = entry;
  }

  async saveCache(): Promise<void> {
    try {
      await fs.ensureDir(this.cacheDir);
      await fs.writeJson(this.cachePath, this.cache, { spaces: 2 });
      this.logger.debug('Translation cache saved successfully');
    } catch (error) {
      this.logger.error('Failed to save translation cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      this.cache = {};
      if (await fs.pathExists(this.cachePath)) {
        await fs.remove(this.cachePath);
      }
      this.logger.info('Translation cache cleared');
    } catch (error) {
      this.logger.error('Failed to clear translation cache:', error);
    }
  }

  getCacheStats(): { totalEntries: number; languages: string[] } {
    const languages = new Set<string>();
    let totalEntries = 0;

    for (const sourceText in this.cache) {
      for (const lang in this.cache[sourceText]) {
        languages.add(lang);
        totalEntries++;
      }
    }

    return {
      totalEntries,
      languages: Array.from(languages)
    };
  }
}
