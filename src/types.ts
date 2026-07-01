export type TranslationEngine = 'google' | 'yandex' | 'libre' | 'deepl' | 'llm';

export interface TranslatinatorConfig {
  /** Translation engine to use (default: 'google') */
  engine?: TranslationEngine;
  
  /** API key for the translation engine */
  apiKey?: string;
  
  /** Custom endpoint URL (for engines like LibreTranslate) */
  endpointUrl?: string;
  
  /** Source language file (default: 'en.json') */
  sourceFile: string;
  
  /** Target languages to translate to */
  targetLanguages: string[];
  
  /** Directory containing translation files (default: './locales') */
  localesDir: string;
  
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

  /** Flush locale file and cache after this many translated keys (default: 10, set 0 to disable) */
  saveBatchSize?: number;

  /** Show a progress bar during translation (default: true when stderr is a TTY) */
  showProgress?: boolean;

  /** OpenAI-compatible API configuration (used with 'llm' engine) */
  llm?: LLMConfig;
}

export interface LLMConfig {
  /** Model name (default: 'translategemma') */
  model?: string;
  /** Base URL for the OpenAI-compatible API (default: 'http://localhost:11434') */
  baseUrl?: string;
  /** Context window size for Ollama-compatible APIs (omit to skip sending options.num_ctx) */
  numCtx?: number;
  /** Max sibling strings to include in LLM context (default: 3) */
  maxSiblingContext?: number;
}

export interface TranslationContext {
  keyPath: string[];
  siblings?: Array<{ key: string; value: string }>;
}

export interface TranslationProgressCallbacks {
  onProgress?: (completed: number, total: number, keyPath: string) => void | Promise<void>;
  onKeyTranslated?: (keyPath: string[], value: string) => void | Promise<void>;
}

export interface TranslateObjectOptions {
  progress?: TranslationProgressCallbacks;
  /** @internal */
  _progressState?: {
    completed: number;
    total: number;
    onProgress?: TranslationProgressCallbacks['onProgress'];
    onKeyTranslated?: TranslationProgressCallbacks['onKeyTranslated'];
  };
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
