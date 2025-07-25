// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'], // Include both entry points
  outDir: 'dist',
  format: ['esm', 'cjs'],          // Build both ESM and CommonJS
  dts: true,                       // Emit .d.ts files
  sourcemap: true,
  clean: true,                     // Clean dist before building
  splitting: false,                // Optional: disable code splitting
  minify: false,                   // Optional: enable for prod
  target: 'es2020',                // Match your tsconfig
});
