export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(`[SUCCESS] ${message}`, ...args);
  }
}
