import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { StreamingService } from "./streaming.service";

@Controller("tracks")
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(private readonly streaming: StreamingService) {}

  @Get(":id/stream")
  async getStreamUrl(@Param("id") trackId: string, @Req() req: Request) {
    // Build base URL from the incoming request
    const protocol = req.protocol;
    const host = req.get("host"); // e.g. localhost:3000
    const baseUrl = `${protocol}://${host}`;

    return this.streaming.generateSignedUrl({ trackId, baseUrl });
  }
}
