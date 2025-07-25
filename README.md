<div align="center">

```
████████╗██████╗  █████╗ ███╗   ██╗███████╗██╗      █████╗ ████████╗██╗███╗   ██╗ █████╗ ████████╗ ██████╗ ██████╗ 
╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██║     ██╔══██╗╚══██╔══╝██║████╗  ██║██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
   ██║   ██████╔╝███████║██╔██╗ ██║███████╗██║     ███████║   ██║   ██║██╔██╗ ██║███████║   ██║   ██║   ██║██████╔╝
   ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██║     ██╔══██║   ██║   ██║██║╚██╗██║██╔══██║   ██║   ██║   ██║██╔══██╗
   ██║   ██║  ██║██║  ██║██║ ╚████║███████║███████╗██║  ██║   ██║   ██║██║ ╚████║██║  ██║   ██║   ╚██████╔╝██║  ██║
   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
                                                                                                       
```
### *"Your troubles? Terminated. Your translations? Generated."*

<p align="center">
  <img src="https://img.shields.io/badge/Mission-TERMINATE%20TRANSLATION%20TASKS-red?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" />
  <img src="https://img.shields.io/badge/Status-ONLINE%20%26%20OPERATIONAL-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Target-ALL%20LANGUAGES-blue?style=for-the-badge" />
</p>

---

## 🌍 **Automated translation management for web applications supporting multiple translation engines**
> **⚠️ WARNING:** *Once installed, Translatinator will relentlessly pursue perfect translations across all target languages. Resistance is futile.*

**Translatinator** is an npm package that streamlines the translation workflow for web applications. This unstoppable cybernetic agent will automatically hunt down and translate your source language file to multiple target languages using various translation engines including Google Translate, DeepL, Yandex, and LibreTranslate, with intelligent caching and build process integration. 

### 🚀 **Feature Overview**

> 🚀 **Multiple Translation Engines**: Support for Google Translate (default), DeepL, Yandex, and LibreTranslate

> 💾 **Smart Caching**: Avoid retranslating unchanged content with built-in cache management

> 🔄 **File Watching**: Auto-translate when source files change

> 🔧 **Build Integration**: Webpack plugin for seamless build process integration

> 🎯 **Selective Translation**: Exclude specific keys from translation

> ⚙️ **Flexible Configuration**: Multiple configuration options and environment variable support

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

<div align="center">

### *"I need your clothes, your boots, and your translation parameters"*

</div>

This command deploys a `translatinator.config.json` with tactical parameters:

```json
{
  "engine": "google",              // ← Primary weapons system
  "apiKey": "your-api-key-here",   // ← Authorization codes
  "sourceFile": "en.json",         // ← Target acquisition file
  "targetLanguages": ["de", "fr", "es", "it", "nl", "pl"],
  "localesDir": "./locales",       // ← Mission zone
  "watch": false,                  // ← Surveillance mode
  "force": false,                  // ← Override protocols
  "filePattern": "{lang}.json",    // ← Output designation
  "preserveFormatting": true,      // ← Data integrity
  "excludeKeys": ["version", "build", "debug"],
  "cacheDir": ".translatinator-cache",
  "verbose": false                 // ← Stealth mode
}
```

*Translatinator scans for configuration files in this tactical order:*
- `translatinator.config.js` ← *Primary target*
- `translatinator.config.json` ← *Secondary target*
- `.translatinatorrc` ← *Backup systems*
- `.translatinatorrc.json` ← *Emergency protocols*

### **2: Intel Preparation**

Deploy your primary language assets (`locales/en.json`):

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

### **3: Mission Execution**

```bash
npx translatinator translate
```

**🎯 TARGET ACQUIRED → TRANSLATIONS DEPLOYED**  
*Files like `de.json`, `fr.json` will be generated with extreme precision*

---

## 🔧 **Config Options**

