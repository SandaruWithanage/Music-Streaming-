// src/recommendations/recommendations.module.ts

import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";
import { AuthModule } from "../auth/auth.module"; // ✅ ADD THIS

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ✅ REQUIRED so JwtAuthGuard can resolve JwtStrategy
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
