import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { SharingService } from "./sharing.service";
import { CreateShareDto } from "./dto/create-share.dto";

@Controller("playlists")
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  private getUserId(req: Request) {
    return (req as any).user?.userId;
  }

  @Post(":id/share")
  async createShare(
    @Param("id") playlistId: string,
    @Body() dto: CreateShareDto,
    @Req() req: Request
  ) {
    const share = await this.sharing.createShare(
      playlistId,
      this.getUserId(req),
      dto.accessLevel,
      dto.expiresAt
    );

    return {
      url: `http://localhost:3000/share/${share.token}`,
      expiresAt: share.expiresAt,
    };
  }
}
