import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { AWSS3Service } from './aws-s3.service';
import { getMissingEnvVars } from '../../utils/env';

// Env vars required only when S3 is enabled (S3_ENABLED === 'true').
// The credentials are the shared AWS ones (also used by the SES module).
// Add one entry per bucket here:
const REQUIRED_ENV_VARS_WHEN_ENABLED = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_MEDIA_BUCKET_NAME',
] as const;

@Global()
@Module({
  providers: [AWSS3Service],
  exports: [AWSS3Service],
})
export class AWSS3Module implements OnModuleInit {
  private readonly logger = new Logger(AWSS3Module.name);

  onModuleInit(): void {
    // S3 is disabled: skip validation so teams not using S3 can boot without
    // any AWS config (and without a warning on every startup).
    if (process.env.S3_ENABLED?.toLowerCase() !== 'true') {
      this.logger.log(
        'S3 disabled: S3_ENABLED is not "true". Uploads and downloads will fail.',
      );
      return;
    }

    const missing = getMissingEnvVars(REQUIRED_ENV_VARS_WHEN_ENABLED);

    if (missing.length > 0) {
      this.logger.warn(
        `S3 enabled but not fully configured: missing env vars (${missing.join(
          ', ',
        )}). S3 uploads and downloads will fail.`,
      );
    } else {
      this.logger.log('S3 enabled');
    }
  }
}
