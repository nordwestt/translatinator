// Jest setup file
import * as fs from 'fs-extra';
import * as path from 'path';

// Create test directories
const testDir = path.join(__dirname, 'temp');
const cacheDir = path.join(testDir, '.test-cache');

beforeAll(async () => {
  await fs.ensureDir(testDir);
  await fs.ensureDir(cacheDir);
});

afterAll(async () => {
  // Clean up test directories
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }
});

// Global test configuration
global.TEST_DIR = testDir;
global.CACHE_DIR = cacheDir;
