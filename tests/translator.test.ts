import { DeepLTranslator } from '../src/translator';
import { CacheManager } from '../src/cache';
import { Logger } from '../src/logger';
import { TranslatinatorConfig } from '../src/types';
import * as path from 'path';

// Mock the deepl-node module
jest.mock('deepl-node', () => ({
  Translator: jest.fn().mockImplementation(() => ({
    translateText: jest.fn(),
    getUsage: jest.fn(),
  })),
}));

describe('DeepLTranslator', () => {
  let translator: DeepLTranslator;
  let mockDeepLTranslator: jest.Mocked<any>;
  let cacheManager: CacheManager;
  let logger: Logger;
  let config: TranslatinatorConfig;
  let testCacheDir: string;

  beforeEach(async () => {
    const deepl = require('deepl-node');
    mockDeepLTranslator = {
      translateText: jest.fn(),
      getUsage: jest.fn(),
    };
    (deepl.Translator as jest.Mock).mockReturnValue(mockDeepLTranslator);

    testCacheDir = path.join((global as any).TEST_DIR, 'translator-test', Date.now().toString());
    logger = new Logger(false);
    cacheManager = new CacheManager(testCacheDir, logger);
    await cacheManager.initialize();

    config = {
      deeplApiKey: 'test-api-key',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr'],
      localesDir: './locales',
      force: false,
      excludeKeys: ['version', 'debug']
    };

    translator = new DeepLTranslator(config, cacheManager, logger);
  });

  describe('translateText', () => {
    it('should translate text using DeepL API', async () => {
      mockDeepLTranslator.translateText.mockResolvedValue({
        text: 'Hallo',
        detectedSourceLang: 'en'
      });

      const result = await translator.translateText('Hello', 'de');

      expect(result).toBe('Hallo');
      expect(mockDeepLTranslator.translateText).toHaveBeenCalledWith('Hello', 'en', 'de');
    });

    it('should use cached translation when available and not forcing', async () => {
      // Set up cache
      cacheManager.setCachedTranslation('Hello', 'de', {
        original: 'Hello',
        translated: 'Hallo (cached)',
        timestamp: Date.now(),
        version: '1.0.0'
      });

      const result = await translator.translateText('Hello', 'de');

      expect(result).toBe('Hallo (cached)');
      expect(mockDeepLTranslator.translateText).not.toHaveBeenCalled();
    });

    it('should bypass cache when force is enabled', async () => {
      // Set up cache
      cacheManager.setCachedTranslation('Hello', 'de', {
        original: 'Hello',
        translated: 'Hallo (cached)',
        timestamp: Date.now(),
        version: '1.0.0'
      });

      // Enable force mode
      config.force = true;
      const forcedTranslator = new DeepLTranslator(config, cacheManager, logger);

      mockDeepLTranslator.translateText.mockResolvedValue({
        text: 'Hallo (fresh)',
        detectedSourceLang: 'en'
      });

      const result = await forcedTranslator.translateText('Hello', 'de');

      expect(result).toBe('Hallo (fresh)');
      expect(mockDeepLTranslator.translateText).toHaveBeenCalledWith('Hello', 'en', 'de');
    });

    it('should cache new translations', async () => {
      mockDeepLTranslator.translateText.mockResolvedValue({
        text: 'Bonjour',
        detectedSourceLang: 'en'
      });

      await translator.translateText('Hello', 'fr');

      const cached = cacheManager.getCachedTranslation('Hello', 'fr');
      expect(cached).not.toBeNull();
      expect(cached?.translated).toBe('Bonjour');
      expect(cached?.original).toBe('Hello');
    });

    it('should throw error when translation fails', async () => {
      mockDeepLTranslator.translateText.mockRejectedValue(new Error('API Error'));

      await expect(translator.translateText('Hello', 'de')).rejects.toThrow('API Error');
    });
  });

  describe('translateObject', () => {
    beforeEach(() => {
      mockDeepLTranslator.translateText.mockImplementation((text: string) => {
        const translations: Record<string, string> = {
          'Hello': 'Hallo',
          'Goodbye': 'Auf Wiedersehen',
          'Welcome': 'Willkommen'
        };
        return Promise.resolve({
          text: translations[text] || `Translated: ${text}`,
          detectedSourceLang: 'en'
        });
      });
    });

    it('should translate simple string', async () => {
      const result = await translator.translateObject('Hello', 'de');
      expect(result).toBe('Hallo');
    });

    it('should translate simple object', async () => {
      const input = {
        greeting: 'Hello',
        farewell: 'Goodbye'
      };

      const result = await translator.translateObject(input, 'de');

      expect(result).toEqual({
        greeting: 'Hallo',
        farewell: 'Auf Wiedersehen'
      });
    });

    it('should translate nested object', async () => {
      const input = {
        messages: {
          greeting: 'Hello',
          farewell: 'Goodbye'
        },
        title: 'Welcome'
      };

      const result = await translator.translateObject(input, 'de');

      expect(result).toEqual({
        messages: {
          greeting: 'Hallo',
          farewell: 'Auf Wiedersehen'
        },
        title: 'Willkommen'
      });
    });

    it('should translate arrays', async () => {
      const input = ['Hello', 'Goodbye'];

      const result = await translator.translateObject(input, 'de');

      expect(result).toEqual(['Hallo', 'Auf Wiedersehen']);
    });

    it('should exclude specified keys from translation', async () => {
      const input = {
        greeting: 'Hello',
        version: '1.0.0',
        debug: true,
        farewell: 'Goodbye'
      };

      const result = await translator.translateObject(input, 'de');

      expect(result).toEqual({
        greeting: 'Hallo',
        version: '1.0.0', // Excluded key, not translated
        debug: true, // Excluded key, not translated
        farewell: 'Auf Wiedersehen'
      });
    });

    it('should handle mixed data types', async () => {
      const input = {
        text: 'Hello',
        number: 42,
        boolean: true,
        null_value: null,
        array: ['Hello', 123, false]
      };

      const result = await translator.translateObject(input, 'de');

      expect(result).toEqual({
        text: 'Hallo',
        number: 42,
        boolean: true,
        null_value: null,
        array: ['Hallo', 123, false]
      });
    });

    it('should return primitive values unchanged', async () => {
      expect(await translator.translateObject(42, 'de')).toBe(42);
      expect(await translator.translateObject(true, 'de')).toBe(true);
      expect(await translator.translateObject(null, 'de')).toBe(null);
    });
  });

  describe('getUsage', () => {
    it('should return API usage information', async () => {
      const mockUsage = {
        character: { count: 1000, limit: 500000 },
        document: { count: 5, limit: 50 }
      };

      mockDeepLTranslator.getUsage.mockResolvedValue(mockUsage);

      const result = await translator.getUsage();

      expect(result).toEqual(mockUsage);
      expect(mockDeepLTranslator.getUsage).toHaveBeenCalled();
    });

    it('should throw error when API call fails', async () => {
      mockDeepLTranslator.getUsage.mockRejectedValue(new Error('API Error'));

      await expect(translator.getUsage()).rejects.toThrow('API Error');
    });
  });
});
