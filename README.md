## 🌍 **Automated translation management for web applications supporting multiple translation engines**
<div align="center">

<p align="center">
  <img src="https://img.shields.io/badge/Purpose-Translation%20Automation-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Languages-All-blue?style=for-the-badge" />
</p>

---

**Translatinator** is an npm package that streamlines the translation workflow for web applications. It automatically translates your source language file into multiple target languages with various translation engines including Google Translate, DeepL, Yandex, LibreTranslate, and LLM-assisted translation via translategemma, with intelligent caching and build process integration.

### 🚀 **Features**

- 🚀 **Multiple Translation Engines**: Google Translate (default), DeepL, Yandex, LibreTranslate  
- 🧠 **LLM-Assisted Translation**: Integration with translategemma for local/cloud LLM-based translation
- 💾 **Smart Caching**: Avoid retranslating unchanged content with built-in cache management  
- 🔄 **File Watching**: Auto-translate when source files change  
- 🔧 **Build Integration**: Webpack plugin for seamless build process integration  
- 🎯 **Selective Translation**: Exclude specific keys from translation  
- ⚙️ **Flexible Configuration**: Multiple configuration options and environment variable support  


</div>


---

## ⚡ **Installation**

```bash
npm install translatinator
```

---

### **1. Initialize Configuration**

```bash
npx translatinator init
```

This command generates a `translatinator.config.json` with default settings:

```json
{
  "engine": "google",
  "apiKey": "your-api-key-here",
  "sourceFile": "en.json",
  "targetLanguages": ["de", "fr", "es", "it", "nl", "pl"],
  "localesDir": "./locales",
  "watch": false,
  "force": false,
  "filePattern": "{lang}.json",
  "preserveFormatting": true,
  "excludeKeys": ["version", "build", "debug"],
  "cacheDir": ".translatinator-cache",
  "verbose": false
}
```

*Translatinator scans for configuration files in this order:*
- `translatinator.config.js`
- `translatinator.config.json`
- `.translatinatorrc`
- `.translatinatorrc.json`

### **2: Source File**

Create your primary language file (`locales/en.json`):

```json
{
  "welcome": "Welcome to our application",
  "navigation": {
    "home": "Home",
    "about": "About", 
    "contact": "Contact"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel"
  }
}
```

### **3: Run Translation**

```bash
npx translatinator translate
```

**Target files** like `de.json`, `fr.json` will be generated automatically.

---

## 🔧 **Config Options**

| Option | Type | Default | Description |
|---------------|----------|-------------|-------------------------|
| `engine` | `string` | `"google"` | Translation engine: 'google', 'deepl', 'yandex', 'libre', or 'llm' |
| `apiKey` | `string` | **⚠️ REQUIRED** | API key for the chosen engine |
| `endpointUrl` | `string` | `undefined` | Custom endpoint for LibreTranslate/self-hosted or llm |
| `sourceFile` | `string` | `"en.json"` | Source language file |
| `targetLanguages` | `string[]` | `[]` | Target language codes |
| `localesDir` | `string` | `"./locales"` | Output directory |
| `watch` | `boolean` | `false` | Enable file watching |
| `force` | `boolean` | `false` | Force retranslation of all content |
| `filePattern` | `string` | `"{lang}.json"` | Output file naming pattern |
| `preserveFormatting` | `boolean` | `true` | Preserve formatting in translations |
| `excludeKeys` | `string[]` | `[]` | Keys to exclude from translation |
| `cacheDir` | `string` | `".translatinator-cache"` | Cache directory |
| `verbose` | `boolean` | `false` | Enable verbose output |

---

## 🎮 **CLI**

### **Translate**
```bash
npx translatinator translate [options]
```

**Options:**
- `-c, --config <path>` — Config file path
- `-f, --force` — Force retranslate all content
- `-w, --watch` — Watch for file changes
- `-v, --verbose` — Enable verbose logging

### **Init**
```bash
npx translatinator init [-o, --output <path>]
```

---

## 🤖 **TRANSLATION ENGINES**

### **🔴 GOOGLE TRANSLATE**
```json
{
  "engine": "google",
  "apiKey": "your-google-api-key"
}
```
- ✅ Broad language support

### **🟠 DEEPL**
```json
{
  "engine": "deepl",
  "apiKey": "your-deepl-api-key"
}
```
- 🎯 Requires DeepL API key
- 🏆 High accuracy translations
- ⚠️ Limited language coverage

### **🟡 YANDEX**
```json
{
  "engine": "yandex", 
  "apiKey": "your-yandex-api-key"
}
```
- 🔑 Requires Yandex API key
- 🇷🇺 Optimized for Russian & Eastern European languages

### **🟢 LIBRETRANSLATE**
```json
{
  "engine": "libre",
  "endpointUrl": "https://your-libretranslate-instance.com",
  "apiKey": "your-api-key-if-required"
}
```
- 🛡️ Open source
- 🏠 Self-hostable
- 🔒 Privacy-focused

