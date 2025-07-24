import { CacheManager } from '../src/cache';
import { Logger } from '../src/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let logger: Logger;
  let testCacheDir: string;

  beforeEach(async () => {
    testCacheDir = path.join((global as any).TEST_DIR, 'cache-test', Date.now().toString());
    // Ensure the parent TEST_DIR exists
    await fs.ensureDir((global as any).TEST_DIR);
    logger = new Logger(false);
    cacheManager = new CacheManager(testCacheDir, logger);
    await cacheManager.initialize();
  });

  afterEach(async () => {
    if (await fs.pathExists(testCacheDir)) {
      await fs.remove(testCacheDir);
    }
  });

  describe('initialization', () => {
    it('should create cache directory if it does not exist', async () => {
      const exists = await fs.pathExists(testCacheDir);
      expect(exists).toBe(true);
    });

    it('should load existing cache if it exists', async () => {
      // Create a cache file first
      const cachePath = path.join(testCacheDir, 'translations.json');
      const testCache = {
        'hello': {
          'de': {
            original: 'hello',
            translated: 'hallo',
            timestamp: Date.now(),
            version: '1.0.0'
          }
        }
      };
      await fs.writeJson(cachePath, testCache);

      // Create new cache manager and initialize
      const newCacheManager = new CacheManager(testCacheDir, logger);
      await newCacheManager.initialize();

      const cached = newCacheManager.getCachedTranslation('hello', 'de');
      expect(cached).not.toBeNull();
      expect(cached?.translated).toBe('hallo');
    });
  });

  describe('cache operations', () => {
    it('should cache and retrieve translations', () => {
      const entry = {
        original: 'hello',
        translated: 'hallo',
        timestamp: Date.now(),
        version: '1.0.0'
      };

      cacheManager.setCachedTranslation('hello', 'de', entry);
      const cached = cacheManager.getCachedTranslation('hello', 'de');

      expect(cached).toEqual(entry);
    });

    it('should return null for non-existent translations', () => {
      const cached = cacheManager.getCachedTranslation('nonexistent', 'de');
      expect(cached).toBeNull();
    });

    it('should save cache to file', async () => {
      const entry = {
        original: 'hello',
        translated: 'hallo',
        timestamp: Date.now(),
        version: '1.0.0'
      };

      cacheManager.setCachedTranslation('hello', 'de', entry);
      await cacheManager.saveCache();

      const cachePath = path.join(testCacheDir, 'translations.json');
      const exists = await fs.pathExists(cachePath);
      expect(exists).toBe(true);

      const cacheData = await fs.readJson(cachePath);
      expect(cacheData.hello.de).toEqual(entry);
    });

    it('should clear cache', async () => {
      const entry = {
        original: 'hello',
        translated: 'hallo',
        timestamp: Date.now(),
        version: '1.0.0'
      };

      cacheManager.setCachedTranslation('hello', 'de', entry);
      await cacheManager.saveCache();

      await cacheManager.clearCache();

      const cached = cacheManager.getCachedTranslation('hello', 'de');
      expect(cached).toBeNull();

      const cachePath = path.join(testCacheDir, 'translations.json');
      const exists = await fs.pathExists(cachePath);
      expect(exists).toBe(false);
    });
  });

  describe('cache statistics', () => {
    it('should return correct cache statistics', () => {
      const entries = [
        { text: 'hello', lang: 'de', translation: 'hallo' },
        { text: 'hello', lang: 'fr', translation: 'bonjour' },
        { text: 'goodbye', lang: 'de', translation: 'auf wiedersehen' },
      ];

      entries.forEach(({ text, lang, translation }) => {
        cacheManager.setCachedTranslation(text, lang, {
          original: text,
          translated: translation,
          timestamp: Date.now(),
          version: '1.0.0'
        });
      });

      const stats = cacheManager.getCacheStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.languages).toContain('de');
      expect(stats.languages).toContain('fr');
      expect(stats.languages).toHaveLength(2);
    });

    it('should return empty statistics for empty cache', () => {
      const stats = cacheManager.getCacheStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.languages).toHaveLength(0);
    });
  });
});
