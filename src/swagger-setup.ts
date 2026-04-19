import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_SECURITY_AUTH } from './common/decorators/swagger.decorator';
import { appName, port, swaggerPath } from './common/constants/env';

export function setupSwagger(app: INestApplication): void {
  const documentBuilder = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(`${appName} API document`)
    .setVersion('1.0');

  // auth security
  documentBuilder.addSecurity(API_SECURITY_AUTH, {
    description: 'Auth',
    type: 'apiKey',
    in: 'header',
    name: 'Authorization',
  });

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup(swaggerPath, app, document);
  const logger = new Logger('SwaggerModule');
  logger.log(
    `Swagger Document running on http://localhost:${port}/${swaggerPath}`,
  );
}