### **🧠 LLM (translategemma)**

LLM provides LLM-powered translation using translategemma models. It can run locally or connect to a cloud endpoint, offering high-quality, context-aware translations.

```json
{
  "engine": "llm",
  "endpointUrl": "http://localhost:8765",
  "sourceFile": "en.json",
  "targetLanguages": ["de", "fr", "es"],
  "localesDir": "./locales"
}
```

Features:
- 🤖 LLM-powered translations via translategemma models
- 💻 Local execution (no data leaves your machine)
- ☁️ Optional cloud endpoint support
- 🎯 Context-aware translations
- 🌐 Same CLI/API interface as other engines

### **Utilities**
```bash
npx translatinator clear-cache [-c, --config <path>]
```

---

## 🧠 **Programming API**

```javascript
import { Translatinator, translate } from 'translatinator';

// Quick translation
await translate('./config.json');

// Programmatic configuration

// Google Translate
const googleConfig = {
  engine: 'google',
  apiKey: 'your-google-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// DeepL
const deeplConfig = {
  engine: 'deepl',
  apiKey: 'your-deepl-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// Yandex
const yandexConfig = {
  engine: 'yandex',
  apiKey: 'your-yandex-api-key',
  sourceFile: 'en.json', 
  targetLanguages: ['ru', 'uk', 'be'],
  localesDir: './i18n'
};

// LibreTranslate
const libreConfig = {
  engine: 'libre',
  endpointUrl: 'https://your-libretranslate-instance.com',
  apiKey: 'optional-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// LLM (recommended to use translategemma)
const llmConfig = {
  engine: 'llm',
  endpointUrl: 'http://localhost:8765',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// Execute
const translatinator = new Translatinator(deeplConfig);
await translatinator.initialize();
await translatinator.translateAll();

```

---

## ⚙️ **Webpack Integration**

*Automate translation during build:*

```javascript
// webpack.config.js
const { TranslatinatorWebpackPlugin } = require('translatinator');

// or ES6/TypeScript
import { TranslatinatorWebpackPlugin } from 'translatinator';

module.exports = {
  plugins: [
    new TranslatinatorWebpackPlugin({
      configPath: './translatinator.config.json'
    })
  ]
};
```

---

## 🌐 **Environment Variables**

*Override configuration via environment variables:*

```bash
# Core settings
export TRANSLATION_ENGINE="deepl"
export TRANSLATION_API_KEY="your-api-key"
export TRANSLATION_ENDPOINT_URL="https://your-endpoint.com"
export TRANSLATINATOR_SOURCE_FILE="en.json"
export TRANSLATINATOR_TARGET_LANGUAGES="de,fr,es,it"

# Direct DeepL key (auto-selects DeepL engine)
export DEEPL_API_KEY="your-deepl-api-key"
```

---

## 💾 **Caching System**

**Intelligent Caching:**
- Translations cached by source text + target language
- Cache stored in `.translatinator-cache` directory (configurable)
- Use `--force` or `force: true` to bypass cache and retranslate
- Run `npx translatinator clear-cache` to clear all cached translations

**Benefits:**
- ⚡ Faster repeat translations
- 💰 Reduced API usage and costs
- 🛡️ Offline capability for cached content
- 🎯 Only translates new or changed content

---

## 🌍 **Supported Languages**

```
🇺🇸 en - English      🇩🇪 de - German       🇫🇷 fr - French
🇪🇸 es - Spanish      🇮🇹 it - Italian      🇳🇱 nl - Dutch  
🇵🇱 pl - Polish       🇵🇹 pt - Portuguese   🇷🇺 ru - Russian
🇯🇵 ja - Japanese     🇨🇳 zh - Chinese      + many more...
```

---

## 👁️ **Watch Mode**

*Continuous monitoring and auto-translation when source files change:*

```bash
npx translatinator translate --watch
```

**Config alternative:**
```json
{
  "watch": true
}
```

**Features:**
- Real-time file system monitoring
- Instant translation on source modification
- Zero-downtime operation

---

## 🛡️ **Error Handling**

**Built-in protections:**
- 🔄 **API Rate Limiting** with intelligent retry logic
- 🌐 **Network Failure Recovery** with automatic reconnection
- ✅ **Configuration Validation** prevents runtime errors
- 📁 **Missing File Detection** with clear error reporting
- 🛡️ **Graceful Degradation** when translation engines fail

---

## 🤝 **Contributing**

We welcome contributions! Submit improvements and feature requests through GitHub issues and pull requests.

---

## 📜 **License**

**Apache 2.0 License**

---

## 🆘 **Support**

- 🐛 **Bug Reports & Issues:** GitHub Issue Tracker
- 📚 **Engine Documentation:** Consult individual translation engine APIs  
- 📖 **Manual:** This README contains all usage information

---

<div align="center">

### *"Hasta la vista, manual translations!"*

**Made for the developer community**

---

*The Translatinator will return... with more features*

</div>
