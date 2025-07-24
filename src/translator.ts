import * as deepl from 'deepl-node';
import translate from "translate";
import { TranslatinatorConfig, TranslationCache, TranslationEntry } from './types';
import { CacheManager } from './cache';
import { Logger } from './logger';

export class DeepLTranslator {
  private translator: deepl.Translator;
  private cache: CacheManager;
  private logger: Logger;
  private config: TranslatinatorConfig;

  constructor(config: TranslatinatorConfig, cache: CacheManager, logger: Logger) {
    this.config = config;
    this.translator = new deepl.Translator(config.deeplApiKey);
    this.cache = cache;
    this.logger = logger;
  }

  async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    // Check cache first
    const cached = this.cache.getCachedTranslation(text, targetLang);
    if (cached && !this.config.force) {
      this.logger.debug(`Using cached translation for "${text}" -> ${targetLang}`);
      return cached.translated;
    }

    try {
      this.logger.debug(`Translating "${text}" from ${sourceLang} to ${targetLang}`);
      
      const result = await this.translator.translateText(
        text,
        sourceLang as deepl.SourceLanguageCode,
        targetLang as deepl.TargetLanguageCode
      );

      const translatedText = result.text;
      
      // Cache the translation
      this.cache.setCachedTranslation(text, targetLang, {
        original: text,
        translated: translatedText,
        timestamp: Date.now(),
        version: '1.0.0'
      });

      return translatedText;
    } catch (error) {
      this.logger.error(`Failed to translate "${text}" to ${targetLang}:`, error);
      throw error;
    }
  }

  async translateObject(obj: any, targetLang: string, sourceLang: string = 'en'): Promise<any> {
    if (typeof obj === 'string') {
      return await this.translateText(obj, targetLang, sourceLang);
    }

    if (Array.isArray(obj)) {
      const results = [];
      for (const item of obj) {
        results.push(await this.translateObject(item, targetLang, sourceLang));
      }
      return results;
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this key should be excluded
        if (this.shouldExcludeKey(key)) {
          result[key] = value;
          continue;
        }

        result[key] = await this.translateObject(value, targetLang, sourceLang);
      }
      return result;
    }

    return obj;
  }

  private shouldExcludeKey(key: string): boolean {
    if (!this.config.excludeKeys) return false;
    return this.config.excludeKeys.includes(key);
  }

  async getUsage(): Promise<deepl.Usage> {
    try {
      return await this.translator.getUsage();
    } catch (error) {
      this.logger.error('Failed to get API usage:', error);
      throw error;
    }
  }
}
