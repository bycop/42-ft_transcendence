import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AchievementService } from "achievement/achievement.service";
import { GlobalService } from "global/services/global.service";
import { DbService } from "global/services/db.service";
import {CheckAchievementService} from "achievement/check.achievement.service";

@Controller('achievement')
export class AchievementController {
    constructor(private achievementService: AchievementService,
                private globalService: GlobalService,
                private dbService: DbService,
                private checkAchievementService: CheckAchievementService) { }

    @Get('getAchievements')
    async getAchievements() {
        return await this.achievementService.getAchievements()
    }

    @Get('getAchievementsOfUser/:username')
    async getAchievementsOfUser(@Param('username') username: string) {
        let user = await this.dbService.getUserFromUsername(username)
        return await this.achievementService.getAchievementsOfUser(user.id);
    }

    @Get('addAchievementToUser')
    async addAchievementToUser(@Query('username') username, @Query('achievement_title') achievement_title) {
        let user = await this.dbService.getUserFromUsername(username)
        let achievement = await this.achievementService.getFirstAchievementByTitle(achievement_title)
        if (!user)
            return { error: "user not found" };
        if (!achievement)
            return { error: "achievement not found" };
        return await this.achievementService.addAchievementToUser(user.id, achievement.id, this.globalService.dateGenerator())
    }

    @Post('createAchievement')
    async createAchievement(@Body() requestData: any) {
        return await this.achievementService.createAchievements(requestData.title, requestData.text, this.globalService.dateGenerator())
    }

    @Get('checkAchievements/:id')
    async checkAvievements(@Param('id') id: number)
    {
        await this.checkAchievementService.checkScore(id);
        await this.checkAchievementService.checkFriends(id);
        await this.checkAchievementService.checkConcededScore(id);
        await this.checkAchievementService.checkGame(id);
        await this.checkAchievementService.checkLevel(id);
        await this.checkAchievementService.checkAllAchievements(id);
        return ('success');
    }
}
