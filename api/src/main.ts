// Load environment variables FIRST, before any other imports
// This is critical because module decorators read process.env at import time
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

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

  const port = process.env.PORT ?? 4000;
  console.log(`🚀 Server starting on port ${port}`);
  console.log(`🔑 JWT_SECRET configured: ${process.env.JWT_SECRET ? 'yes' : 'NO - MISSING!'}`);

  await app.listen(port);
}

bootstrap();
