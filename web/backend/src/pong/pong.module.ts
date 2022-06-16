import { Module } from '@nestjs/common';
import { PongService } from "./pong.service";
import { PongController } from "./pong.controller";
import {MatchmakingController} from "pong/matchmaking.controller";
import {MatchmakingService} from "pong/matchmaking.service";
import { CheckAchievementService } from 'achievement/check.achievement.service';
import { ChatService } from 'chat/chat.service';
import { AchievementService } from 'achievement/achievement.service';


@Module({
    controllers: [PongController, MatchmakingController],
    providers: [PongService, MatchmakingService, CheckAchievementService, ChatService, AchievementService],
})

export class PongModule {}
