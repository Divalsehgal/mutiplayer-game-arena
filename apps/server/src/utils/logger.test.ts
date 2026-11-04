import { logger } from './logger';

describe('Logger', () => {
    it('should call console.log on info', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        logger.info('test message');
        expect(logSpy).toHaveBeenCalledWith('[INFO]', 'test message');
        logSpy.mockRestore();
    });

    it('should call console.error on error', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        logger.error('test error');
        expect(errorSpy).toHaveBeenCalledWith('[ERROR]', 'test error');
        errorSpy.mockRestore();
    });

    it('should call console.warn on warn', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        logger.warn('test warning');
        expect(warnSpy).toHaveBeenCalledWith('[WARN]', 'test warning');
        warnSpy.mockRestore();
    });
});
