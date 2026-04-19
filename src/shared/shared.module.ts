import { Global, Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@Global()
@Module({
  imports: [LoggerModule.forRoot()],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class SharedModule {}
