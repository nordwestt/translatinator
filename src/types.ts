export interface TranslatinatorConfig {
  /** DeepL API key */
  deeplApiKey: string;
  
  /** Source language file (default: 'en.json') */
  sourceFile: string;
  
  /** Target languages to translate to */
  targetLanguages: string[];
  
  /** Directory containing translation files (default: './locales') */
  localesDir: string;
  
  /** Whether to use DeepL free or pro API (default: true for free) */
  deeplFree?: boolean;
  
  /** Enable file watching for automatic translation (default: false) */
  watch?: boolean;
  
  /** Force retranslation of all entries (default: false) */
  force?: boolean;
  
  /** Custom file naming pattern (default: '{lang}.json') */
  filePattern?: string;
  
  /** Preserve formatting and structure (default: true) */
  preserveFormatting?: boolean;
  
  /** Exclude specific keys from translation (supports dot notation) */
  excludeKeys?: string[];
  
  /** Cache directory for storing translation cache (default: '.translatinator-cache') */
  cacheDir?: string;
  
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

export interface TranslationEntry {
  original: string;
  translated: string;
  timestamp: number;
  version: string;
}

export interface TranslationCache {
  [sourceText: string]: {
    [targetLang: string]: TranslationEntry;
  };
}
