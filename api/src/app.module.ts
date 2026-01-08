import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlaybackModule } from "./playback/playback.module";
import { PlaylistModule } from "./playlists/playlist.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CatalogModule, PlaybackModule, PlaylistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
