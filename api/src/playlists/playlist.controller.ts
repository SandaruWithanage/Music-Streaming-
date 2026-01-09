import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { PlaylistService } from "./playlist.service";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { AddPlaylistItemDto } from "./dto/add-playlist-item.dto";
import { ReorderPlaylistDto } from "./dto/reorder-playlist.dto";
import { AddCollaboratorDto } from "./dto/add-collaborator.dto";
import { CollaborationService } from "./collaboration.service";


@Controller("playlists")
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly playlists: PlaylistService, private readonly collaboration: CollaborationService) {}

  private getUserId(req: Request) {
  return (req as any).user?.userId;
 }


  @Post()
  create(@Body() dto: CreatePlaylistDto, @Req() req: Request) {
    return this.playlists.create(dto, this.getUserId(req));
  }

  @Get(":id")
  get(@Param("id") id: string, @Req() req: Request) {
    return this.playlists.get(id, this.getUserId(req));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: CreatePlaylistDto,
    @Req() req: Request
  ) {
    return this.playlists.update(id, dto, this.getUserId(req));
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.playlists.delete(id, this.getUserId(req));
  }

  @Post(":id/items")
  addItem(
    @Param("id") id: string,
    @Body() dto: AddPlaylistItemDto,
    @Req() req: Request
  ) {
    return this.playlists.addItem(id, dto.trackId, this.getUserId(req));
  }

  @Patch(":id/reorder")
  reorder(
    @Param("id") id: string,
    @Body() dto: ReorderPlaylistDto,
    @Req() req: Request
  ) {
    return this.playlists.reorder(id, dto.orderedItemIds, this.getUserId(req));
  }

  @Post(":id/collaborators")
    addCollaborator(
    @Param("id") playlistId: string,
    @Body() dto: AddCollaboratorDto,
    @Req() req: Request
    ) {
    return this.collaboration.addCollaborator(
        playlistId,
        this.getUserId(req),
        dto.userId,
        dto.permission
    );
    }

    @Delete(":id/collaborators/:userId")
    removeCollaborator(
    @Param("id") playlistId: string,
    @Param("userId") userId: string,
    @Req() req: Request
    ) {
    return this.collaboration.removeCollaborator(
        playlistId,
        this.getUserId(req),
        userId
    );
    }

}
