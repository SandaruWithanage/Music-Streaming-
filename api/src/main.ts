import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 🔴 converts strings → numbers
      whitelist: true, // 🔴 strips unknown fields
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
