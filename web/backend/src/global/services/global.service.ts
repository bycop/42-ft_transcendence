import { Get, Injectable, Param } from '@nestjs/common';
import { knex } from "config.knex";
import * as moment from "moment-timezone";
import {existsSync} from "fs";

@Injectable()
export class GlobalService {

	dateGenerator(add: number = 0, remove: number = 0) {
		return moment().add(add, 'milliseconds').subtract(remove, 'milliseconds').format("YYYY-MM-DD HH:mm:ss");
	}

	async getUserBySessionId(sessionId) {
		if (!sessionId)
			return null;
		let sessionUser = await knex("session").where("sid", sessionId).first();
		if (!sessionUser)
			return null;
		let user = await knex("user").where('id', sessionUser.user_id).first();
		user.avatar = await this.checkAvatarIsInUpload(user.avatar);
		return user;
	}

	async checkAvatarIsInUpload(avatar) {
		if (existsSync(avatar))
			return("http://" + process.env.BASE_URL + ":3000/api/" + avatar);
		else
			return avatar;
	}

	async getUserById(id) {
		let user = await knex("user").where('id', id).first();
		if (!user)
			return ;
		user.avatar = await this.checkAvatarIsInUpload(user.avatar);
		return user;

	}

	async getUserBy42login(login: string) {
		let user = await knex("user").where({'login42': login}).first();
		if (!user)
			return ;
		user.avatar = await this.checkAvatarIsInUpload(user.avatar);
		return user;
	}
	
	async getUserByUsername(login: string) {
		let user = await knex("user").where({'username': login}).first();
		if (!user)
			return ;
		user.avatar = await this.checkAvatarIsInUpload(user.avatar);
		return user;
	}
		
	generateToken() {
		return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2); // remove `0.`
	}

	addHeaderRes(res) {
		res.header("Access-Control-Allow-Origin", `http://${process.env.BASE_URL}`);
		res.header("Access-Control-Allow-Credentials", true);
		// res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
		// res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
	}
// 	async getRoleBySessionId(sessionId, channelName: string) {
// 		if (!sessionId)
// 			return null;
// 		let sessionUser = await knex("session").where("sid", sessionId).first();
// 		if (!sessionUser)
// 			return null;
// 		let channel = await knex('channel').where({ name: channelName }).first();
// 		if (!channel)
// 			return { error: "Channel not found" };
// 		let usr = await knex("user").where('id', sessionUser.user_id).first();
		
// 		let rows = await knex('channel_user').where({ channel_id: channel.id }).select();
// 		let allRoles = await knex('role').select();
// 		let role = await knex('channel_user').where({user_id: rows[i].user_id, channel_id: channel.id}).first();

// 		usr.push({role: })
// 	}
// }
}
