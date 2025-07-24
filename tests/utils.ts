import * as fs from 'fs-extra';
import * as path from 'path';

export class TestUtils {
  static async createTempDir(prefix: string = 'test'): Promise<string> {
    const tempDir = path.join((global as any).TEST_DIR, prefix, Date.now().toString());
    await fs.ensureDir(tempDir);
    return tempDir;
  }

  static async createMockTranslationFiles(dir: string): Promise<void> {
    const sourceData = {
      common: {
        hello: 'Hello',
        goodbye: 'Goodbye',
        welcome: 'Welcome'
      },
      navigation: {
        home: 'Home',
        about: 'About',
        contact: 'Contact'
      },
      metadata: {
        version: '1.0.0',
        build: '123'
      }
    };

    await fs.writeJson(path.join(dir, 'en.json'), sourceData, { spaces: 2 });
  }

  static async createMockConfig(dir: string, overrides: any = {}): Promise<string> {
    const config = {
      deeplApiKey: 'test-api-key',
      sourceFile: 'en.json',
      targetLanguages: ['de', 'fr'],
      localesDir: dir,
      cacheDir: path.join(dir, '.cache'),
      excludeKeys: ['version', 'build'],
      verbose: false,
      ...overrides
    };

    const configPath = path.join(dir, 'translatinator.config.json');
    await fs.writeJson(configPath, config, { spaces: 2 });
    return configPath;
  }

  static mockDeepLTranslations(): Record<string, string> {
    return {
      'Hello': 'Hallo',
      'Goodbye': 'Auf Wiedersehen',
      'Welcome': 'Willkommen',
      'Home': 'Startseite',
      'About': 'Über uns',
      'Contact': 'Kontakt'
    };
  }

  static async cleanupDir(dir: string): Promise<void> {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }

  static expectTranslationStructure(translatedData: any, originalData: any): void {
    expect(typeof translatedData).toBe(typeof originalData);
    
    if (typeof originalData === 'object' && originalData !== null) {
      for (const key in originalData) {
        if (originalData.hasOwnProperty(key)) {
          expect(translatedData).toHaveProperty(key);
          
          if (typeof originalData[key] === 'object') {
            TestUtils.expectTranslationStructure(translatedData[key], originalData[key]);
          }
        }
      }
    }
  }

  static async waitFor(condition: () => Promise<boolean>, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

export const createSpies = () => ({
  consoleLog: jest.spyOn(console, 'log').mockImplementation(),
  consoleError: jest.spyOn(console, 'error').mockImplementation(),
  consoleWarn: jest.spyOn(console, 'warn').mockImplementation(),
});

export const restoreSpies = (spies: ReturnType<typeof createSpies>) => {
  Object.values(spies).forEach(spy => spy.mockRestore());
};
