/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const swaggerEnabled = process.env.SWAGGER_ENABLED?.toLowerCase() === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('BFFC API Docs')
      .setDescription('Documentation for BFFC API routes')
      .addBearerAuth({
        type: 'http',
        description:
          '[TL] Replace: how clients obtain a Bearer token for this API.',
      })
      .addTag(
        'Sites',
        'Site details, addresses, plant inventory, and site media',
      )
      .addTag('Media', 'Images and videos for a site')
      .addTag('Events', 'Admin (Luma-linked) and steward-published events')
      .addTag('Users', 'Admin and steward user accounts')
      .addTag('Announcements', 'Steward announcements posted to a site')
      .addTag(
        'Volunteer Opportunities',
        'Volunteer opportunities tied to a site',
      )
      .addTag('Partner Orgs', 'Partner organizations associated with a site')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config); // Create the Swagger document
    SwaggerModule.setup('api', app, document); // Setup the Swagger module
    Logger.log(
      `😎 Swagger is enabled and will be available at: http://localhost:${
        process.env.PORT || 3000
      }/api`,
    );
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}
bootstrap();
