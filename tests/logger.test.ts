import { Logger } from '../src/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('verbose mode disabled', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger(false);
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Test warning message');
    });

    it('should log success messages', () => {
      logger.success('Test success message');
      expect(consoleSpy).toHaveBeenCalledWith('[SUCCESS] Test success message');
    });

    it('should NOT log debug messages when verbose is false', () => {
      logger.debug('Test debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log messages with additional arguments', () => {
      const obj = { key: 'value' };
      logger.info('Test message', obj, 123);
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test message', obj, 123);
    });
  });

  describe('verbose mode enabled', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger(true);
    });

    it('should log debug messages when verbose is true', () => {
      logger.debug('Test debug message');
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });

    it('should log debug messages with additional arguments', () => {
      const obj = { debug: true };
      logger.debug('Debug with object', obj);
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Debug with object', obj);
    });
  });

  describe('default constructor', () => {
    it('should default to verbose = false', () => {
      const logger = new Logger();
      logger.debug('Should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
