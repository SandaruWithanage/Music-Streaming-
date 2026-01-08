import { IsArray, ArrayNotEmpty, IsUUID } from "class-validator";

export class ReorderPlaylistDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  orderedItemIds: string[];
}
