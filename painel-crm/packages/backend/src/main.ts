import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('CRM BG Tech')
    .setDescription('API do CRM proprietário BG Tech para software sob demanda')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('tenants')
    .addTag('accounts')
    .addTag('contacts')
    .addTag('opportunities')
    .addTag('resources')
    .addTag('projects')
    .addTag('slas')
    .addTag('proposals')
    .addTag('contracts')
    .addTag('agents')
    .addTag('analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 CRM BG Tech Backend running on http://localhost:${port}`);
  console.log(`📄 OpenAPI docs: http://localhost:${port}/api/docs`);
}
bootstrap();
