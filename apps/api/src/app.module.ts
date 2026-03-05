import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import Joi from 'joi';

import { AppController } from './app.controller';
import { HttpLoggerMiddleware } from './common/middlewares';
import { PrismaModule } from './common/prisma';
import { BcryptModule } from './tools/bcrypt/bcrypt.module';
import { IpModule } from './tools/ip/ip.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        SERVER_URL: Joi.string().required(),
        CLIENT_URL: Joi.string().required(),
        NODE_ENV: Joi.string().valid('local', 'development', 'production').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        ADMIN_NAME: Joi.string().required(),
        ADMIN_PASSWORD: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
      }),
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: { abortEarly: true },
    }),
    PrismaModule,
    BcryptModule,
    IpModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
