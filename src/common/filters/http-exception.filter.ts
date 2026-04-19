import {
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Catch,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const succeeded = false;
    let msg = 'INTERNAL_SERVER_ERROR';
    let httpErrors = '';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      msg = exception.message;
    }
    if (exception instanceof Error) {
      msg = exception.message;
    }
    httpErrors = exception?.response?.message;

    const responseBody = {
      succeeded: succeeded,
      statusCode: httpStatus,
      message: msg,
      error: httpErrors,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
