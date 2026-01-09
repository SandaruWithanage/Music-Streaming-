import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CollaboratorPermission } from "@prisma/client";

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Add collaborator
  async addCollaborator(
    playlistId: string,
    ownerId: string,
    userIdToAdd: string,
    permission: CollaboratorPermission
  ) {
    // 1️⃣ Ensure playlist exists and owner matches
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) throw new NotFoundException("Playlist not found");
    if (playlist.ownerId !== ownerId)
      throw new ForbiddenException("Only owner can add collaborators");

    // 2️⃣ Prevent self-invite
    if (ownerId === userIdToAdd) {
      throw new BadRequestException("Owner is already a collaborator");
    }

    // 3️⃣ Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userIdToAdd },
    });

    if (!user) throw new NotFoundException("User not found");

    // 4️⃣ Create collaborator (duplicate prevented by schema)
    return this.prisma.playlistCollaborator.create({
      data: {
        playlistId,
        userId: userIdToAdd,
        permission,
      },
    });
  }

  // ✅ Remove collaborator
  async removeCollaborator(
    playlistId: string,
    ownerId: string,
    collaboratorUserId: string
  ) {
    // 1️⃣ Verify ownership
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) throw new NotFoundException("Playlist not found");
    if (playlist.ownerId !== ownerId)
      throw new ForbiddenException("Only owner can remove collaborators");

    // 2️⃣ Remove collaborator
    return this.prisma.playlistCollaborator.delete({
      where: {
        playlistId_userId: {
          playlistId,
          userId: collaboratorUserId,
        },
      },
    });
  }
}
