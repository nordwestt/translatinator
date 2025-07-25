# Translatinator

🌍 **Automated translation management for web applications using multiple translation engines**

Translatinator is an npm package that streamlines the translation workflow for web applications. It automatically translates your source language file to multiple target languages using various translation engines including Google Translate, DeepL, Yandex, and LibreTranslate, with intelligent caching and build process integration.

## Features

- 🚀 **Multiple Translation Engines**: Support for Google Translate (default), DeepL, Yandex, and LibreTranslate
- 💾 **Smart Caching**: Avoid retranslating unchanged content with built-in cache management
- 🔄 **File Watching**: Auto-translate when source files change
- 🔧 **Build Integration**: Webpack plugin for seamless build process integration
- 🎯 **Selective Translation**: Exclude specific keys from translation
- 📊 **Usage Tracking**: Monitor API usage and cache statistics
- ⚙️ **Flexible Configuration**: Multiple configuration options and environment variable support
- 🔗 **Easy Migration**: Backwards compatible with existing DeepL configurations

## Installation

```bash
npm install translatinator
```

## Quick Start

### 1. Initialize Configuration

```bash
npx translatinator init
```

This creates a `translatinator.config.json` file:

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

**Configuration file discovery**: Translatinator will automatically look for configuration files in this order:
- `translatinator.config.js`
- `translatinator.config.json` 
- `.translatinatorrc`
- `.translatinatorrc.json`

### 2. Set up your source translation file

Create your source language file (e.g., `locales/en.json`):

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

### 3. Translate

```bash
npx translatinator translate
```

This will generate translated files like `de.json`, `fr.json`, etc. in your locales directory.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `engine` | string | `"google"` | Translation engine: 'google', 'deepl', 'yandex', or 'libre' |
| `apiKey` | string | **required** | API key for the chosen translation engine |
| `endpointUrl` | string | `undefined` | Custom endpoint URL (for LibreTranslate or self-hosted services) |
| `sourceFile` | string | `"en.json"` | Source language file name |
| `targetLanguages` | string[] | `[]` | Array of target language codes |
| `localesDir` | string | `"./locales"` | Directory containing translation files |
| `watch` | boolean | `false` | Watch source file for changes |
| `force` | boolean | `false` | Force retranslation of all entries |
| `filePattern` | string | `"{lang}.json"` | Output file naming pattern |
| `preserveFormatting` | boolean | `true` | Preserve JSON structure and formatting |
| `excludeKeys` | string[] | `[]` | Keys to exclude from translation |
| `cacheDir` | string | `".translatinator-cache"` | Cache directory path |
| `verbose` | boolean | `false` | Enable detailed logging |

### Legacy Configuration (Backwards Compatible)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `deeplApiKey` | string | **deprecated** | Use `apiKey` instead (automatically sets engine to 'deepl') |
| `deeplFree` | boolean | **deprecated** | No longer needed |

## CLI Usage

### Translate files
```bash
npx translatinator translate [options]
```

Options:
- `-c, --config <path>`: Path to config file
- `-f, --force`: Force retranslation of all entries
- `-w, --watch`: Watch for file changes and auto-translate
- `-v, --verbose`: Enable verbose logging

### Initialize configuration
```bash
npx translatinator init [-o, --output <path>]
```

## Translation Engines

Translatinator supports multiple translation engines:

### Google Translate (Default)
```json
{
  "engine": "google"
}
```
- No API key required for basic usage
- Supports most languages
- Rate limited for free usage

### DeepL
```json
{
  "engine": "deepl",
  "apiKey": "your-deepl-api-key"
}
```
- Requires DeepL API key
- High quality translations
- Supports fewer languages but better accuracy

### Yandex Translate
```json
{
  "engine": "yandex",
  "apiKey": "your-yandex-api-key"
}
```
- Requires Yandex API key
- Good for Russian and Eastern European languages

### LibreTranslate
```json
{
  "engine": "libre",
  "endpointUrl": "https://your-libretranslate-instance.com",
  "apiKey": "your-api-key-if-required"
}
```
- Open source translation engine
- Can be self-hosted
- Privacy-focused option

### Check API usage
```bash
npx translatinator usage [-c, --config <path>]
```

### Clear cache
```bash
npx translatinator clear-cache [-c, --config <path>]
```

## Programmatic API

```javascript
import { Translatinator, translate } from 'translatinator';

// Simple usage with Google Translate (default)
await translate('./my-config.json');

// DeepL configuration
const deeplConfig = {
  engine: 'deepl',
  apiKey: 'your-deepl-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

// Yandex configuration
const yandexConfig = {
  engine: 'yandex',
  apiKey: 'your-yandex-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['ru', 'uk', 'be'],
  localesDir: './i18n'
};

// LibreTranslate configuration
const libreConfig = {
  engine: 'libre',
  endpointUrl: 'https://your-instance.com',
  apiKey: 'optional-api-key',
  sourceFile: 'en.json',
  targetLanguages: ['de', 'fr', 'es'],
  localesDir: './i18n'
};

const translatinator = new Translatinator(deeplConfig);
await translatinator.initialize();
await translatinator.translateAll();

// Get usage info (limited support depending on engine)
const usage = await translatinator.getUsageInfo();
console.log(usage);
```

## Webpack Integration

Add the Translatinator webpack plugin to automatically translate during build:

```javascript
// webpack.config.js (CommonJS)
const { TranslatinatorWebpackPlugin } = require('translatinator');

// or (ES6/TypeScript)
import { TranslatinatorWebpackPlugin } from 'translatinator';

module.exports = {
  // ... your webpack config
  plugins: [
    new TranslatinatorWebpackPlugin({
      configPath: './translatinator.config.json'
    })
  ]
};
```

## Environment Variables

You can also configure Translatinator using environment variables:

```bash
# New environment variables
export TRANSLATION_ENGINE="deepl"
export TRANSLATION_API_KEY="your-api-key"
export TRANSLATION_ENDPOINT_URL="https://your-libretranslate-instance.com"
export TRANSLATINATOR_SOURCE_FILE="en.json"
export TRANSLATINATOR_TARGET_LANGUAGES="de,fr,es,it"

# Legacy environment variables (still supported)
export DEEPL_API_KEY="your-deepl-api-key"  # Automatically sets engine to 'deepl'
```

## Caching

Translatinator automatically caches translations to avoid unnecessary API calls:

- Translations are cached based on source text and target language
- Cache is stored in the `.translatinator-cache` directory (configurable)
- Use `--force` flag or `force: true` config to bypass cache
- Clear cache with `npx translatinator clear-cache`

## Supported Languages

Translatinator supports all languages available in the DeepL API. Common language codes include:

- `en` - English
- `de` - German
- `fr` - French
- `es` - Spanish
- `it` - Italian
- `nl` - Dutch
- `pl` - Polish
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `zh` - Chinese

For a complete list, use the DeepL API documentation or run:
```bash
npx translatinator usage
```

## Watch Mode

Enable automatic translation when source files change:

```bash
npx translatinator translate --watch
```

Or in configuration:
```json
{
  "watch": true
}
```

## Error Handling

Translatinator includes comprehensive error handling:

- API rate limiting and retry logic
- Network error recovery
- Invalid configuration validation
- Missing file detection
- Graceful fallback for translation failures

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details.

## Support

- Create an issue on GitHub for bug reports
- Check the DeepL API documentation for API-related questions
- Review this README for configuration and usage questions

---

Made with ❤️ for the developer community
