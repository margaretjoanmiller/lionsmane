import { cleanupOpenApiDoc } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // better-auth will turn it back on!
  });

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Lionsmane API')
      .setDescription('the api for lionsmane')
      .setVersion('1.0')
      .addCookieAuth()
      .addBearerAuth()
      .addOAuth2()
      .build(),
  );

  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

  app.use(
    '/reference',
    apiReference({
      content: openApiDoc,
    }),
  );

  await app.listen(process.env.PORT ?? 8181);
}
bootstrap();
