import translate from "translate";
import axios from 'axios';
import { TranslatinatorConfig, TranslationCache, TranslationEntry, LLMConfig } from './types';
import { CacheManager } from './cache';
import { Logger } from './logger';

const LANGUAGE_NAMES: Record<string, string> = {
  aa: 'Afar', ab: 'Abkhazian', af: 'Afrikaans', ak: 'Akan', am: 'Amharic',
  an: 'Aragonese', ar: 'Arabic', as: 'Assamese', av: 'Avaric', ay: 'Aymara',
  az: 'Azerbaijani', ba: 'Bashkir', be: 'Belarusian', bg: 'Bulgarian',
  bh: 'Bihari', bi: 'Bislama', bm: 'Bambara', bn: 'Bengali', bo: 'Tibetan',
  br: 'Breton', bs: 'Bosnian', ca: 'Catalan', ce: 'Chechen', co: 'Corsican',
  cs: 'Czech', cv: 'Chuvash', cy: 'Welsh', da: 'Danish', de: 'German',
  dv: 'Divehi', dz: 'Dzongkha', ee: 'Ewe', el: 'Greek', en: 'English',
  eo: 'Esperanto', es: 'Spanish', et: 'Estonian', eu: 'Basque', fa: 'Persian',
  fi: 'Finnish', fj: 'Fijian', fo: 'Faroese', fr: 'French', fy: 'Western Frisian',
  ga: 'Irish', gd: 'Scottish Gaelic', gl: 'Galician', gn: 'Guarani', gu: 'Gujarati',
  gv: 'Manx', ha: 'Hausa', he: 'Hebrew', hi: 'Hindi', ho: 'Hiri Motu',
  hr: 'Croatian', ht: 'Haitian', hu: 'Hungarian', hy: 'Armenian', ia: 'Interlingua',
  id: 'Indonesian', ie: 'Interlingue', ig: 'Igbo', ik: 'Inupiaq', io: 'Ido',
  is: 'Icelandic', it: 'Italian', iu: 'Inuktitut', ja: 'Japanese', jv: 'Javanese',
  ka: 'Georgian', kg: 'Kongo', ki: 'Kikuyu', kj: 'Kwanyama', kk: 'Kazakh',
  km: 'Central Khmer', kn: 'Kannada', ko: 'Korean', kr: 'Kanuri', ks: 'Kashmiri',
  ku: 'Kurdish', kv: 'Komi', kw: 'Cornish', ky: 'Kyrgyz', la: 'Latin',
  lb: 'Luxembourgish', lg: 'Ganda', li: 'Limburgan', ln: 'Lingala', lo: 'Lao',
  lt: 'Lithuanian', lu: 'Luba-Katanga', lv: 'Latvian', mg: 'Malagasy', mi: 'Maori',
  mk: 'Macedonian', ml: 'Malayalam', mn: 'Mongolian', mr: 'Marathi', ms: 'Malay',
  mt: 'Maltese', my: 'Burmese', na: 'Nauru', nb: 'Norwegian Bokmål', nd: 'North Ndebele',
  ne: 'Nepali', nl: 'Dutch', nn: 'Norwegian Nynorsk', no: 'Norwegian', nr: 'South Ndebele',
  nv: 'Navajo', ny: 'Chichewa', oc: 'Occitan', om: 'Oromo', or: 'Oriya',
  os: 'Ossetian', pa: 'Punjabi', pl: 'Polish', ps: 'Pashto', pt: 'Portuguese',
  qu: 'Quechua', rm: 'Romansh', rn: 'Rundi', ro: 'Romanian', ru: 'Russian',
  rw: 'Kinyarwanda', sa: 'Sanskrit', sc: 'Sardinian', sd: 'Sindhi', se: 'Northern Sami',
  sg: 'Sango', si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', sm: 'Samoan',
  sn: 'Shona', so: 'Somali', sq: 'Albanian', sr: 'Serbian', ss: 'Swati',
  st: 'Southern Sotho', su: 'Sundanese', sv: 'Swedish', sw: 'Swahili', ta: 'Tamil',
  te: 'Telugu', tg: 'Tajik', th: 'Thai', ti: 'Tigrinya', tk: 'Turkmen',
  tl: 'Tagalog', tn: 'Tswana', to: 'Tongan', tr: 'Turkish', ts: 'Tsonga',
  tt: 'Tatar', tw: 'Twi', ty: 'Tahitian', ug: 'Uyghur', uk: 'Ukrainian',
  ur: 'Urdu', uz: 'Uzbek', ve: 'Venda', vi: 'Vietnamese', wo: 'Wolof',
  xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', za: 'Zhuang', zh: 'Chinese',
  zu: 'Zulu'
};

