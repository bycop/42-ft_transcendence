import {Body, Injectable} from '@nestjs/common';
import {knex} from "config.knex";
@Injectable()
export class AchievementService {
    async getAchievements() {
        return await knex('achievement').select().then((rows) => {
            return rows
        }).catch((err) => {
            return [];
        })
    }
    async getAchievementsOfUser(user_id: Number) {
        let achievements : any = await this.getAchievements()
        let achievementsUser = await knex('achievement_by_user').where("user_id", user_id).select().then((rows) => {
            return rows
        }).catch((err) => {
            return []
        });
        for (let i = 0 ; i < achievements.length ; i++) {
            achievements[i] = {...achievements[i], ...{is_achieved: achievementsUser.find(({achievement_id}) => achievement_id === achievements[i].id) !== undefined}}
        }
        return achievements
    }
    async createAchievements(titleAchievement, textAchievement, created_at) {
        return await knex('achievement').insert({
            title: titleAchievement,
            text: textAchievement,
            created_at: created_at
        }).then((res) => {
            return res
        }).catch((err) => {
            return {error: err}
        })
    }

    async addAchievementToUser(userId: Number, achievementId: Number, createdAt) {
        let achievement = await knex('achievement_by_user').where({user_id: userId}).andWhere({achievement_id: achievementId}).first();
        if (achievement)
            return ;
        return await knex('achievement_by_user').insert({
            user_id: userId,
            achievement_id: achievementId,
            created_at: createdAt
        }).then((res) => {
            return res
        }).catch((err) => {
            return {error: err}
        })
    }
    async getFirstAchievementByTitle(titleAchievement) {
        return await knex('achievement').where('title', titleAchievement).first();
    }

}
