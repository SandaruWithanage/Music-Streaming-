import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PlaybackEventDto } from "./dto/playback-event.dto";

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(dto: PlaybackEventDto, userId: string) {
    if (!userId) return; // safety
    if (!dto?.trackId || !dto?.type) return;

    const now = new Date();
    const pos = Math.max(0, dto.positionMs ?? 0);

    // Validate track exists only if you want strictness (optional)
    // Keeping it lightweight is better for "non-blocking".

    try {
      if (dto.type === "START") {
        await this.prisma.listeningHistory.upsert({
          where: { userId_trackId: { userId, trackId: dto.trackId } },
          create: {
            userId,
            trackId: dto.trackId,
            lastPositionMs: pos,
            playCount: 1,
            lastPlayedAt: now,
          },
          update: {
            playCount: { increment: 1 },
            lastPlayedAt: now,
            lastPositionMs: pos,
          },
        });
        return;
      }

      if (dto.type === "PROGRESS" || dto.type === "PAUSE" || dto.type === "SEEK") {
        await this.prisma.listeningHistory.upsert({
          where: { userId_trackId: { userId, trackId: dto.trackId } },
          create: {
            userId,
            trackId: dto.trackId,
            lastPositionMs: pos,
            playCount: 0,
            lastPlayedAt: now,
          },
          update: {
            lastPositionMs: pos,
            lastPlayedAt: now,
          },
        });
        return;
      }

      if (dto.type === "END") {
        await this.prisma.listeningHistory.upsert({
          where: { userId_trackId: { userId, trackId: dto.trackId } },
          create: {
            userId,
            trackId: dto.trackId,
            lastPositionMs: 0,
            playCount: 0,
            completedCount: 1,
            lastPlayedAt: now,
          },
          update: {
            lastPositionMs: 0, // reset because completed
            completedCount: { increment: 1 },
            lastPlayedAt: now,
          },
        });
        return;
      }
    } catch (e: any) {
      // IMPORTANT: never throw — do not break playback UX
      this.logger.warn(`Failed to record event: ${e?.message ?? e}`);
    }
  }
}
