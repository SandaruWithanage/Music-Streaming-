import { IsEnum, IsUUID } from "class-validator";
import { CollaboratorPermission } from "@prisma/client";

export class AddCollaboratorDto {
  @IsUUID()
  userId: string;

  @IsEnum(CollaboratorPermission)
  permission: CollaboratorPermission;
}
