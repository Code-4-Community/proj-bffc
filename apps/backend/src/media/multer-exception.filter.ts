import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type MulterLikeError = Error & { name: 'MulterError'; code: string };

function isMulterError(error: unknown): error is MulterLikeError {
  return (
    !!error &&
    typeof error === 'object' &&
    (error as { name?: string }).name === 'MulterError'
  );
}

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (!isMulterError(exception)) {
      throw exception;
    }
    if (exception.code === 'LIMIT_FILE_SIZE') {
      res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'File exceeds the maximum allowed size',
        error: 'Payload Too Large',
      });
      return;
    }
    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
