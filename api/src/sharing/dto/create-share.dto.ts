import { IsEnum, IsOptional, IsISO8601 } from "class-validator";
import { ShareAccessLevel } from "@prisma/client";

export class CreateShareDto {
  @IsEnum(ShareAccessLevel)
  accessLevel: ShareAccessLevel;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
