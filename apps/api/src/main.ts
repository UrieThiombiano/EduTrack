import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SuperAdminService } from './modules/super-admin/super-admin.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  const corsOrigins = config.get<string[]>('corsOrigins', ['http://localhost:5173']);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtre global avec injection du service d'alertes PUKRI
  const superAdminService = app.get(SuperAdminService);
  app.useGlobalFilters(new AllExceptionsFilter(superAdminService));
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EduTrack API')
    .setDescription('PUKRI EduTrack — Plateforme SaaS de suivi scolaire multi-tenant')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth')
    .addTag('pukri / super-admin')
    .addTag('eleves')
    .addTag('enseignants')
    .addTag('classes')
    .addTag('evaluations')
    .addTag('notes')
    .addTag('absences')
    .addTag('bulletins')
    .addTag('rapports-ia')
    .addTag('notifications')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 EduTrack API  →  http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger docs  →  http://localhost:${port}/api/docs`);
}
bootstrap();
