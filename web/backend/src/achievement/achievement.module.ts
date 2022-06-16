import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import {ChatService} from "chat/chat.service";
import {CheckAchievementService} from "achievement/check.achievement.service";

@Module({
  controllers: [AchievementController],
  providers: [AchievementService, ChatService, CheckAchievementService]
})
export class AchievementModule {}
