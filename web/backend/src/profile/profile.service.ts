import { Injectable } from "@nestjs/common";
import { knex } from "config.knex";
import { GlobalService } from "global/services/global.service";

@Injectable()
export class ProfileService {
	constructor(private globalService: GlobalService) { }
	async getFriends(userId) {
		return await knex('relations_user').where(function () {
			this.where({ user_1: userId })
				.orWhere({ user_2: userId })
		})
			.andWhere({ type_of_relation: 1 })
			.then(async (relations) => {
				let friends = [];
				for (let relation of relations) {
					let user = await knex('user').where({ id: relation.user_1 === userId ? relation.user_2 : relation.user_1 }).first();
					friends.push({ username: user.username, avatar: await this.globalService.checkAvatarIsInUpload(user.avatar), ladder: user.ladder });
				}
				return friends;
			}).catch(() => {
				return "error"
			});
	}
	async Switch2fa(user: any) {
		let result = await knex('user').where({ id: user.id }).first();
		if (!result)
			return { error: "userNotFound" }
		return await knex('user').where({ id: user.id }).update({ doublefa: result.doublefa === false })
	}
	async Save(data: any, avatarPath: string) {

		let user = await this.globalService.getUserBySessionId(data.session);
		if (!user)
			return { error: "session" };

		let isExist = await knex('user').where({ username: data.newUsername }).orWhere({ login42: data.newUsername }).first();
		if (isExist && isExist.id !== user.id) {
			return { error: "usernameAlreadyTaken" };
		}

		// Si on change juste d'avatar et pas de pseudo
		if (data.newUsername === '' && avatarPath)
			await knex('user').where({ id: user.id }).update({ avatar: avatarPath });
		// Si on a pas changé d'avatar //
		else if (!avatarPath)
			await knex('user').where({ id: user.id }).update({ username: data.newUsername });
		else
			await knex('user').where({ id: user.id }).update({ username: data.newUsername, avatar: avatarPath });
		return this.globalService.checkAvatarIsInUpload(avatarPath);
	}
	async secretCode(user: any) {
		let secretCode = user.secretCode;
		if (!secretCode) {
			secretCode = this.globalService.generateToken()
			await knex('user').where({ id: user.id }).update({ secretCode: secretCode })
		}
		return secretCode;
	}
}