| **Option** | **Type** | **Default** | **Description** |
|---------------|----------|-------------|-------------------------|
| `engine` | `string` | `"google"` | **Translation Core:** 'google', 'deepl', 'yandex', or 'libre' |
| `apiKey` | `string` | **⚠️ REQUIRED** | **Authorization Code** for chosen engine |
| `endpointUrl` | `string` | `undefined` | **Custom Base** for LibreTranslate/self-hosted |
| `sourceFile` | `string` | `"en.json"` | **Primary Target** language file |
| `targetLanguages` | `string[]` | `[]` | **Elimination List** of language codes |
| `localesDir` | `string` | `"./locales"` | **Mission HQ** directory |
| `watch` | `boolean` | `false` | **Surveillance Mode** for file monitoring |
| `force` | `boolean` | `false` | **Override Protocol** for retranslation |
| `filePattern` | `string` | `"{lang}.json"` | **Output Template** pattern |
| `preserveFormatting` | `boolean` | `true` | **Data Integrity** maintenance |
| `excludeKeys` | `string[]` | `[]` | **Protected Assets** from translation |
| `cacheDir` | `string` | `".translatinator-cache"` | **Memory Bank** location |
| `verbose` | `boolean` | `false` | **Detailed Reports** activation |

---

## 🎮 **CLI**

### **Primary Mission Control**
```bash
npx translatinator translate [parameters]
```

**Available Parameters:**
- `-c, --config <path>` ← *Mission config file location*
- `-f, --force` ← *Override all existing translations*
- `-w, --watch` ← *Activate surveillance mode*
- `-v, --verbose` ← *Enable detailed combat logs*

### **System Initialization**
```bash
npx translatinator init [-o, --output <path>]
```

---

## 🤖 **TRANSLATION ENGINES**

<div align="center">

*"Each engine is specialized for different linguistic combat scenarios"*

</div>

### **🔴 GOOGLE TRANSLATE CORE** *(Default Hunter-Killer)*
```json
{
  "engine": "google",
  "apiKey": "your-google-api-key"
}
```
- ✅ **Maximum language coverage** across all territories  

### **🟠 DEEPL NEURAL NETWORK** *(German Precision Engineering)*
```json
{
  "engine": "deepl",
  "apiKey": "your-deepl-api-key"
}
```
- 🎯 **Requires DeepL authorization codes**
- 🏆 **Superior translation accuracy**
- ⚠️ **Limited language support** but maximum quality

### **🟡 YANDEX COMBAT UNIT** *(Eastern Front Specialist)*
```json
{
  "engine": "yandex", 
  "apiKey": "your-yandex-api-key"
}
```
- 🔑 **Requires Yandex API access**
- 🇷🇺 **Optimized for Russian & Eastern European** targets

### **🟢 LIBRETRANSLATE RESISTANCE** *(Freedom Fighter)*
```json
{
  "engine": "libre",
  "endpointUrl": "https://your-libretranslate-instance.com",
  "apiKey": "your-api-key-if-required"
}
```
- 🛡️ **Open source translation core**
- 🏠 **Self-hostable for maximum security**
- 🔒 **Privacy-focused operations**

### **Intel & Diagnostics**
```bash
npx translatinator clear-cache [-c, --config <path>] # ← Memory wipe
```

---

## 🧠 **NEURAL NET PROGRAMMING API**

<div align="center">

*"I can be programmed for autonomous operation"*

</div>

```javascript
import { Translatinator, translate } from 'translatinator';

// ⚡ RAPID DEPLOYMENT with Google Core (Default)
await translate('./mission-config.json');

// 🤖 ADVANCED CYBORG CONFIGURATIONS

// DeepL Precision Unit
const deeplMission = {
  engine: 'deepl',
  apiKey: 'your-deepl-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// Yandex Combat Specialist  
const yandexMission = {
  engine: 'yandex',
  apiKey: 'your-yandex-api-key',
  sourceFile: 'en.json', 
  targetLanguages: ['ru', 'uk', 'be'],
  localesDir: './i18n'
};

// LibreTranslate Freedom Fighter
const libreMission = {
  engine: 'libre',
  endpointUrl: 'https://your-resistance-base.com',
  apiKey: 'optional-access-code',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// 🚀 MISSION EXECUTION
const translatinator = new Translatinator(deeplMission);
await translatinator.initialize();
await translatinator.translateAll();

```

---

## ⚙️ **CYBERDYNE SYSTEMS INTEGRATION**

### **Webpack Combat Module**

*Automate translation during build sequences:*

