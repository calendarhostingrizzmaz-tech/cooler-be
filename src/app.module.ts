import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { getProjectRoot } from './env-paths';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './modules/admin/admin.module';
import { ItemsModule } from './modules/items/items.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MailModule } from './modules/mail/mail.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { SharedModule } from './shared/shared.module';

const projectRoot = getProjectRoot();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(projectRoot, '.env'),
        join(projectRoot, `.env.${process.env.NODE_ENV || 'development'}`),
      ],
    }),

    ThrottlerModule.forRoot([
      {
        limit: 200, // Increased limit for dev
        ttl: 60000,
      },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: parseInt(config.get<string>('DATABASE_PORT'), 10),
        username: config.get<string>('DATABASE_USER_NAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: config.get<string>('DB_LOGGING') === '["error"]',
      }),
    }),

    AdminModule,
    ItemsModule,
    OrdersModule,
    MailModule,
    NewsletterModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
