import translate from "translate";
import { TranslatinatorConfig, TranslationCache, TranslationEntry } from './types.js';
import { CacheManager } from './cache.js';
import { Logger } from './logger.js';

export class TranslationService {
  private cache: CacheManager;
  private logger: Logger;
  private config: TranslatinatorConfig;

  constructor(config: TranslatinatorConfig, cache: CacheManager, logger: Logger) {
    this.config = config;
    this.cache = cache;
    this.logger = logger;
    this.setupTranslateEngine();
  }

  private setupTranslateEngine(): void {
    // Set the translation engine
    translate.engine = this.config.engine || 'google';
    
    // Set API key if provided
    if (this.config.apiKey) {
      translate.key = this.config.apiKey;
    } else if (this.config.deeplApiKey && this.config.engine === 'deepl') {
      // Support legacy deeplApiKey
      translate.key = this.config.deeplApiKey;
    }
    
    // Set custom endpoint URL if provided (for LibreTranslate, etc.)
    if (this.config.endpointUrl) {
      // Note: url setting might not be available in all versions of the translate package
      // This is for LibreTranslate or custom endpoints
      try {
        (translate as any).url = this.config.endpointUrl;
      } catch (error) {
        this.logger.warn('Custom endpoint URL setting is not supported by this version of the translate package');
      }
    }

    this.logger.debug(`Translation engine set to: ${translate.engine}`);
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
      
      const translatedText = await translate(text, {
        from: sourceLang,
        to: targetLang
      });
      
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

  async getUsage(): Promise<any> {
    try {
      // The translate package doesn't provide usage information
      // This is a limitation when moving away from DeepL
      // We'll return a mock response or throw an error
      this.logger.warn('Usage information is not available with the current translation engine');
      return {
        character: { 
          count: 0, 
          limit: 'unlimited' 
        },
        engine: translate.engine
      };
    } catch (error) {
      this.logger.error('Failed to get API usage:', error);
      throw error;
    }
  }
}
