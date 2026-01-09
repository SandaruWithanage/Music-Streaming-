import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SharingController } from "./sharing.controller";
import { SharingService } from "./sharing.service";
import { PublicSharingController } from "./public-sharing.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SharingController, PublicSharingController],
  providers: [SharingService],
})
export class SharingModule {}
