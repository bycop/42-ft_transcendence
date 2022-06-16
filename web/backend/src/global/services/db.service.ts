import { Injectable } from '@nestjs/common';
import { knex } from 'config.knex';
import { GlobalService } from './global.service';
import { Logger } from '@nestjs/common';
import * as ms from 'ms';
import * as moment from 'moment';

let logger: Logger = new Logger('DbService');

@Injectable()
export class DbService {
	constructor(private globalService: GlobalService) {
		setInterval(async () => {
			return await knex('sanction').where('end_at', '<=', this.globalService.dateGenerator()).del().then((rows) => {
				if (rows > 0)
					logger.log(`Deleted ${rows} sanctions`);
			}).catch((err) => {
				return { error: err };
			});
		}, 1000)
	}

	async insert(table: string, data: any) {
		return await knex(table).insert(data).then(() => {
			return { success: true };
		}).catch((err) => {
			console.log(err)
			return { error: err };
		});
	}

	async selectColumn(table: string, column: string[], where: any = {}) {
		return await knex(table).where(where).select(column).then((rows) => {
			return rows;
		}).catch((err) => {
			return { error: err };
		});
	}

	async selectAll(table: string, where: any = {}) {
		return await knex(table).where(where).select().then((rows) => {
			return rows;
		}).catch((err) => {
			return { error: err };
		});
	}

	async deleteOperator(table: string, column: string, operator: string, value: string) {
		return await knex(table).where(column, operator, value).del().then((rows) => {
			return rows;
		}).catch((err) => {
			return { error: err };
		});
	}

