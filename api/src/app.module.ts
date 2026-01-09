import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlaybackModule } from "./playback/playback.module";
import { PlaylistModule } from "./playlists/playlist.module";
import { SharingModule } from "./sharing/sharing.module";
import { CollaborationService } from "./playlists/collaboration.service";
import { RecommendationsModule } from "./recommendations/recommendations.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CatalogModule, PlaybackModule, PlaylistModule, SharingModule, RecommendationsModule],
  controllers: [AppController],
  providers: [AppService, CollaborationService],
})
export class AppModule {}
