import { IsUUID } from "class-validator";

export class AddPlaylistItemDto {
  @IsUUID()
  trackId: string;
}
