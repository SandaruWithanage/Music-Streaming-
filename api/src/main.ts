import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // ✅ remove unknown fields
      forbidNonWhitelisted: true, // ✅ reject bad requests
      transform: true,            // ✅ convert input types
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
