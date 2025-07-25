# Next.js Integration with Translatinator

This guide shows how to integrate Translatinator with Next.js for automatic translation updates during development.

## Quick Setup

### Method 1: Enhanced Integration

Use the new `withTranslatinatorDev` function in your `next.config.js`:

```javascript
const { withTranslatinatorDev } = require('translatinator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
};

module.exports = withTranslatinatorDev({
  configPath: './translatinator.config.json' // optional, will auto-discover if not provided
})(nextConfig);
```

This method works with:
- `next dev` (standard Webpack)
- Any other build tools that use webpack

### Method 2: Standalone Development Server

For maximum compatibility or if you prefer a separate process, you can run the translation watcher independently:

```bash
# Install globally or use npx
npm install -g translatinator

# Start the development server
translatinator-dev

# Or with a specific config
translatinator-dev ./path/to/config.json
```

Then in your Next.js config, you can use the simpler integration:

```javascript
const { withTranslatinator } = require('translatinator');

module.exports = withTranslatinator({
  configPath: './translatinator.config.json'
})(nextConfig);
```

### Method 3: Programmatic Usage

You can also start the development server programmatically:

```javascript
import { TranslatinatorDevServer } from 'translatinator';

const devServer = new TranslatinatorDevServer({
  configPath: './translatinator.config.json'
});

await devServer.start();

// Later, when you want to stop it
await devServer.stop();
```

## Configuration

Create a `translatinator.config.json` file in your project root:

```json
{
  "engine": "google",
  "apiKey": "your-api-key-here",
  "sourceFile": "en.json",
  "targetLanguages": ["de", "fr", "es", "it", "nl", "pl"],
  "localesDir": "./locales",
  "watch": true,
  "force": false,
  "filePattern": "{lang}.json",
  "preserveFormatting": true,
  "excludeKeys": ["version", "build", "debug"],
  "cacheDir": ".translatinator-cache",
  "verbose": false
}
```

## Environment Variables

You can also configure via environment variables:

```bash
# API Key (use one of these)
TRANSLATION_API_KEY=your-api-key-here
DEEPL_API_KEY=your-api-key-here  # legacy support

# Engine
TRANSLATION_ENGINE=google

# Custom endpoint (for LibreTranslate)
TRANSLATION_ENDPOINT_URL=https://libretranslate.example.com

# Source and target settings
TRANSLATINATOR_SOURCE_FILE=en.json
TRANSLATINATOR_TARGET_LANGUAGES=de,fr,es,it
```

## How It Works

1. When you start your Next.js development server, Translatinator automatically:
   - Loads your configuration
   - Runs an initial translation of missing keys
   - Sets up a file watcher on your source language file

2. When you edit your source language file (`en.json` by default):
   - The file watcher detects the change
   - Only missing translations are added (unless `force: true`)
   - Your Next.js app will hot-reload with the new translations

3. The translation cache ensures:
   - Fast subsequent runs
   - No unnecessary API calls for existing translations
   - Consistent translations across updates

## Troubleshooting

### File Watching Not Working

1. Check that your source file path is correct
2. Ensure your locales directory exists
3. Verify file permissions
4. Try the standalone development server

### Translations Not Updating

1. Check your API key is valid
2. Verify target languages are supported by your chosen engine
3. Check the console for error messages
4. Try setting `verbose: true` in your config