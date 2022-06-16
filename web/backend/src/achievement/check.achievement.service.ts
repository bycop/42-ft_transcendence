import { Injectable } from '@nestjs/common';
import { knex } from "config.knex";
import { ChatService } from "chat/chat.service";
import { AchievementService } from "achievement/achievement.service";
import any = jasmine.any;
import { GlobalService } from "global/services/global.service";
@Injectable()
export class CheckAchievementService {
    constructor(private chatService: ChatService, private achievementService: AchievementService, private globalService: GlobalService) { }

    /*
        ACHIEVEMENT 1 : SCORE 50 BALLS
     */
    async checkScore(id: number): Promise<void> {
        if ((await this.calculateScore(true, id)) >= 50) {
            await this.achievementService.addAchievementToUser(id, 1, this.globalService.dateGenerator())
            this.checkAllAchievements(id);
        }
    }

    /*
        ACHIEVEMENT 2 : Have 10 friends
    */
    async checkFriends(id: number): Promise<void> {
        let friends = await this.chatService.getFriends(id);
        if (!('error' in friends) && friends.length >= 10) {
            await this.achievementService.addAchievementToUser(id, 2, this.globalService.dateGenerator());
            this.checkAllAchievements(id);
        }
    }

    /*
        ACHIEVEMENT 3 : Conceded 50 balls
    */
    async checkConcededScore(id: number): Promise<void> {
        if (await this.calculateScore(false, id) >= 50) {
            await this.achievementService.addAchievementToUser(id, 3, this.globalService.dateGenerator());
            this.checkAllAchievements(id);
        }
    }

    /*
        ACHIEVEMENT 4 : Play 10 games
    */
    async checkGame(id: number): Promise<void> {
        let numbers_of_games = await knex('history_game').where({ user_1: id }).orWhere({ user_2: id }).select()
            .then((rows) => { return rows.length; })
            .catch((err) => { return { error: err } });
        if (numbers_of_games >= 10) {
            await this.achievementService.addAchievementToUser(id, 4, this.globalService.dateGenerator());
            this.checkAllAchievements(id);
        }

    }

    /*
        ACHIEVEMENT 5 : Become level 5
    */
    async checkLevel(id: number): Promise<void> {
        let user = await knex('user').where({ id: id }).first();
        if (user.ladder >= 5.0) {
            await this.achievementService.addAchievementToUser(id, 5, this.globalService.dateGenerator());
            this.checkAllAchievements(id);
        }
    }

    /*
        ACHIEVEMENT 6 : Complete all other achievements
    */
    async checkAllAchievements(id: number): Promise<void> {
        let achievements = await knex('achievement_by_user').where({ "user_id": id }).select()
        .then((rows) => { return rows })
        .catch((err) => { return [] });
        if (achievements.length === 5)
            await this.achievementService.addAchievementToUser(id, 6, this.globalService.dateGenerator());
    }

    /*
        UTILITIES
    */

    async calculateScore(your_score: boolean, id: number): Promise<number> {
        let scores = 0;
        await knex('history_game').where({ user_1: id }).select().then((rows) => {
            for (let row of rows) {
                if (your_score)
                    scores += row.score_1;
                else
                    scores += row.score_2;
            }
        }).catch(() => {});
        await knex('history_game').where({ user_2: id }).select().then((rows) => {
            for (let row of rows) {
                if (your_score)
                    scores += row.score_2;
                else
                    scores += row.score_1;
            }
        }).catch(() => {});
        return (scores);
    }

}
