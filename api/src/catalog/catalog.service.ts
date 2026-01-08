import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async listTracks(skip = 0, take = 20) {
    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          artist: { select: { id: true, name: true } },
          //album: { select: { id: true, title: true, coverUrl: true } },
        },
      }),
      this.prisma.track.count({ where: { isActive: true } }),
    ]);

    return {
      items,
      page: {
        skip,
        take,
        total,
        hasMore: skip + take < total,
      },
    };
  }

  async getTrackById(id: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, isActive: true },
      include: {
        artist: { select: { id: true, name: true } },
        album: { select: { id: true, title: true, coverUrl: true } },
      },
    });

    if (!track) throw new NotFoundException("Track not found");
    return track;
  }

  async searchTracks(params: { q?: string; genre?: string; artist?: string; skip?: number; take?: number }) {
    const { q, genre, artist, skip = 0, take = 20 } = params;

    const where: any = { isActive: true };

    if (genre) where.genre = { equals: genre, mode: "insensitive" };

    // Search title OR artist name
    if (q || artist) {
      where.OR = [];

      if (q) {
        where.OR.push({ title: { contains: q, mode: "insensitive" } });
      }

      if (artist) {
        where.OR.push({
          artist: { name: { contains: artist, mode: "insensitive" } },
        });
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          artist: { select: { id: true, name: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
      }),
      this.prisma.track.count({ where }),
    ]);

    return {
      items,
      page: {
        skip,
        take,
        total,
        hasMore: skip + take < total,
      },
    };
  }
}
