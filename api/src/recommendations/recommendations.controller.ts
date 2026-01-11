import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RecommendationsService } from './recommendations.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('trending')
  getTrending() {
    return this.recommendations.getTrending();
  }

  @UseGuards(JwtAuthGuard)
  @Get('personal')
  getPersonal(@CurrentUser() user: { userId: string }) {
    return this.recommendations.getPersonal(user.userId);
  }
}
