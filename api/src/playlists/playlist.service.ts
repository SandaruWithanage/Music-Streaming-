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



  async get(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { track: true },
        },
      },
    });

    if (!playlist) throw new NotFoundException();
    if (playlist.ownerId !== userId) throw new ForbiddenException();

    return playlist;
  }

  async update(id: string, dto: CreatePlaylistDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.playlist.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async delete(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.playlist.delete({ where: { id } });
  }

  async addItem(playlistId: string, trackId: string, userId: string) {
    await this.assertOwner(playlistId, userId);

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

  async reorder(
    playlistId: string,
    orderedItemIds: string[],
    userId: string
  ) {
    await this.assertOwner(playlistId, userId);
    return this.order.reorder(playlistId, orderedItemIds);
  }

  private async assertOwner(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });
    if (!playlist) throw new NotFoundException();
    if (playlist.ownerId !== userId) throw new ForbiddenException();
  }
}
