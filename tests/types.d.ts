declare global {
  namespace NodeJS {
    interface Global {
      TEST_DIR: string;
      CACHE_DIR: string;
    }
  }
}

export {};
