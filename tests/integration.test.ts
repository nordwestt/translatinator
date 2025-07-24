import { Translatinator, ConfigLoader, translate } from '../src/index';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock external dependencies
jest.mock('deepl-node', () => ({
  Translator: jest.fn().mockImplementation(() => ({
    translateText: jest.fn().mockImplementation((text: string) => {
      const translations: Record<string, string> = {
        'Hello': 'Hallo',
        'Welcome': 'Willkommen',
        'Goodbye': 'Auf Wiedersehen',
        'Home': 'Startseite',
        'About': 'Über uns'
      };
      return Promise.resolve({
        text: translations[text] || `DE: ${text}`,
        detectedSourceLang: 'en'
      });
    }),
    getUsage: jest.fn().mockResolvedValue({
      character: { count: 1000, limit: 500000 }
    }),
  })),
}));

describe('Integration Tests', () => {
  let testDir: string;
  let localesDir: string;
  let configPath: string;

  beforeEach(async () => {
    testDir = path.join((global as any).TEST_DIR, 'integration-test', Date.now().toString());
    localesDir = path.join(testDir, 'locales');
    configPath = path.join(testDir, 'translatinator.config.json');
    
    await fs.ensureDir(localesDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('End-to-End Translation Flow', () => {
    it('should complete full translation workflow', async () => {
      // 1. Create source translation file
      const sourceData = {
        navigation: {
          home: 'Home',
          about: 'About'
        },
        messages: {
          welcome: 'Welcome',
          goodbye: 'Goodbye'
        },
        metadata: {
          version: '1.0.0', // This should be excluded
          build: '123'      // This should be excluded
        }
      };

      await fs.writeJson(path.join(localesDir, 'en.json'), sourceData);

      // 2. Create configuration
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: localesDir,
        excludeKeys: ['version', 'build'],
        cacheDir: path.join(testDir, '.cache'),
        verbose: false
      };

      await fs.writeJson(configPath, config);

      // 3. Run translation
      await translate(configPath);

      // 4. Verify German translation file was created
      const deFile = path.join(localesDir, 'de.json');
      expect(await fs.pathExists(deFile)).toBe(true);

      const deData = await fs.readJson(deFile);

      // 5. Verify translations
      expect(deData.navigation.home).toBe('Startseite');
      expect(deData.navigation.about).toBe('Über uns');
      expect(deData.messages.welcome).toBe('Willkommen');
      expect(deData.messages.goodbye).toBe('Auf Wiedersehen');

      // 6. Verify excluded keys are preserved
      expect(deData.metadata.version).toBe('1.0.0');
      expect(deData.metadata.build).toBe('123');

      // 7. Verify cache was created
      const cacheFile = path.join(testDir, '.cache', 'translations.json');
      expect(await fs.pathExists(cacheFile)).toBe(true);

      const cacheData = await fs.readJson(cacheFile);
      expect(cacheData['Home']['de'].translated).toBe('Startseite');
    });

    it('should preserve existing translations and add new ones', async () => {
      // 1. Create initial source file
      const initialSource = {
        greeting: 'Hello'
      };
      await fs.writeJson(path.join(localesDir, 'en.json'), initialSource);

      // 2. Create existing German translation with manual edits
      const existingGerman = {
        greeting: 'Hallo (manually edited)',
        existing_key: 'Existing value'
      };
      await fs.writeJson(path.join(localesDir, 'de.json'), existingGerman);

      // 3. Update source file with new content
      const updatedSource = {
        greeting: 'Hello',
        farewell: 'Goodbye'
      };
      await fs.writeJson(path.join(localesDir, 'en.json'), updatedSource);

      // 4. Create configuration
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: localesDir,
        cacheDir: path.join(testDir, '.cache'),
        force: false // Don't force retranslation
      };
      await fs.writeJson(configPath, config);

      // 5. Run translation
      await translate(configPath);

      // 6. Verify merged result
      const deData = await fs.readJson(path.join(localesDir, 'de.json'));

      expect(deData.greeting).toBe('Hallo (manually edited)'); // Preserved
      expect(deData.existing_key).toBe('Existing value'); // Preserved
      expect(deData.farewell).toBe('Auf Wiedersehen'); // Added
    });

    it('should force retranslation when requested', async () => {
      // 1. Create source file
      const sourceData = { greeting: 'Hello' };
      await fs.writeJson(path.join(localesDir, 'en.json'), sourceData);

      // 2. Create existing translation
      const existingGerman = { greeting: 'Old Translation' };
      await fs.writeJson(path.join(localesDir, 'de.json'), existingGerman);

      // 3. Create configuration with force enabled
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: localesDir,
        cacheDir: path.join(testDir, '.cache'),
        force: true // Force retranslation
      };
      await fs.writeJson(configPath, config);

      // 4. Run translation
      await translate(configPath);

      // 5. Verify forced retranslation
      const deData = await fs.readJson(path.join(localesDir, 'de.json'));
      expect(deData.greeting).toBe('Hallo'); // Should be new translation
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from different sources', async () => {
      // Test JSON config file
      const jsonConfig = {
        deeplApiKey: 'json-key',
        sourceFile: 'json-en.json',
        targetLanguages: ['de', 'fr']
      };
      await fs.writeJson(configPath, jsonConfig);

      const config = await ConfigLoader.loadConfig(configPath);
      expect(config.deeplApiKey).toBe('json-key');
      expect(config.sourceFile).toBe('json-en.json');
      expect(config.targetLanguages).toEqual(['de', 'fr']);
    });

    it('should fall back to environment variables', async () => {
      // Set environment variables
      process.env.DEEPL_API_KEY = 'env-api-key';
      process.env.TRANSLATINATOR_SOURCE_FILE = 'env-source.json';
      process.env.TRANSLATINATOR_TARGET_LANGUAGES = 'de,fr,es';

      try {
        const config = await ConfigLoader.loadConfig('/nonexistent/config.json');
        
        expect(config.deeplApiKey).toBe('env-api-key');
        expect(config.sourceFile).toBe('env-source.json');
        expect(config.targetLanguages).toEqual(['de', 'fr', 'es']);
      } finally {
        // Clean up
        delete process.env.DEEPL_API_KEY;
        delete process.env.TRANSLATINATOR_SOURCE_FILE;
        delete process.env.TRANSLATINATOR_TARGET_LANGUAGES;
      }
    });
  });

  describe('Cache Functionality', () => {
    it('should cache translations and reuse them', async () => {
      // 1. Create source file
      const sourceData = { greeting: 'Hello' };
      await fs.writeJson(path.join(localesDir, 'en.json'), sourceData);

      // 2. Create configuration
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: localesDir,
        cacheDir: path.join(testDir, '.cache')
      };
      await fs.writeJson(configPath, config);

      // 3. First translation run
      await translate(configPath);

      // 4. Verify cache was created
      const cacheFile = path.join(testDir, '.cache', 'translations.json');
      expect(await fs.pathExists(cacheFile)).toBe(true);

      const initialCache = await fs.readJson(cacheFile);
      expect(initialCache['Hello']['de']).toBeDefined();

      // 5. Second translation run (should use cache)
      await translate(configPath);

      // 6. Cache should still exist and be used
      const finalCache = await fs.readJson(cacheFile);
      expect(finalCache).toEqual(initialCache);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing source file gracefully', async () => {
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'nonexistent.json',
        targetLanguages: ['de'],
        localesDir: localesDir
      };
      await fs.writeJson(configPath, config);

      await expect(translate(configPath)).rejects.toThrow('Source file not found');
    });

    it('should handle missing API key', async () => {
      const config = {
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: localesDir
      };
      await fs.writeJson(configPath, config);

      await expect(translate(configPath)).rejects.toThrow('DeepL API key is required');
    });

    it('should handle missing target languages', async () => {
      const config = {
        deeplApiKey: 'test-key',
        sourceFile: 'en.json',
        targetLanguages: [],
        localesDir: localesDir
      };
      await fs.writeJson(configPath, config);

      await expect(translate(configPath)).rejects.toThrow('Target languages must be specified');
    });
  });

  describe('Custom File Patterns', () => {
    it('should use custom file naming patterns', async () => {
      // 1. Create source file
      const sourceData = { greeting: 'Hello' };
      await fs.writeJson(path.join(localesDir, 'en.json'), sourceData);

      // 2. Create configuration with custom pattern
      const config = {
        deeplApiKey: 'test-api-key',
        sourceFile: 'en.json',
        targetLanguages: ['de', 'fr'],
        localesDir: localesDir,
        filePattern: 'locale-{lang}.json',
        cacheDir: path.join(testDir, '.cache')
      };
      await fs.writeJson(configPath, config);

      // 3. Run translation
      await translate(configPath);

      // 4. Verify custom file names
      expect(await fs.pathExists(path.join(localesDir, 'locale-de.json'))).toBe(true);
      expect(await fs.pathExists(path.join(localesDir, 'locale-fr.json'))).toBe(true);

      // 5. Verify content
      const deData = await fs.readJson(path.join(localesDir, 'locale-de.json'));
      expect(deData.greeting).toBe('Hallo');
    });
  });
});
