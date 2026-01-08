import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        preferences: true,
        createdAt: true,
      },
    });
  }

  updatePreferences(userId: string, preferences: Record<string, any>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferences },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });
  }
}