export class TranslationService {
  private cache: CacheManager;
  private logger: Logger;
  private config: TranslatinatorConfig;

  constructor(config: TranslatinatorConfig, cache: CacheManager, logger: Logger) {
    this.config = config;
    this.cache = cache;
    this.logger = logger;
    this.setupTranslateEngine();
  }

  private getLLMConfig(): Required<LLMConfig> {
    return {
      model: this.config.llm?.model || 'translategemma',
      baseUrl: (this.config.llm?.baseUrl || 'http://localhost:11434').replace(/\/+$/, ''),
      numCtx: this.config.llm?.numCtx || 2048
    };
  }

  private getLanguageName(code: string): string {
    const primary = code.split('-')[0];
    return LANGUAGE_NAMES[primary] || primary;
  }

  private setupTranslateEngine(): void {
    if (this.config.engine === 'llm') {
      const oc = this.getLLMConfig();
      this.logger.debug(`OpenAI-compatible engine configured: model=${oc.model}, baseUrl=${oc.baseUrl}`);
      return;
    }

    translate.engine = this.config.engine || 'google';
    
    if (this.config.apiKey) {
      translate.key = this.config.apiKey;
    } 
    
    if (this.config.endpointUrl) {
      try {
        (translate as any).url = this.config.endpointUrl;
      } catch (error) {
        this.logger.warn('Custom endpoint URL setting is not supported by this version of the translate package');
      }
    }

    this.logger.debug(`Translation engine set to: ${translate.engine}`);
  }

  private async translateWithLLM(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    const oc = this.getLLMConfig();
    const sourceName = this.getLanguageName(sourceLang);
    const targetName = this.getLanguageName(targetLang);

    const prompt = `You are a professional ${sourceName} (${sourceLang}) to ${targetName} (${targetLang}) translator. Your goal is to accurately convey the meaning and nuances of the original ${sourceName} text while adhering to ${targetName} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetName} translation, without any additional explanations or commentary. Please translate the following ${sourceName} text into ${targetName}:


${text}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await axios.post(
      `${oc.baseUrl}/v1/chat/completions`,
      {
        model: oc.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      },
      { headers }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Invalid response from OpenAI-compatible API: missing choices[0].message.content');
    }

    return content.trim();
  }

  async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    const cached = this.cache.getCachedTranslation(text, targetLang);
    if (cached && !this.config.force) {
      this.logger.debug(`Using cached translation for "${text}" -> ${targetLang}`);
      return cached.translated;
    }

    try {
      this.logger.debug(`Translating "${text}" from ${sourceLang} to ${targetLang}`);

      const translatedText = this.config.engine === 'llm'
        ? await this.translateWithLLM(text, targetLang, sourceLang)
        : await translate(text, { from: sourceLang, to: targetLang });
      
      this.cache.setCachedTranslation(text, targetLang, {
        original: text,
        translated: translatedText,
        timestamp: Date.now(),
        version: '1.0.0'
      });

      return translatedText;
    } catch (error) {
      this.logger.error(`Failed to translate "${text}" to ${targetLang}:`, error);
      throw error;
    }
  }

  async translateObject(obj: any, targetLang: string, sourceLang: string = 'en'): Promise<any> {
    if (typeof obj === 'string') {
      return await this.translateText(obj, targetLang, sourceLang);
    }

    if (Array.isArray(obj)) {
      const results = [];
      for (const item of obj) {
        results.push(await this.translateObject(item, targetLang, sourceLang));
      }
      return results;
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this key should be excluded
        if (this.shouldExcludeKey(key)) {
          result[key] = value;
          continue;
        }

        result[key] = await this.translateObject(value, targetLang, sourceLang);
      }
      return result;
    }

    return obj;
  }

  private shouldExcludeKey(key: string): boolean {
    if (!this.config.excludeKeys) return false;
    return this.config.excludeKeys.includes(key);
  }

  async getUsage(): Promise<any> {
    try {
      this.logger.warn('Usage information is not available with the current translation engine');
      return {
        character: { 
          count: 0, 
          limit: 'unlimited' 
        },
        engine: this.config.engine || translate.engine
      };
    } catch (error) {
      this.logger.error('Failed to get API usage:', error);
      throw error;
    }
  }
}
