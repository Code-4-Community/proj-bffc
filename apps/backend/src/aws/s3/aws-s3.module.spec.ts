import { AWSS3Module } from './aws-s3.module';

describe('AWSS3Module', () => {
  const ENV_VARS = [
    'S3_ENABLED',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_MEDIA_BUCKET_NAME',
  ] as const;

  const REQUIRED_WHEN_ENABLED = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_MEDIA_BUCKET_NAME',
  ] as const;

  const originalEnv: Record<string, string | undefined> = {};
  let module: AWSS3Module;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    for (const name of ENV_VARS) {
      originalEnv[name] = process.env[name];
    }

    // Default to a fully-configured, enabled setup; individual tests override.
    process.env.S3_ENABLED = 'true';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-media-bucket';

    module = new AWSS3Module();

    warnSpy = jest
      .spyOn(module['logger'], 'warn')
      .mockImplementation(() => undefined);
    logSpy = jest
      .spyOn(module['logger'], 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();

    for (const name of ENV_VARS) {
      if (originalEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalEnv[name];
      }
    }
  });

  describe('onModuleInit', () => {
    it('logs and does not warn when all required env vars are set and enabled', () => {
      module.onModuleInit();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('S3 enabled');
    });

    it('does not warn when disabled, even if required vars are missing', () => {
      process.env.S3_ENABLED = 'false';
      for (const name of REQUIRED_WHEN_ENABLED) {
        delete process.env[name];
      }

      module.onModuleInit();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('S3 disabled'),
      );
    });

    it('does not warn when S3_ENABLED is unset', () => {
      delete process.env.S3_ENABLED;
      for (const name of REQUIRED_WHEN_ENABLED) {
        delete process.env[name];
      }

      module.onModuleInit();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('S3 disabled'),
      );
    });

    it.each(REQUIRED_WHEN_ENABLED)(
      'warns when enabled and %s is missing',
      (name) => {
        delete process.env[name];

        expect(() => module.onModuleInit()).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(name));
      },
    );

    it('warns when enabled and a required var is empty/whitespace-only', () => {
      process.env.AWS_ACCESS_KEY_ID = '   ';

      expect(() => module.onModuleInit()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('AWS_ACCESS_KEY_ID'),
      );
    });

    it('lists every missing env var in a single warning', () => {
      for (const name of REQUIRED_WHEN_ENABLED) {
        delete process.env[name];
      }

      module.onModuleInit();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_MEDIA_BUCKET_NAME',
        ),
      );
    });
  });
});
