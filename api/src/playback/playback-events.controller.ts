import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { PlaybackService } from "./playback.service";
import { PlaybackEventDto } from "./dto/playback-event.dto";

@Controller("playback")
@UseGuards(JwtAuthGuard)
export class PlaybackEventsController {
  constructor(private readonly playback: PlaybackService) {}

  @Post("events")
  async postEvent(@Body() dto: PlaybackEventDto, @Req() req: Request) {
    const userId =
      (req as any).user?.sub ??
      (req as any).user?.id;

    // non-blocking
    void this.playback.recordEvent(dto, userId).catch(() => {});

    return { ok: true };
  }
}