	async update(table: string, where: any, data: any) {
		return await knex(table).where(where).update(data).then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async getUsersFromUsername(username: string[]): Promise<any> {
		if (!username.length || !username[0])
			return null;
		return await knex('user').whereIn('username', username).then((rows) => {
			return rows;
		}).catch((err) => {
			return null;
		});
	}

	async getUserFromUsername(username: string): Promise<any> {
		if (!username)
			return null;
		return await knex('user').where('username', username).first().then(async (rows) => {
			rows.avatar = await this.globalService.checkAvatarIsInUpload(rows.avatar);
			return rows;
		}).catch((err) => {
			return null;
		});
	}

	async getUserStatus(username: string) {
		let user = await this.getUserFromUsername(username);
		if (!user)
			return { error: "user not found" };

		let game = await knex('history_game').where(function () { this.where({ user_1: user.id }).orWhere({ user_2: user.id }) }).andWhere({ end_at: null }).first().then((res) => {
			return res?.game_id
		}).catch(() => {
			return null;
		});

		return (game ? "playing" : (user.last_alive && this.globalService.dateGenerator(0, ms("1m")) < moment(user.last_alive).format("YYYY-MM-DD HH:mm:ss") ? "online" : "offline"))
	}

	async createRelation(usernames: string[], type: "block" | "friend", status: boolean) {
		let src = await this.getUserFromUsername(usernames[0]);
		let target = await this.getUserFromUsername(usernames[1]);
		// Get relation id from type_of_relation table
		if (!src || !target)
			return { error: "User(s) not found" };

		let relation = await knex('type_of_relation').where({ name: type }).first();
		if (!relation)
			return { error: "Relation type not found" };
		// Check if relation exists
		let relationExists = await knex('relations_user').where({ user_1: src.id, user_2: target.id }).orWhere({ user_1: target.id, user_2: src.id }).first();

		if (!relationExists && !status)
			return { error: "Unknown relation, can't be deleted" };
		else if (!status && relation.id !== relationExists.type_of_relation)
			return { error: "Unknown relation, can't be deleted" };
		else if (!status) {
			if (type === "block" && relationExists.block_src !== src.id)
				return { error: "You can't unblock yourself" };
			return await knex('relations_user').where({ user_1: src.id, user_2: target.id }).orWhere({ user_1: target.id, user_2: src.id }).del().then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
		if (relationExists) {
			if (relationExists.type_of_relation === relation.id) {
				return { error: `User is already ${type === "block" ? "blocked" : "your friend"}` };
			}
			else {
				if (relationExists.type_of_relation === 2 && relationExists.block_src !== src.id)
					return { error: "You can't unblock yourself" };
				return await knex('relations_user').where({ user_1: src.id, user_2: target.id }).orWhere({ user_1: target.id, user_2: src.id }).update({ type_of_relation: relation.id, block_src: type === "block" ? src.id : null }).then(() => {
					return { success: true };
				}).catch((err) => {
					return { error: err };
				});
			}
		}
		else {
			return await knex('relations_user').insert({ user_1: src.id, user_2: target.id, type_of_relation: relation.id, block_src: type === "block" ? src.id : null, created_at: this.globalService.dateGenerator() }).then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
	}

	async setMute(channelName: string, username: string, moderatorName: string, status: boolean, duration?: string) {
		let user = await this.getUserFromUsername(username);
		if (!user)
			return { error: "user not found" };

		let mod = await this.getUserFromUsername(moderatorName);
		if (!mod)
			return { error: "Mod not found" };

		let channel = await knex('channel').where({ name: channelName }).first();
		if (!channel)
			return ({ error: "Channel not found" });

		let isMember = await knex('channel_user').where({ user_id: user.id, channel_id: channel.id }).first();
		if (!isMember)
			return { error: "User is not member of this channel" };

		let isMod = await knex('channel_user').where({ user_id: mod.id, channel_id: channel.id }).first();
		if (!isMod || !isMod.role_id || isMember.role_id >= isMod.role_id)
			return { error: "Missing permission" };

		let typeSanction = await knex('type_of_sanction').where({ name: "mute" }).first();
		if (!typeSanction)
			return { error: "Sanction type not found" };

		let sanction = await knex('sanction').where({ user_id: user.id, type_of_sanction: typeSanction.id }).first();
		if (!status && !sanction)
			return { error: "User is not muted" };
		else if (sanction) {
			if (!status)
				return await knex('sanction').where({ user_id: user.id, channel_id: channel.id, type_of_sanction: typeSanction.id }).del().then(() => {
					return { success: true };
				}).catch((err) => {
					return { error: err };
				});
			else
				return { error: "User is already muted" };
		}
		else {
			if (duration && ms(duration) < 1)
				return { error: "Duration is not valid" };
			return await knex('sanction').insert({ user_id: user.id, channel_id: channel.id, type_of_sanction: typeSanction.id, moderator_id: mod.id, created_at: this.globalService.dateGenerator(), end_at: (duration ? this.globalService.dateGenerator(ms(duration)) : null) }).then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
	}

	async setBan(channelName: string, username: string, moderatorName: string, status: boolean, duration?: string) {
		let user = await this.getUserFromUsername(username);
		if (!user)
			return { error: "user not found" };

		let mod = await this.getUserFromUsername(moderatorName);
		if (!mod)
			return { error: "Mod not found" };

		let channel = await knex('channel').where({ name: channelName }).first();
		if (!channel)
			return ({ error: "Channel not found" });

		let isMember = await knex('channel_user').where({ user_id: user.id, channel_id: channel.id }).first();
		if (!isMember && status)
			return { error: "User is not member of this channel" };

		let isMod = await knex('channel_user').where({ user_id: mod.id, channel_id: channel.id }).first();
		if (!isMod || !isMod.role_id || (isMember && isMember.role_id >= isMod.role_id))
			return { error: "Missing permission3" };

		let typeSanction = await knex('type_of_sanction').where({ name: "ban" }).first();
		if (!typeSanction)
			return { error: "Sanction type not found" };

		let sanction = await knex('sanction').where({ user_id: user.id, type_of_sanction: typeSanction.id }).first();
		if (!status && !sanction)
			return { error: "User is not banned" };
		else if (sanction) {
			if (!status)
				return await knex('sanction').where({ user_id: user.id, channel_id: channel.id, type_of_sanction: typeSanction.id }).del().then(() => {
					return { success: true };
				}).catch((err) => {
					return { error: err };
				});
			else
				return { error: "User is already banned" };
		}
		else {
			if (duration && ms(duration) < 1)
				return { error: "Duration is not valid" };
			return await knex('sanction').insert({ user_id: user.id, channel_id: channel.id, type_of_sanction: typeSanction.id, moderator_id: mod.id, created_at: this.globalService.dateGenerator(), end_at: (duration ? this.globalService.dateGenerator(ms(duration)) : null) }).then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
	}
	varToString = varObj => Object.keys(varObj)[0]

	async setToMod(author: string, channelName: string, target: string, roleUser: string, status: boolean) {
		let user = await this.getUserFromUsername(target);
		let mod = await this.getUserFromUsername(author);
		let channel = await knex('channel').where({ name: channelName }).first();
		let userRole = await knex('role').where({ name: roleUser }).first();

		if (!mod)
			return { error: "Mod not found" };
		if (!user)
			return { error: "user not found" };
		if (!channel)
			return { error: "Channel not found" };
		if (!userRole)
			return { error: "Role type not found" };

		let modRole = await knex('channel_user').where({ user_id: mod.id }).first();
		if (!modRole || modRole.role_id !== 2)
			return { error: "Missing permission" };

		let role = await knex('channel_user').where({ channel_id: channel.id, user_id: user.id }).first();
		if (!role)
			return { error: "User is not member of this channel" };
		if (roleUser === 'admin' && role.role_id === userRole.id && status)
			return ({ error: user.username + " is already administrator" });
		if (role.role_id === 2)
			return ({ error: "You can't change the owner role" });
		else if (role.role_id === userRole.id && !status && roleUser === 'admin') {
			return await knex('channel_user').where({ user_id: user.id }).update({ role_id: null })
				.then(() => {
					return { success: true };
				}).catch((err) => {
					return { error: err };
				});
		}
		else if (role.role_id === null && !status && roleUser === 'admin') {
			return ({ error: user.username + " is not administrator" });
		}
		else if (role.role_id !== userRole.id && status && roleUser === 'admin') {
			return await knex('channel_user').where({ user_id: user.id }).update({ role_id: userRole.id }).then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
		else if (role.role_id !== userRole.id && status && roleUser === 'owner') {
			await knex('channel_user').where({ user_id: user.id }).update({ role_id: userRole.id });
			return await knex('channel_user').where({ user_id: mod.id }).update({ role_id: null }).then(() => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
		}
	}

	// async mySession(usr: )
	// async whichRelation(user1: string, user2: string) {

	// 	let users = await this.getUsersFromUsername([user1, user2]);

	// 	if (!users || users.length != 2)
	// 		return { error: "User(s) not found" };

	// 	let relationExists = await knex('relations_user').where({
	// 		user_1: users[0].id,
	// 		user_2: users[1].id
	// 	}).orWhere({
	// 		user_1: users[1].id,
	// 		user_2: users[0].id
	// 	}).first();

	// 	if (!relationExists)
	// 		return undefined;

	// 	let relation = await knex('type_of_relation').where({ id: relationExists.type_of_relation }).first();
	// 	if (!relation)
	// 		return { error: "Relation type not found" };
	// 	else
	// 		return relation.name;
	// }

}