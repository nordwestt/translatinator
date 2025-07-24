import { ConfigLoader } from '../src/config';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ConfigLoader', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join((global as any).TEST_DIR, 'config-test', Date.now().toString());
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
    
    // Clean up environment variables
    delete process.env.DEEPL_API_KEY;
    delete process.env.TRANSLATINATOR_SOURCE_FILE;
    delete process.env.TRANSLATINATOR_TARGET_LANGUAGES;
  });

  describe('loadConfig', () => {
    it('should load config from JSON file', async () => {
      await fs.ensureDir(testDir);
      const configPath = path.join(testDir, 'test.config.json');
      const testConfig = {
        deeplApiKey: 'test-key',
        sourceFile: 'test-en.json',
        targetLanguages: ['de', 'fr'],
        localesDir: './test-locales'
      };

      await fs.writeJson(configPath, testConfig);

      const config = await ConfigLoader.loadConfig(configPath);
      expect(config.deeplApiKey).toBe('test-key');
      expect(config.sourceFile).toBe('test-en.json');
      expect(config.targetLanguages).toEqual(['de', 'fr']);
      expect(config.localesDir).toBe('./test-locales');
    });

    it('should return default config when no config file exists', async () => {
      const config = await ConfigLoader.loadConfig('/nonexistent/path');
      
      expect(config.sourceFile).toBe('en.json');
      expect(config.localesDir).toBe('./locales');
      expect(config.deeplFree).toBe(true);
      expect(config.watch).toBe(false);
      expect(config.force).toBe(false);
      expect(config.filePattern).toBe('{lang}.json');
      expect(config.preserveFormatting).toBe(true);
      expect(config.cacheDir).toBe('.translatinator-cache');
      expect(config.verbose).toBe(false);
      expect(config.targetLanguages).toEqual([]);
      expect(config.excludeKeys).toEqual([]);
    });

    it('should load config from environment variables', async () => {
      process.env.DEEPL_API_KEY = 'env-api-key';
      process.env.TRANSLATINATOR_SOURCE_FILE = 'env-source.json';
      process.env.TRANSLATINATOR_TARGET_LANGUAGES = 'de,fr,es';

      // Create a temporary directory and change to it to avoid the existing config file
      await fs.ensureDir(testDir);
      const originalCwd = process.cwd();
      
      try {
        process.chdir(testDir);
        const config = await ConfigLoader.loadConfig();
        
        expect(config.deeplApiKey).toBe('env-api-key');
        expect(config.sourceFile).toBe('env-source.json');
        expect(config.targetLanguages).toEqual(['de', 'fr', 'es']);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should prioritize config file over environment variables', async () => {
      process.env.DEEPL_API_KEY = 'env-api-key';
      process.env.TRANSLATINATOR_SOURCE_FILE = 'env-source.json';

      await fs.ensureDir(testDir);
      const configPath = path.join(testDir, 'test.config.json');
      const testConfig = {
        deeplApiKey: 'file-api-key',
        sourceFile: 'file-source.json'
      };

      await fs.writeJson(configPath, testConfig);

      const config = await ConfigLoader.loadConfig(configPath);
      
      expect(config.deeplApiKey).toBe('file-api-key');
      expect(config.sourceFile).toBe('file-source.json');
    });

    it('should try multiple config file names', async () => {
      await fs.ensureDir(testDir);
      
      // Change to test directory to test relative paths
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const testConfig = {
          deeplApiKey: 'found-key',
          sourceFile: 'found.json'
        };

        await fs.writeJson('translatinator.config.json', testConfig);

        const config = await ConfigLoader.loadConfig();
        expect(config.deeplApiKey).toBe('found-key');
        expect(config.sourceFile).toBe('found.json');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('createSampleConfig', () => {
    it('should create a sample configuration file', async () => {
      await fs.ensureDir(testDir);
      const outputPath = path.join(testDir, 'sample.config.json');

      await ConfigLoader.createSampleConfig(outputPath);

      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);

      const config = await fs.readJson(outputPath);
      expect(config.deeplApiKey).toBe('your-deepl-api-key-here');
      expect(config.sourceFile).toBe('en.json');
      expect(config.targetLanguages).toEqual(['de', 'fr', 'es', 'it', 'nl', 'pl']);
      expect(config.localesDir).toBe('./locales');
      expect(config.excludeKeys).toEqual(['version', 'build', 'debug']);
    });

    it('should create config with default filename if not specified', async () => {
      const originalCwd = process.cwd();
      await fs.ensureDir(testDir);
      process.chdir(testDir);

      try {
        await ConfigLoader.createSampleConfig();

        const exists = await fs.pathExists('translatinator.config.json');
        expect(exists).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
