import {
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // STEP 8.1 — CREATE SHARE
  // =========================
  async createShare(
    playlistId: string,
    userId: string,
    accessLevel: "VIEW" | "EDIT",
    expiresAt?: string
  ) {
    // 1️⃣ Verify ownership
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist || playlist.ownerId !== userId) {
      throw new ForbiddenException("Not playlist owner");
    }

    // 2️⃣ Generate secure token
    const token = randomUUID().replace(/-/g, "");

    // 3️⃣ Save share
    return this.prisma.playlistShare.create({
      data: {
        playlistId,
        token,
        accessLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
  }

  // =========================
  // STEP 8.2 — GET SHARE
  // =========================
  async getSharedPlaylist(token: string) {
    const share = await this.prisma.playlistShare.findUnique({
      where: { token },
      include: {
        playlist: {
          include: {
            owner: {
              select: { id: true, displayName: true },
            },
            items: {
              orderBy: { position: "asc" },
              include: {
                track: {
                  include: {
                    artist: { select: { id: true, name: true } },
                    album: {
                      select: { id: true, title: true, coverUrl: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 404 if token invalid or revoked
    if (!share || share.revokedAt) {
      throw new NotFoundException("Share link not found");
    }

    // 410 if expired
    if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
      throw new GoneException("Share link expired");
    }

    return {
      token: share.token,
      accessLevel: share.accessLevel,
      expiresAt: share.expiresAt,
      playlist: share.playlist,
    };
  }
}
