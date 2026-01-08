import { IsString, IsNotEmpty } from "class-validator";

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
