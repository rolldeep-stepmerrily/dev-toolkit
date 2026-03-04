import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as express from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const isProduction = nodeEnv === 'production';

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: isProduction,
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.getOrThrow<number>('PORT');

  app.enableCors({
    origin: isProduction ? configService.getOrThrow<string>('SERVER_URL') : true,
    credentials: true,
  });

  if (isProduction) {
    app.use(helmet());
  } else {
    app.use(express.static(join(__dirname, '..', 'docs')));

    const config = new DocumentBuilder()
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
      '/docs',
      apiReference({
        content: document,
        metaData: { title: 'dev-toolkit' },
        theme: 'deepSpace',
      }),
    );
  }

  await app.listen(port);
}

bootstrap();
