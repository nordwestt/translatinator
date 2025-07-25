// Jest setup file
import fs from 'fs-extra';
import * as path from 'path';

// Create test directories
const testDir = path.join(__dirname, 'temp');
const cacheDir = path.join(testDir, '.test-cache');

beforeAll(async () => {
  await fs.ensureDir(testDir);
  await fs.ensureDir(cacheDir);
});

afterAll(async () => {
  // Clean up test directories more aggressively
  try {
    if (await fs.pathExists(testDir)) {
      await fs.emptyDir(testDir);
      await fs.remove(testDir);
    }
  } catch (error) {
    // Ignore cleanup errors - they're not critical
    console.warn('Failed to clean up test directories:', error);
  }
});

// Global test configuration
(global as any).TEST_DIR = testDir;
(global as any).CACHE_DIR = cacheDir;
