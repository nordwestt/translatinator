import { translate, TranslatinatorWebpackPlugin } from '../src/index';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock the entire translatinator module
jest.mock('../src/translatinator', () => ({
  Translatinator: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    translateAll: jest.fn(),
    startWatching: jest.fn(),
    stopWatching: jest.fn(),
  })),
}));

jest.mock('../src/config', () => ({
  ConfigLoader: {
    loadConfig: jest.fn(),
  },
}));

describe('Index API', () => {
  let mockTranslatinator: jest.Mocked<any>;
  let mockConfigLoader: jest.Mocked<any>;

  beforeEach(() => {
    const { Translatinator } = require('../src/translatinator');
    const { ConfigLoader } = require('../src/config');

    mockTranslatinator = {
      initialize: jest.fn(),
      translateAll: jest.fn(),
      startWatching: jest.fn(),
      stopWatching: jest.fn(),
    };
    (Translatinator as jest.Mock).mockReturnValue(mockTranslatinator);

    mockConfigLoader = {
      loadConfig: jest.fn(),
    };
    (ConfigLoader.loadConfig as jest.Mock) = mockConfigLoader.loadConfig;
  });

  describe('translate function', () => {
    it('should load config and run translation', async () => {
      const mockConfig = {
        engine: 'google',
        apiKey: 'test-key',
        targetLanguages: ['de', 'fr'],
        sourceFile: 'en.json',
        localesDir: './locales'
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);

      await translate('./config.json');

      expect(mockConfigLoader.loadConfig).toHaveBeenCalledWith('./config.json');
      expect(mockTranslatinator.initialize).toHaveBeenCalled();
      expect(mockTranslatinator.translateAll).toHaveBeenCalled();
    });

    it('should throw error when API key is missing', async () => {
      const mockConfig = {
        targetLanguages: ['de', 'fr'],
        sourceFile: 'en.json',
        localesDir: './locales'
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);

      await expect(translate()).rejects.toThrow('API key is required');
    });

    it('should throw error when target languages are missing', async () => {
      const mockConfig = {
        apiKey: 'test-key',
        targetLanguages: [],
        sourceFile: 'en.json',
        localesDir: './locales'
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);

      await expect(translate()).rejects.toThrow('Target languages must be specified');
    });

    it('should start watching when watch is enabled', async () => {
      const mockConfig = {
        apiKey: 'test-key',
        targetLanguages: ['de', 'fr'],
        sourceFile: 'en.json',
        localesDir: './locales',
        watch: true
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);

      // Mock process.on to avoid infinite process
      const originalProcessOn = process.on;
      const mockProcessOn = jest.fn();
      process.on = mockProcessOn as any;

      try {
        await translate();

        expect(mockTranslatinator.startWatching).toHaveBeenCalled();
        expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      } finally {
        process.on = originalProcessOn;
      }
    });
  });

  describe('TranslatinatorWebpackPlugin', () => {
    it('should create plugin with options', () => {
      const options = { configPath: './custom-config.json' };
      const plugin = new TranslatinatorWebpackPlugin(options);

      expect(plugin).toBeDefined();
    });

    it('should create plugin with default options', () => {
      const plugin = new TranslatinatorWebpackPlugin();

      expect(plugin).toBeDefined();
    });

    it('should register webpack hook', () => {
      const plugin = new TranslatinatorWebpackPlugin({ configPath: './config.json' });
      
      const mockCompiler = {
        hooks: {
          beforeCompile: {
            tapAsync: jest.fn()
          }
        }
      };

      plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalledWith(
        'TranslatinatorWebpackPlugin',
        expect.any(Function)
      );
    });

    it('should run translation in webpack hook', async () => {
      const plugin = new TranslatinatorWebpackPlugin({ configPath: './config.json' });
      
      const mockConfig = {
        deeplApiKey: 'test-key',
        targetLanguages: ['de', 'fr'],
        sourceFile: 'en.json',
        localesDir: './locales'
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);

      let capturedCallback: any = null;
      const mockCompiler = {
        hooks: {
          beforeCompile: {
            tapAsync: jest.fn((name, callback) => {
              capturedCallback = callback;
            })
          }
        }
      };

      plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalledWith(
        'TranslatinatorWebpackPlugin',
        expect.any(Function)
      );

      // Simulate webpack calling our hook
      const hookCallback = jest.fn();
      if (capturedCallback) {
        await capturedCallback({}, hookCallback);
      }
      
      // The hook should call the callback
      expect(hookCallback).toHaveBeenCalledWith();
    });

    it('should handle translation errors in webpack hook', async () => {
      const plugin = new TranslatinatorWebpackPlugin({ configPath: './config.json' });
      
      mockConfigLoader.loadConfig.mockRejectedValue(new Error('Config error'));

      let capturedCallback: any = null;
      const mockCompiler = {
        hooks: {
          beforeCompile: {
            tapAsync: jest.fn((name, callback) => {
              capturedCallback = callback;
            })
          }
        }
      };

      plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.beforeCompile.tapAsync).toHaveBeenCalledWith(
        'TranslatinatorWebpackPlugin',
        expect.any(Function)
      );

      // Simulate webpack calling our hook
      const hookCallback = jest.fn();
      if (capturedCallback) {
        await capturedCallback({}, hookCallback);
      }
      
      // The hook should call the callback with error
      expect(hookCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
