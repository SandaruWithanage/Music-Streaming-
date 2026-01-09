import { Controller, Get, Param } from "@nestjs/common";
import { SharingService } from "./sharing.service";

@Controller("share")
export class PublicSharingController {
  constructor(private readonly sharing: SharingService) {}

  @Get(":token")
  getByToken(@Param("token") token: string) {
    return this.sharing.getSharedPlaylist(token);
  }
}
