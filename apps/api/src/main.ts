import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

function validateEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required (64 hex characters)');
  }
  const isHex64 = /^[a-fA-F0-9]{64}$/.test(key);
  if (!isHex64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
}

async function bootstrap() {
  validateEncryptionKey();

  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Grand Bahama Ferry API')
    .setDescription(
      'Maritime Passenger & Compliance Support Platform API. Provides decision support for passenger manifests, crew compliance, and regulatory reporting.'
    )
    .setVersion('1.0')
    .addTag('passengers', 'Passenger check-in and manifest operations')
    .addTag('crew', 'Crew management and certification tracking')
    .addTag('vessels', 'Vessel registry and wet-lease documentation')
    .addTag('compliance', 'Compliance reporting and export operations')
    .addTag('audit', 'Audit logging and system monitoring')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚢 GB Ferry API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
