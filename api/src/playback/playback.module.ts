import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PlaybackController } from "./playback.controller";
import { MediaController } from "./media.controller";
import { StreamingService } from "./streaming.service";
import { PlaybackEventsController } from "./playback-events.controller";
import { PlaybackService } from "./playback.service";

@Module({
  imports: [PrismaModule],
  controllers: [PlaybackController, MediaController, PlaybackEventsController],
  providers: [StreamingService, PlaybackService],
})
export class PlaybackModule {}
