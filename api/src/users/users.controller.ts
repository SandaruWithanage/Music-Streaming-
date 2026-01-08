import { Controller, Get, Patch, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  getMe(@Req() req: any) {
    // req.user.sub comes from JWT payload (your JwtStrategy)
    return this.usersService.getMe(req.user.userId);
  }

  @Patch("me/preferences")
  updatePreferences(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(req.user.userId, dto.preferences);
  }
}
