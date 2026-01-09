import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PlaylistOrderService } from "./playlist-order.service";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly order: PlaylistOrderService
  ) {}

  // =========================
  // CREATE
  // =========================
  async create(dto: CreatePlaylistDto, userId: string) {
    if (!userId) {
      throw new BadRequestException("User ID required");
    }

    return this.prisma.playlist.create({
      data: {
        name: dto.name,
        owner: {
          connect: { id: userId },
        },
      },
    });
  }

  // =========================
  // READ (VIEW ACCESS)
  // =========================
  async get(id: string, userId: string) {
    await this.canViewPlaylist(id, userId);

    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { track: true },
        },
      },
    });
  }

  // =========================
  // UPDATE (EDIT ACCESS)
  // =========================
  async update(id: string, dto: CreatePlaylistDto, userId: string) {
    await this.canEditPlaylist(id, userId);

    return this.prisma.playlist.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  // =========================
  // DELETE (EDIT ACCESS)
  // =========================
  async delete(id: string, userId: string) {
    await this.canEditPlaylist(id, userId);
    return this.prisma.playlist.delete({ where: { id } });
  }

  // =========================
  // ADD ITEM (EDIT ACCESS)
  // =========================
  async addItem(playlistId: string, trackId: string, userId: string) {
    await this.canEditPlaylist(playlistId, userId);

    const max = await this.prisma.playlistItem.aggregate({
      where: { playlistId },
      _max: { position: true },
    });

    const nextPos = (max._max.position ?? -1) + 1;

    return this.prisma.playlistItem.create({
      data: {
        playlistId,
        trackId,
        position: nextPos,
      },
    });
  }

  // =========================
  // REORDER (EDIT ACCESS)
  // =========================
  async reorder(
    playlistId: string,
    orderedItemIds: string[],
    userId: string
  ) {
    await this.canEditPlaylist(playlistId, userId);
    return this.order.reorder(playlistId, orderedItemIds);
  }

  // =========================
  // PERMISSION HELPERS
  // =========================
  private async canViewPlaylist(playlistId: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true },
    });

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    // Owner can view
    if (playlist.ownerId === userId) {
      return playlist;
    }

    // Collaborator can view
    const collaborator = playlist.collaborators.find(
      c => c.userId === userId
    );

    if (collaborator) {
      return playlist;
    }

    throw new ForbiddenException("No access to view playlist");
  }

  private async canEditPlaylist(playlistId: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { collaborators: true },
    });

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    // Owner can edit
    if (playlist.ownerId === userId) {
      return playlist;
    }

    // Collaborator with EDIT permission
    const collaborator = playlist.collaborators.find(
      c => c.userId === userId && c.permission === "EDIT"
    );

    if (collaborator) {
      return playlist;
    }

    throw new ForbiddenException("No permission to edit playlist");
  }
}
