import { TranslationService } from '../src/translator';
import { CacheManager } from '../src/cache';
import { Logger } from '../src/logger';
import { TranslatinatorConfig } from '../src/types';
import * as path from 'path';

// Mock the translate module
jest.mock('translate', () => {
  const mockTranslate = jest.fn().mockImplementation((text: string) => {
    const translations: Record<string, string> = {
      'Hello': 'Hallo',
      'Goodbye': 'Auf Wiedersehen', 
      'Welcome': 'Willkommen'
    };
    return Promise.resolve(translations[text] || `Translated: ${text}`);
  });
  
  return mockTranslate;
});

jest.mock('axios', () => ({
  post: jest.fn()
}));

describe('TranslationService', () => {
  let translator: TranslationService;
  let cacheManager: CacheManager;
  let logger: Logger;
  let config: TranslatinatorConfig;
  let testCacheDir: string;

  beforeEach(async () => {
    testCacheDir = path.join((global as any).TEST_DIR, 'translator-test', Date.now().toString());
    logger = new Logger(false);
    cacheManager = new CacheManager(testCacheDir, logger);
    await cacheManager.initialize();

    config = {
      engine: 'google',
      apiKey: 'test-api-key',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr'],
      localesDir: './locales',
      force: false,
      excludeKeys: ['version', 'debug']
    };

    translator = new TranslationService(config, cacheManager, logger);
  });

  describe('translateText', () => {
    it('should translate text using translate library', async () => {
      const translate = require('translate');
      translate.mockResolvedValue('Hallo');

      const result = await translator.translateText('Hello', 'de');

      expect(result).toBe('Hallo');
      expect(translate).toHaveBeenCalledWith('Hello', { from: 'en', to: 'de' });
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
      const forcedTranslator = new TranslationService(config, cacheManager, logger);

      const translate = require('translate');
      translate.mockResolvedValue('Hallo (fresh)');

      const result = await forcedTranslator.translateText('Hello', 'de');

      expect(result).toBe('Hallo (fresh)');
      expect(translate).toHaveBeenCalledWith('Hello', { from: 'en', to: 'de' });
    });

    it('should cache new translations', async () => {
      const translate = require('translate');
      translate.mockResolvedValue('Bonjour');

      await translator.translateText('Hello', 'fr');

      const cached = cacheManager.getCachedTranslation('Hello', 'fr');
      expect(cached).not.toBeNull();
      expect(cached?.translated).toBe('Bonjour');
      expect(cached?.original).toBe('Hello');
    });

    it('should throw error when translation fails', async () => {
      const translate = require('translate');
      translate.mockRejectedValue(new Error('API Error'));

      await expect(translator.translateText('Hello', 'de')).rejects.toThrow('API Error');
    });

    describe('template variable protection', () => {
      beforeEach(() => {
        const translate = require('translate');
        translate.mockClear();
      });

      it('should preserve a single {variable} in the translated output', async () => {
        const translate = require('translate');
        translate.mockImplementation((text: string) => {
          // Simulate engine preserving the placeholder but translating around it
          return Promise.resolve(text.replace('There are', 'Es gibt').replace('items', 'Artikel'));
        });

        const result = await translator.translateText('There are {count} items', 'de');

        expect(result).toBe('Es gibt {count} Artikel');
        expect(translate).toHaveBeenCalledWith(
          expect.stringMatching(/\x00TMPL_0\x00/),
          { from: 'en', to: 'de' }
        );
      });

      it('should preserve multiple template variables', async () => {
        const translate = require('translate');
        translate.mockImplementation((text: string) => {
          return Promise.resolve(text.replace('Hello', 'Hallo'));
        });

        const result = await translator.translateText('Hello {name}, you have {count} messages', 'de');

        expect(result).toBe('Hallo {name}, you have {count} messages');
      });

      it('should pass text unchanged when no template variables exist', async () => {
        const translate = require('translate');
        translate.mockResolvedValue('Hallo');

        const result = await translator.translateText('Hello', 'de');

        expect(result).toBe('Hallo');
        expect(translate).toHaveBeenCalledWith('Hello', { from: 'en', to: 'de' });
      });

      it('should restore cached translation with template variables', async () => {
        const cleanedText = 'There are \x00TMPL_0\x00 items';
        cacheManager.setCachedTranslation(cleanedText, 'de', {
          original: cleanedText,
          translated: 'Es gibt {count} Artikel',
          timestamp: Date.now(),
          version: '1.0.0'
        });

        const translate = require('translate');
        const result = await translator.translateText('There are {count} items', 'de');

        expect(result).toBe('Es gibt {count} Artikel');
        expect(translate).not.toHaveBeenCalled();
      });

      it('should reuse cached translation across different placeholder names', async () => {
        const cleanedText = 'Hello \x00TMPL_0\x00';
        cacheManager.setCachedTranslation(cleanedText, 'de', {
          original: cleanedText,
          translated: 'Hallo \x00TMPL_0\x00',
          timestamp: Date.now(),
          version: '1.0.0'
        });

        const translate = require('translate');
        const result = await translator.translateText('Hello {city}', 'de');

        expect(result).toBe('Hallo {city}');
        expect(translate).not.toHaveBeenCalled();
      });

      it('should handle template variables at the start, middle, and end of string', async () => {
        const translate = require('translate');
        translate.mockImplementation((text: string) => {
          return Promise.resolve(`translated: ${text}`);
        });

        const result = await translator.translateText('{name} has {count} items in {city}', 'de');

        expect(result).toBe('translated: {name} has {count} items in {city}');
      });

      it('should force re-translate with template variables when force enabled', async () => {
        const cleanedText = 'There are \x00TMPL_0\x00 items';
        cacheManager.setCachedTranslation(cleanedText, 'de', {
          original: cleanedText,
          translated: 'Es gibt {count} Artikel (old)',
          timestamp: Date.now(),
          version: '1.0.0'
        });

        config.force = true;
        const forcedTranslator = new TranslationService(config, cacheManager, logger);

        const translate = require('translate');
        translate.mockImplementation((text: string) => {
          return Promise.resolve(text.replace('There are', 'Es gibt').replace('items', 'Artikel (fresh)'));
        });

        const result = await forcedTranslator.translateText('There are {count} items', 'de');

        expect(result).toBe('Es gibt {count} Artikel (fresh)');
      });
    });
  });

  describe('translateObject', () => {
    beforeEach(() => {
      const translate = require('translate');
      translate.mockImplementation((text: string) => {
        const translations: Record<string, string> = {
          'Hello': 'Hallo',
          'Goodbye': 'Auf Wiedersehen',
          'Welcome': 'Willkommen'
        };
        return Promise.resolve(translations[text] || `Translated: ${text}`);
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
    it('should return usage information with warning', async () => {
      const result = await translator.getUsage();

      expect(result).toEqual({
        character: { 
          count: 0, 
          limit: 'unlimited' 
        },
        engine: 'google'
      });
    });

    it('should not throw error for usage calls', async () => {
      await expect(translator.getUsage()).resolves.toBeDefined();
    });
  });

  describe('LLM (OpenAI-compatible API)', () => {
    let llmTranslator: TranslationService;
    const mockAxios = require('axios');

    beforeEach(() => {
      mockAxios.post.mockReset();
      mockAxios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Hallo' } }]
        }
      });

      const llmConfig: TranslatinatorConfig = {
        engine: 'llm',
        sourceFile: 'en.json',
        targetLanguages: ['de', 'fr'],
        localesDir: './locales',
        llm: {
          model: 'translategemma',
          baseUrl: 'http://localhost:11434',
          numCtx: 2048,
          maxSiblingContext: 3
        }
      };

      llmTranslator = new TranslationService(llmConfig, cacheManager, logger);
    });

    it('should translate text using OpenAI-compatible API', async () => {
      const result = await llmTranslator.translateText('Hello', 'de');

      expect(result).toBe('Hallo');
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should call the correct OpenAI-compatible endpoint', async () => {
      await llmTranslator.translateText('Hello', 'de');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:11434/v1/chat/completions',
        expect.objectContaining({
          model: 'translategemma',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' })
          ]),
          stream: false
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should construct the TranslateGemma prompt with language names and codes', async () => {
      await llmTranslator.translateText('Hello', 'de');

      const callArgs = mockAxios.post.mock.calls[0];
      const payload = callArgs[1];
      const prompt = payload.messages[0].content;

      expect(prompt).toContain('English (en) to German (de) translator');
      expect(prompt).toContain('Hello');
      expect(prompt).toMatch(/\n\n\nHello/);
    });

    it('should handle region-specific language codes', async () => {
      await llmTranslator.translateText('Hello', 'de-DE', 'en-US');

      const callArgs = mockAxios.post.mock.calls[0];
      const prompt = callArgs[1].messages[0].content;

      expect(prompt).toContain('English (en-US) to German (de-DE) translator');
    });

    it('should include Bearer token when API key is provided', async () => {
      const configWithKey: TranslatinatorConfig = {
        engine: 'llm',
        apiKey: 'sk-test-key',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: './locales',
        llm: {
          model: 'translategemma',
          baseUrl: 'http://localhost:11434'
        }
      };

      const translatorWithKey = new TranslationService(configWithKey, cacheManager, logger);
      await translatorWithKey.translateText('Hello', 'de');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key'
          })
        })
      );
    });

    it('should use cached translations when not forcing', async () => {
      cacheManager.setCachedTranslation('Hello', 'de', {
        original: 'Hello',
        translated: 'Hallo (cached)',
        timestamp: Date.now(),
        version: '1.0.0'
      });

      const result = await llmTranslator.translateText('Hello', 'de');

      expect(result).toBe('Hallo (cached)');
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should bypass cache when force is enabled', async () => {
      cacheManager.setCachedTranslation('Hello', 'de', {
        original: 'Hello',
        translated: 'Hallo (cached)',
        timestamp: Date.now(),
        version: '1.0.0'
      });

      const forceConfig: TranslatinatorConfig = {
        engine: 'llm',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: './locales',
        force: true,
        llm: {
          model: 'translategemma',
          baseUrl: 'http://localhost:11434'
        }
      };

      const forceTranslator = new TranslationService(forceConfig, cacheManager, logger);
      const result = await forceTranslator.translateText('Hello', 'de');

      expect(result).toBe('Hallo');
      expect(mockAxios.post).toHaveBeenCalled();
    });

    describe('LLM template variable protection', () => {
      beforeEach(() => {
        mockAxios.post.mockReset();
      });

      it('should preserve a single {variable} in LLM translation', async () => {
        mockAxios.post.mockResolvedValue({
          data: {
            choices: [{ message: { content: 'Es gibt \x00TMPL_0\x00 Artikel' } }]
          }
        });

        const result = await llmTranslator.translateText('There are {count} items', 'de');

        expect(result).toBe('Es gibt {count} Artikel');
      });

      it('should preserve multiple template variables in LLM translation', async () => {
        mockAxios.post.mockResolvedValue({
          data: {
            choices: [{ message: { content: 'Hallo \x00TMPL_0\x00, Sie haben \x00TMPL_1\x00 Nachrichten' } }]
          }
        });

        const result = await llmTranslator.translateText('Hello {name}, you have {count} messages', 'de');

        expect(result).toBe('Hallo {name}, Sie haben {count} Nachrichten');
      });

      it('should pass cleaned text in LLM prompt', async () => {
        mockAxios.post.mockResolvedValue({
          data: {
            choices: [{ message: { content: 'some translation' } }]
          }
        });

        await llmTranslator.translateText('Hello {name}', 'de');

        const callArgs = mockAxios.post.mock.calls[0];
        const prompt = callArgs[1].messages[0].content;
        expect(prompt).toContain('\x00TMPL_0\x00');
        expect(prompt).not.toContain('{name}');
      });

      it('should restore cached LLM translation with template variables', async () => {
        const cleanedText = 'There are \x00TMPL_0\x00 items';
        cacheManager.setCachedTranslation(cleanedText, 'de', {
          original: cleanedText,
          translated: 'Es gibt {count} Artikel',
          timestamp: Date.now(),
          version: '1.0.0'
        });

        const result = await llmTranslator.translateText('There are {count} items', 'de');

        expect(result).toBe('Es gibt {count} Artikel');
        expect(mockAxios.post).not.toHaveBeenCalled();
      });

      it('should handle no template variables in LLM engine (no regression)', async () => {
        mockAxios.post.mockResolvedValue({
          data: {
            choices: [{ message: { content: 'Hallo' } }]
          }
        });

        const result = await llmTranslator.translateText('Hello', 'de');

        expect(result).toBe('Hallo');
      });
    });

    it('should throw error when API response is invalid', async () => {
      mockAxios.post.mockResolvedValue({
        data: { choices: [] }
      });

      await expect(llmTranslator.translateText('Hello', 'de')).rejects.toThrow(
        'Invalid response from OpenAI-compatible API'
      );
    });

    it('should throw error on API failure', async () => {
      mockAxios.post.mockRejectedValue(new Error('Connection refused'));

      await expect(llmTranslator.translateText('Hello', 'de')).rejects.toThrow('Connection refused');
    });

    it('should use default LLM config values', async () => {
      const minimalConfig: TranslatinatorConfig = {
        engine: 'llm',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: './locales'
      };

      const minimalTranslator = new TranslationService(minimalConfig, cacheManager, logger);
      await minimalTranslator.translateText('Hello', 'de');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:11434/v1/chat/completions',
        expect.objectContaining({ model: 'translategemma' }),
        expect.any(Object)
      );
    });

    it('should use custom baseUrl and model when configured', async () => {
      const customConfig: TranslatinatorConfig = {
        engine: 'llm',
        sourceFile: 'en.json',
        targetLanguages: ['de'],
        localesDir: './locales',
        llm: {
          model: 'translategemma:12b',
          baseUrl: 'http://192.168.1.100:8080'
        }
      };

      const customTranslator = new TranslationService(customConfig, cacheManager, logger);
      await customTranslator.translateText('Hello', 'de');

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://192.168.1.100:8080/v1/chat/completions',
        expect.objectContaining({ model: 'translategemma:12b' }),
        expect.any(Object)
      );
    });

    it('should translate objects with LLM engine', async () => {
      const input = { greeting: 'Hello', farewell: 'Goodbye' };

      mockAxios.post
        .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Hallo' } }] } })
        .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Auf Wiedersehen' } }] } });

      const result = await llmTranslator.translateObject(input, 'de');

      expect(result).toEqual({ greeting: 'Hallo', farewell: 'Auf Wiedersehen' });
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should return usage info with llm engine', async () => {
      const result = await llmTranslator.getUsage();

      expect(result).toEqual({
        character: { count: 0, limit: 'unlimited' },
        engine: 'llm'
      });
    });

    describe('LLM context-aware translation', () => {
      beforeEach(() => {
        mockAxios.post.mockReset();
        mockAxios.post.mockResolvedValue({
          data: {
            choices: [{ message: { content: 'Tradotto' } }]
          }
        });
      });

      it('should include key path and sibling strings when translating nested objects', async () => {
        const input = {
          server: {
            deployment: {
              starter: 'Starter',
              pro: 'Pro',
              enterprise: 'Enterprise'
            }
          }
        };

        await llmTranslator.translateObject(input, 'it');

        const prompt = mockAxios.post.mock.calls[0][1].messages[0].content;
        expect(prompt).toContain('Key path: server.deployment.starter');
        expect(prompt).toContain('- pro: "Pro"');
        expect(prompt).toContain('- enterprise: "Enterprise"');
        expect(prompt).toContain('Starter');
      });

      it('should cap sibling context at maxSiblingContext (default 3)', async () => {
        const input = {
          section: {
            a: 'A',
            b: 'B',
            c: 'C',
            d: 'D',
            e: 'E',
            target: 'Target'
          }
        };

        await llmTranslator.translateObject(input, 'de');

        const prompt = mockAxios.post.mock.calls.find(
          (call: any[]) => call[1].messages[0].content.includes('Key path: section.target')
        )?.[1].messages[0].content;

        expect(prompt).toBeDefined();
        const siblingLines = prompt.match(/^- \w+: "/gm) || [];
        expect(siblingLines.length).toBeLessThanOrEqual(3);
        expect(prompt).not.toContain('- target: "Target"');
      });

      it('should not include context section for direct translateText calls', async () => {
        await llmTranslator.translateText('Hello', 'de');

        const prompt = mockAxios.post.mock.calls[0][1].messages[0].content;
        expect(prompt).not.toContain('Key path:');
        expect(prompt).not.toContain('software UI translation file');
      });

      it('should use path-scoped cache keys for the same text at different paths', async () => {
        mockAxios.post
          .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Antipasto' } }] } })
          .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'Base' } }] } });

        await llmTranslator.translateObject({ menu: { starter: 'Starter' } }, 'it');
        await llmTranslator.translateObject({ server: { deployment: { starter: 'Starter' } } }, 'it');

        expect(mockAxios.post).toHaveBeenCalledTimes(2);
        expect(cacheManager.getCachedTranslation('menu.starter:Starter', 'it')).not.toBeNull();
        expect(cacheManager.getCachedTranslation('server.deployment.starter:Starter', 'it')).not.toBeNull();
      });

      it('should pass numCtx in the API payload options when configured', async () => {
        await llmTranslator.translateText('Hello', 'de');

        const payload = mockAxios.post.mock.calls[0][1];
        expect(payload.options).toEqual({ num_ctx: 2048 });
      });

      it('should omit options.num_ctx when numCtx is not configured', async () => {
        const noCtxConfig: TranslatinatorConfig = {
          engine: 'llm',
          sourceFile: 'en.json',
          targetLanguages: ['de'],
          localesDir: './locales',
          llm: {
            model: 'translategemma',
            baseUrl: 'http://localhost:11434'
          }
        };
        const noCtxTranslator = new TranslationService(noCtxConfig, cacheManager, logger);
        await noCtxTranslator.translateText('Hello', 'de');

        const payload = mockAxios.post.mock.calls[mockAxios.post.mock.calls.length - 1][1];
        expect(payload.options).toBeUndefined();
      });

      it('should JSON-escape sibling values with quotes in the prompt', async () => {
        const input = {
          section: {
            label: 'Say "hello"',
            target: 'Target'
          }
        };

        await llmTranslator.translateObject(input, 'de');

        const prompt = mockAxios.post.mock.calls.find(
          (call: any[]) => call[1].messages[0].content.includes('Key path: section.target')
        )?.[1].messages[0].content;

        expect(prompt).toContain('- label: "Say \\"hello\\""');
      });

      it('should not include sibling context when maxSiblingContext is 0', async () => {
        const noSiblingsConfig: TranslatinatorConfig = {
          engine: 'llm',
          sourceFile: 'en.json',
          targetLanguages: ['de'],
          localesDir: './locales',
          llm: {
            model: 'translategemma',
            baseUrl: 'http://localhost:11434',
            maxSiblingContext: 0
          }
        };
        const noSiblingsTranslator = new TranslationService(
          noSiblingsConfig,
          cacheManager,
          logger
        );

        await noSiblingsTranslator.translateObject(
          { section: { a: 'A', target: 'Target' } },
          'de'
        );

        const prompt = mockAxios.post.mock.calls.find((call: any[]) =>
          /Key path: section\.target(\s|$)/.test(call[1].messages[0].content)
        )?.[1].messages[0].content;

        expect(prompt).toBeDefined();
        expect(prompt).not.toContain('Related strings in the same section');
      });

      it('should include adjacent array strings as sibling context', async () => {
        const input = {
          items: ['First', 'Second', 'Third']
        };

        await llmTranslator.translateObject(input, 'de');

        const prompt = mockAxios.post.mock.calls.find(
          (call: any[]) => call[1].messages[0].content.includes('Key path: items.1')
        )?.[1].messages[0].content;

        expect(prompt).toBeDefined();
        expect(prompt).toContain('- 0: "First"');
        expect(prompt).toContain('- 2: "Third"');
      });

      it('should prefer siblings with similar key prefixes', async () => {
        const input = {
          section: {
            starterLabel: 'Starter label',
            starterHint: 'Starter hint',
            alpha: 'Alpha',
            beta: 'Beta',
            gamma: 'Gamma',
            starter: 'Starter'
          }
        };

        await llmTranslator.translateObject(input, 'de');

        const prompt = mockAxios.post.mock.calls.find((call: any[]) =>
          /Key path: section\.starter(\s|$)/.test(call[1].messages[0].content)
        )?.[1].messages[0].content;

        expect(prompt).toBeDefined();
        expect(prompt).toContain('- starterLabel:');
        expect(prompt).toContain('- starterHint:');
        expect(prompt).not.toContain('- gamma:');
      });
    });
  });

  describe('translateObject context (non-LLM)', () => {
    it('should use text-only cache keys for conventional engines', async () => {
      const translate = require('translate');
      translate.mockResolvedValue('Hallo');

      const input = { server: { label: 'Hello' } };
      await translator.translateObject(input, 'de');

      expect(cacheManager.getCachedTranslation('Hello', 'de')).not.toBeNull();
      expect(cacheManager.getCachedTranslation('server.label:Hello', 'de')).toBeNull();
    });
  });
});
