import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from "./chat.gateway";
import { ChatController } from "./chat.controller";
import { CheckAchievementService } from 'achievement/check.achievement.service';
import { AchievementService } from 'achievement/achievement.service';
import {MatchmakingService} from "pong/matchmaking.service";
import {PongService} from "pong/pong.service";


@Module({
	controllers: [ChatController],
	providers: [ChatService, ChatGateway, CheckAchievementService, AchievementService, MatchmakingService, PongService],
})

export class ChatModule { }
