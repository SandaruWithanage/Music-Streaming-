import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as dotenv from "dotenv";

// Load .env first, then .env.local overrides
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(",") || "http://localhost:3000",
    credentials: true,
  });

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
