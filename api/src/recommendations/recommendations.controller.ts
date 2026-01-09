// src/recommendations/recommendations.controller.ts
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { RecommendationsService } from "./recommendations.service";

@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get("trending")
  getTrending() {
    return this.recommendations.getTrending();
  }

  @UseGuards(JwtAuthGuard)
  @Get("personal")
  getPersonal(@Req() req: Request) {
    const userId = (req as any).user?.userId;
    return this.recommendations.getPersonal(userId);
  }
}
