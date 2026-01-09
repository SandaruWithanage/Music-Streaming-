import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";

import { PlaylistController } from "./playlist.controller";
import { PlaylistService } from "./playlist.service";
import { PlaylistOrderService } from "./playlist-order.service";
import { CollaborationService } from "./collaboration.service";

@Module({
  imports: [
    PrismaModule, // Required for all DB access
  ],
  controllers: [
    PlaylistController, // REST APIs
  ],
  providers: [
    PlaylistService,      // Playlist CRUD + ownership checks
    PlaylistOrderService,
    CollaborationService, // Transaction-safe ordering logic
  ],
})
export class PlaylistModule {}
