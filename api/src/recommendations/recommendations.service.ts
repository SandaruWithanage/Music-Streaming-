// src/recommendations/recommendations.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // TRENDING (GLOBAL)
  // =========================
  async getTrending(limit = 20) {
    const popular = await this.prisma.listeningHistory.groupBy({
      by: ["trackId"],
      _sum: {
        playCount: true,
      },
      orderBy: {
        _sum: {
          playCount: "desc",
        },
      },
      take: limit,
    });

    const trackIds = popular.map(p => p.trackId);

    return this.prisma.track.findMany({
      where: { id: { in: trackIds }, isActive: true },
      include: {
        artist: true,
        album: true,
      },
    });
  }

    // =========================
  // PERSONALIZED
  // =========================
  async getPersonal(userId: string, limit = 20) {
    // 1️⃣ User history
    const history = await this.prisma.listeningHistory.findMany({
      where: { userId },
      select: { trackId: true },
      take: 100,
    });

    // No history → fallback
    if (history.length === 0) {
      return this.getTrending(limit);
    }

    const playedTrackIds = history.map(h => h.trackId);

    // 2️⃣ Genres user listens to
    const genres = await this.prisma.track.findMany({
      where: { id: { in: playedTrackIds } },
      select: { genre: true },
      distinct: ["genre"],
    });

    const genreList = genres.map(g => g.genre);

    // 3️⃣ Recommend similar tracks
    const recommendations = await this.prisma.track.findMany({
      where: {
        genre: { in: genreList },
        id: { notIn: playedTrackIds },
        isActive: true,
      },
      include: {
        artist: true,
        album: true,
      },
      take: limit,
    });

    // If still empty → fallback
    if (recommendations.length === 0) {
      return this.getTrending(limit);
    }

    return recommendations;
  }
}
