import { Translatinator } from '../src/translatinator';
import { TranslatinatorConfig } from '../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock the translator module
jest.mock('../src/translator', () => ({
  DeepLTranslator: jest.fn().mockImplementation(() => ({
    translateObject: jest.fn(),
    getUsage: jest.fn(),
  })),
}));

// Mock chokidar
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn(),
  }),
}));

describe('Translatinator', () => {
  let translatinator: Translatinator;
  let mockTranslator: jest.Mocked<any>;
  let config: TranslatinatorConfig;
  let testDir: string;

  beforeEach(async () => {
    const { DeepLTranslator } = require('../src/translator');
    mockTranslator = {
      translateObject: jest.fn(),
      getUsage: jest.fn(),
    };
    (DeepLTranslator as jest.Mock).mockReturnValue(mockTranslator);

    testDir = path.join((global as any).TEST_DIR, 'translatinator-test', Date.now().toString());
    await fs.ensureDir(testDir);

    config = {
      deeplApiKey: 'test-api-key',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr'],
      localesDir: testDir,
      cacheDir: path.join(testDir, '.cache'),
      force: false,
      verbose: false,
      filePattern: '{lang}.json',
      excludeKeys: []
    };

    translatinator = new Translatinator(config);
    await translatinator.initialize();
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(translatinator).toBeDefined();
      // Cache directory should be created
      const cacheExists = await fs.pathExists(config.cacheDir!);
      expect(cacheExists).toBe(true);
    });
  });

  describe('translateAll', () => {
    beforeEach(async () => {
      // Set up source file
      const sourceData = {
        greeting: 'Hello',
        farewell: 'Goodbye',
        nested: {
          welcome: 'Welcome'
        }
      };
      await fs.writeJson(path.join(testDir, 'en.json'), sourceData);

      // Mock translator responses
      mockTranslator.translateObject
        .mockResolvedValueOnce({
          greeting: 'Hallo',
          farewell: 'Auf Wiedersehen',
          nested: {
            welcome: 'Willkommen'
          }
        })
        .mockResolvedValueOnce({
          greeting: 'Bonjour',
          farewell: 'Au revoir',
          nested: {
            welcome: 'Bienvenue'
          }
        });
    });

    it('should translate to all target languages', async () => {
      await translatinator.translateAll();

      // Check that German file was created
      const deFile = path.join(testDir, 'de.json');
      const deExists = await fs.pathExists(deFile);
      expect(deExists).toBe(true);

      const deData = await fs.readJson(deFile);
      expect(deData.greeting).toBe('Hallo');

      // Check that French file was created
      const frFile = path.join(testDir, 'fr.json');
      const frExists = await fs.pathExists(frFile);
      expect(frExists).toBe(true);

      const frData = await fs.readJson(frFile);
      expect(frData.greeting).toBe('Bonjour');

      // Verify translator was called for each language
      expect(mockTranslator.translateObject).toHaveBeenCalledTimes(2);
    });

    it('should merge with existing translations when not forcing', async () => {
      // Create existing translation file with some entries
      const existingTranslation = {
        greeting: 'Existing Hallo',
        newKey: 'Existing Value'
      };
      await fs.writeJson(path.join(testDir, 'de.json'), existingTranslation);

      await translatinator.translateAll();

      const deData = await fs.readJson(path.join(testDir, 'de.json'));
      
      // Should preserve existing translation
      expect(deData.newKey).toBe('Existing Value');
      // Should have new translations merged in
      expect(deData.farewell).toBe('Auf Wiedersehen');
    });

    it('should force retranslation when force is enabled', async () => {
      // Create existing translation file
      const existingTranslation = {
        greeting: 'Old Hallo',
        farewell: 'Old Auf Wiedersehen'
      };
      await fs.writeJson(path.join(testDir, 'de.json'), existingTranslation);

      // Enable force mode
      const forceConfig = { ...config, force: true };
      const forceTranslatinator = new Translatinator(forceConfig);
      await forceTranslatinator.initialize();

      await forceTranslatinator.translateAll();

      const deData = await fs.readJson(path.join(testDir, 'de.json'));
      
      // Should have new translations, not old ones
      expect(deData.greeting).toBe('Hallo');
      expect(deData.farewell).toBe('Auf Wiedersehen');
    });

    it('should throw error when source file does not exist', async () => {
      // Remove source file
      await fs.remove(path.join(testDir, 'en.json'));

      await expect(translatinator.translateAll()).rejects.toThrow('Source file not found');
    });

    it('should use custom file pattern', async () => {
      const customConfig = { ...config, filePattern: 'locale-{lang}.json' };
      const customTranslatinator = new Translatinator(customConfig);
      await customTranslatinator.initialize();

      await customTranslatinator.translateAll();

      // Check that files were created with custom pattern
      const deFile = path.join(testDir, 'locale-de.json');
      const frFile = path.join(testDir, 'locale-fr.json');
      
      expect(await fs.pathExists(deFile)).toBe(true);
      expect(await fs.pathExists(frFile)).toBe(true);
    });
  });

  describe('file watching', () => {
    it('should start watching when watch is enabled', async () => {
      const chokidar = require('chokidar');
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn(),
      };
      chokidar.watch.mockReturnValue(mockWatcher);

      const watchConfig = { ...config, watch: true };
      const watchTranslatinator = new Translatinator(watchConfig);
      await watchTranslatinator.initialize();

      await watchTranslatinator.startWatching();

      expect(chokidar.watch).toHaveBeenCalledWith(
        path.join(testDir, 'en.json'),
        expect.objectContaining({
          persistent: true,
          ignoreInitial: true
        })
      );
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should not start watching when watch is disabled', async () => {
      const chokidar = require('chokidar');
      chokidar.watch.mockClear();

      await translatinator.startWatching();

      expect(chokidar.watch).not.toHaveBeenCalled();
    });

    it('should stop watching', async () => {
      const chokidar = require('chokidar');
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn(),
      };
      chokidar.watch.mockReturnValue(mockWatcher);

      const watchConfig = { ...config, watch: true };
      const watchTranslatinator = new Translatinator(watchConfig);
      await watchTranslatinator.initialize();

      await watchTranslatinator.startWatching();
      await watchTranslatinator.stopWatching();

      expect(mockWatcher.close).toHaveBeenCalled();
    });
  });

  describe('cache operations', () => {
    it('should clear cache', async () => {
      await translatinator.clearCache();
      // This should not throw an error
    });
  });

  describe('usage information', () => {
    it('should return usage information', async () => {
      const mockUsage = {
        character: { count: 1000, limit: 500000 }
      };
      mockTranslator.getUsage.mockResolvedValue(mockUsage);

      const info = await translatinator.getUsageInfo();

      expect(info.deeplUsage).toEqual(mockUsage);
      expect(info.cacheStats).toBeDefined();
      expect(info.cacheStats.totalEntries).toBeDefined();
      expect(info.cacheStats.languages).toBeDefined();
    });

    it('should throw error when getting usage fails', async () => {
      mockTranslator.getUsage.mockRejectedValue(new Error('Usage API Error'));

      await expect(translatinator.getUsageInfo()).rejects.toThrow('Usage API Error');
    });
  });

  describe('deep merge functionality', () => {
    beforeEach(async () => {
      const sourceData = {
        level1: {
          level2: {
            newItem: 'New translation'
          },
          existingItem: 'Updated translation'
        },
        newTopLevel: 'New top level'
      };
      await fs.writeJson(path.join(testDir, 'en.json'), sourceData);

      mockTranslator.translateObject.mockResolvedValue({
        level1: {
          level2: {
            newItem: 'Neue Übersetzung'
          },
          existingItem: 'Aktualisierte Übersetzung'
        },
        newTopLevel: 'Neue oberste Ebene'
      });
    });

    it('should deep merge nested objects correctly', async () => {
      // Create existing nested structure
      const existing = {
        level1: {
          level2: {
            existingDeepItem: 'Existing deep value'
          },
          existingMidItem: 'Existing mid value'
        },
        existingTopLevel: 'Existing top value'
      };
      await fs.writeJson(path.join(testDir, 'de.json'), existing);

      await translatinator.translateAll();

      const result = await fs.readJson(path.join(testDir, 'de.json'));

      expect(result).toEqual({
        level1: {
          level2: {
            existingDeepItem: 'Existing deep value', // Preserved
            newItem: 'Neue Übersetzung' // Added
          },
          existingMidItem: 'Existing mid value', // Preserved
          existingItem: 'Aktualisierte Übersetzung' // Added
        },
        existingTopLevel: 'Existing top value', // Preserved
        newTopLevel: 'Neue oberste Ebene' // Added
      });
    });
  });
});
