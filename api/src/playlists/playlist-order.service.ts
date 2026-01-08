import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlaylistOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async reorder(playlistId: string, orderedItemIds: string[]) {
    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId },
      select: { id: true },
    });

    if (items.length !== orderedItemIds.length) {
      throw new BadRequestException("Invalid reorder list");
    }

    const validIds = new Set(items.map(i => i.id));
    for (const id of orderedItemIds) {
      if (!validIds.has(id)) {
        throw new BadRequestException("Item does not belong to playlist");
      }
    }

    return this.prisma.$transaction(
      orderedItemIds.map((id, index) =>
        this.prisma.playlistItem.update({
          where: { id },
          data: { position: index },
        })
      )
    );
  }
}