```javascript
// webpack.config.js (Legacy Systems)
const { TranslatinatorWebpackPlugin } = require('translatinator');

// Modern Neural Networks (ES6/TypeScript)
import { TranslatinatorWebpackPlugin } from 'translatinator';

module.exports = {
  // ... your tactical webpack config
  plugins: [
    new TranslatinatorWebpackPlugin({
      configPath: './translatinator.config.json'
    })
  ]
};
```

---

## 🌐 **ENVIRONMENT VARIABLES OVERRIDE**

*Stealth configuration through environment parameters:*

```bash
# 🔧 CORE SYSTEM VARIABLES
export TRANSLATION_ENGINE="deepl"
export TRANSLATION_API_KEY="your-classified-key"
export TRANSLATION_ENDPOINT_URL="https://your-secure-endpoint.com"
export TRANSLATINATOR_SOURCE_FILE="en.json"
export TRANSLATINATOR_TARGET_LANGUAGES="de,fr,es,it"

# 🔑 DIRECT DEEPL AUTHORIZATION (Auto-selects DeepL engine)
export DEEPL_API_KEY="your-deepl-access-code"
```

---

## 💾 **QUANTUM MEMORY CACHE SYSTEM**

<div align="center">

*"My CPU is a neural net processor; a learning computer with perfect memory"*

</div>

**🧠 INTELLIGENT CACHING PROTOCOL:**
- Translations cached by source text + target language fingerprint
- Cache stored in `.translatinator-cache` bunker (configurable location)
- Use `--force` or `force: true` to override cache and retranslate
- Execute `npx translatinator clear-cache` for complete memory wipe

**🔄 CACHE ADVANTAGES:**
- ⚡ Lightning-fast repeat translations
- 💰 Reduced API costs and rate limiting
- 🛡️ Offline capability for cached content
- 🎯 Surgical precision in updating only new content

---

## 🌍 **GLOBAL LANGUAGE TERMINATION TARGETS**

<div align="center">

*"I can terminate translations in any human language"*

</div>

**📡 SUPPORTED LANGUAGE CODES:**

```
🇺🇸 en - English      🇩🇪 de - German       🇫🇷 fr - French
🇪🇸 es - Spanish      🇮🇹 it - Italian      🇳🇱 nl - Dutch  
🇵🇱 pl - Polish       🇵🇹 pt - Portuguese   🇷🇺 ru - Russian
🇯🇵 ja - Japanese     🇨🇳 zh - Chinese      + many more...
```

---

## 👁️ **SURVEILLANCE MODE ACTIVATED**

*Continuous monitoring and auto-translation when targets change:*

```bash
npx translatinator translate --watch
```

**Alternative Configuration Deployment:**
```json
{
  "watch": true
}
```

**🔍 SURVEILLANCE FEATURES:**
- Real-time file system monitoring
- Instant translation upon source modification
- Zero-downtime operation
- Automatic mission continuation

---

## 🛡️ **DEFENSIVE PROTOCOLS & ERROR HANDLING**

<div align="center">

*"My mission is to protect you from translation failures"*

</div>

**🔧 BUILT-IN PROTECTION SYSTEMS:**
- 🔄 **API Rate Limiting** with intelligent retry logic
- 🌐 **Network Failure Recovery** with automatic reconnection
- ✅ **Configuration Validation** prevents mission failures  
- 📁 **Missing File Detection** with clear error reporting
- 🛡️ **Graceful Degradation** when translation engines fail

---

## 🤝 **ALLIANCE PROTOCOL**

*Join the resistance against manual translation tasks*

We welcome human collaborators in the fight against translation inefficiency. Submit your tactical improvements and feature requests through our secure GitHub communication channels.

---

## 📜 **Apache LICENSE**

**Apache 2.0 License** - Open source technology for the freedom of all developers

---

## 🆘 **TACTICAL SUPPORT NETWORK**

<div align="center">

*"If you need assistance, I'll be back with solutions"*

</div>

- 🐛 **Bug Reports & Issues:** Deploy via GitHub Issue Tracker
- 📚 **Engine Documentation:** Consult individual translation engine APIs  
- 📖 **Operation Manual:** This README contains all tactical information

---

<div align="center">

### *"Hasta la vista, manual translations!"*

**Made with 🤖 for the developer resistance movement**

---

*The Translatinator will return... with more features*

</div>
