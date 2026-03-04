import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security: Helmet (HTTP headers) ──────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // handled by Next.js middleware
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Security: Rate Limiting ──────────────────────────
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // max 100 requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: { statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' },
    }),
  );

  // Stricter rate limit for auth endpoints
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // max 10 auth attempts per 15 min
      standardHeaders: true,
      legacyHeaders: false,
      message: { statusCode: 429, error: 'Too Many Requests', message: 'Too many login attempts. Try again in 15 minutes.' },
    }),
  );

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
