import { Injectable } from '@nestjs/common'
import { GlobalService } from 'global/services/global.service';
import { Socket } from 'socket.io';
import { knex } from 'config.knex';
import * as db_utils from '../utils/database_defines'
import * as bcrypt from 'bcrypt'
import { DbService } from 'global/services/db.service';
import { channel } from 'diagnostics_channel';

export interface ChannelData {
	name: string;
	type: "public" | "private" | "protected" | number;
	password: string;
	avatar: string;
	created_at?: string;
}

export interface IUser {
	id: number;
	username: string;
	avatar: string | null;
	phone_number: string;
	ladder: number;
	created_at: string;
}

@Injectable()
export class ChatService {
	constructor(private globalService: GlobalService, private dbService: DbService) { }

	async createChannel(channelData: ChannelData, userId: number) {
		if (!channelData.name || !channelData.type || !userId)
			return { error: "Missing data for creating channel" };
		
		let regexChannelName = new RegExp("[a-zA-Z0-9 ]");
		
		if (!regexChannelName.test(channelData.name))
			return { error: "Channel name is not valid" };

		let isExist = await knex('channel').where({ name: channelData.name }).first();
		if (isExist)
			return { error: "Channel name already exists" };

		if (channelData.type === "protected") {
			if (!channelData.password)
				return { error: "Password is required for protected channel" };
			if (!channelData.password.match(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")))
				return { error: "Password is not valid" };
			channelData.password = bcrypt.hashSync(channelData.password, 10);
		}
		else if (channelData.type === "private" || channelData.type === "public")
			delete channelData.password;
		else
			return { error: "Channel type is not valid" };

		let channelType = await knex('type_of_channel').where({ name: channelData.type }).first();

		channelData.type = channelType.id;
		channelData.created_at = this.globalService.dateGenerator();
		return await knex('channel').insert(channelData).then(async () => {
			let channel = await knex('channel').where({ name: channelData.name }).first();
			return await knex('channel_user').insert({ channel_id: channel.id, user_id: userId, role_id: db_utils.OWNER_ROLE, created_at: this.globalService.dateGenerator() }).then(() => {
				return { success: true };
			}).catch((err) => {
				console.log(err)
				return { error: err };
			});
		}).catch((err) => {
			console.log(err)
			return { error: err };
		});
	}

	async joinChannel(channelName: string, username: string, channelPassword?: string) {
		let user = await this.dbService.getUserFromUsername(username);
		let channel = await knex('channel').where({ name: channelName }).first();

		if (!channel)
			return { error: "Channel not found" };
		if (!user)
			return { error: "User not found" };

		let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: user.id }).first();
		if (isExist)
			return { error: "User already joined this channel" }

		let allSanctions = await knex('type_of_sanction').select();
		if (!allSanctions)
			return { error: "Can't get type_of_sanction table" };

		let sanction = await knex('sanction').where({ user_id: user.id, channel_id: channel.id }).first();
		if (sanction && allSanctions[sanction.type_of_sanction - 1]?.name && allSanctions[sanction.type_of_sanction - 1]?.name === "ban")
			return { error: "You're banned" };

		if (channel.type === db_utils.PROTECTED_CHANNEL) {
			if (!channelPassword)
				return { error: "Password is required for protected channel" };
			let isValid = await bcrypt.compare(channelPassword, channel.password);
			if (!isValid)
				return { error: "Password is not valid" };
		}
		return await knex('channel_user').insert({ channel_id: channel.id, user_id: user.id, created_at: this.globalService.dateGenerator() }).then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async leaveChannel(channelName: string, username: string) {
		let user = await this.dbService.getUserFromUsername(username);
		let channel = await knex('channel').where({ name: channelName }).first();

		if (!user)
			return { error: "User not found" };
		if (!channel)
			return { error: "Channels not found" };

		let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: user.id }).first();
		if (!isExist)
			return { error: "User not joined this channel" };
		if (isExist.role_id === db_utils.OWNER_ROLE)
			return { error: "User is owner of this channel" };

		return await knex('channel_user').where({ channel_id: channel.id, user_id: user.id }).del().then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async deleteChannel(channelName: string, username: string) {
		let user = await this.dbService.getUserFromUsername(username);
		let channel = await knex('channel').where({ name: channelName }).first();

		if (!user)
			return { error: "User not found" };
		if (!channel)
			return { error: "Channel not found" };

		let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: user.id }).first();
		if (!isExist || isExist.role_id !== db_utils.OWNER_ROLE)
			return { error: "User is not owner of this channel" };

		await knex('channel_user').where({ channel_id: channel.id }).del();
		return await knex('channel').where({ id: channel.id }).del().then(async () => {
			await knex('message').where({ target_id: channel.id, is_channel: true }).del();
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async getFriends(userId: number) {
		let friends = await knex('relations_user').where(function () { this.where({ user_1: userId }).orWhere({ user_2: userId }) }).andWhere({ type_of_relation: 1 }).orWhere({ type_of_relation: 2 }).then(async (relations) => {
			let allRelations = await knex('type_of_relation').select();
			if (!allRelations)
				return { error: "Can't get type_of_relation table" };

			let friends = [];
			for (let relation of relations) {
				let user = await knex('user').where({ id: relation.user_1 === userId ? relation.user_2 : relation.user_1 }).first();
				friends.push({
					id: user.id,
					username: user.username,
					type: allRelations[relation.type_of_relation - 1].name,
					avatar: await this.globalService.checkAvatarIsInUpload(user.avatar),
					status: await this.dbService.getUserStatus(user.username)
				});
			}
			return friends;
		}).catch((err) => {
			return { error: err };
		});
		return friends;
	}

	async thereAreFriends(user1: string, user2: string): Promise<boolean> {
		let userOne = await this.dbService.getUserFromUsername(user1);
		let userTwo = await this.dbService.getUserFromUsername(user2);

		if (!userOne || !userTwo)
			return false;

		let friend = await knex('relations_user').where({ user_1: userOne.id, user_2: userTwo.id, type_of_relation: 1 })
			.orWhere({ user_1: userTwo.id, user_2: userOne.id, type_of_relation: 1 }).first();
		return (friend != undefined)
	}

	async inviteMember(channelName: string, userFrom: string, userTo: string): Promise<any> {
		let channel = await knex('channel').where({ name: channelName }).first();
		let userOne = await this.dbService.getUserFromUsername(userFrom);
		let userTwo = await this.dbService.getUserFromUsername(userTo);

		if (!channel)
			return { error: "Channel not found" };
		if (!userOne || !userTwo)
			return { error: "User(s) not found" };

		let allSanctions = await knex('type_of_sanction').select();
		if (!allSanctions)
			return { error: "Can't get type_of_sanction table" };

		let sanction = await knex('sanction').where({ user_id: userTwo.id, channel_id: channel.id }).first();
		if (sanction && allSanctions[sanction.type_of_sanction - 1]?.name && allSanctions[sanction.type_of_sanction - 1]?.name === "ban")
			return { error: "User is ban" };

		let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: userOne.id }).first();
		if (!isExist)
			return { error: "User from is not member of this channel" };
		isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: userTwo.id }).first();
		if (isExist)
			return { error: "User to is already member of this channel" };

		return await knex('channel_user').insert({ channel_id: channel.id, user_id: userTwo.id, created_at: this.globalService.dateGenerator() }).then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async getChannelsUser(username: string) {
		let user = await this.dbService.getUserFromUsername(username);
		if (!user)
			return ({ error: "User not found" });

		let isExist = await knex('channel_user').where({ user_id: user.id }).select();
		if (!isExist)
			return { error: "" };

		let allRoles = await knex('role').select();
		if (!allRoles)
			return { error: "Can't get role table" };

		let result = [];
		return new Promise(async (res, rej) => {
			for (let i = 0; isExist[i]; i++) {
				await knex('channel').where({ id: isExist[i].channel_id }).first().then((row) => {
					result.push({
						name: row.name,
						avatar: row?.avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + row.avatar : row.avatar,
						role: isExist[i].role_id ? allRoles[isExist[i].role_id - 1]?.name : undefined
					});
				}).catch((err) => {
					result.push({ error: err });
				}).finally(() => {
					if (result.length == isExist.length) {
						res(result.filter(chan => !chan.error));
					}
				});
			}
		})
	}

	async getAllChannels(username: string) {
		let user = await this.dbService.getUserFromUsername(username);
		let channel = await knex('channel').select();
		let typeChannel = await knex('type_of_channel').select();
		let result = [];

		if (!typeChannel)
			return { error: "Can't get type_of_channel table" };
		if (!user)
			return ({ error: "User not found" });

		for (let i = 0; channel[i]; i++) {
			let isExist = await knex('channel_user').where({ user_id: user.id, channel_id: channel[i].id }).first();
			if (channel[i].type != 2)
				result.push({
					name: channel[i].name,
					avatar: channel[i].avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + channel[i].avatar : channel[i].avatar,
					isMember: isExist, type: typeChannel[channel[i].type - 1]?.name
				});
		}
		return result;
	}

	async getMembersChannel(channelName: string, username: string) {
		let user = await this.dbService.getUserFromUsername(username);
		let channel = await knex('channel').where({ name: channelName }).first();
		let rows = await knex('channel_user').where({ channel_id: channel.id }).select();
		let allSanctions = await knex('type_of_sanction').select();
		let allRelations = await knex('type_of_relation').select();
		let allRoles = await knex('role').select();
		let members = [];

		if (!user)
			return ({ error: "User not found" });
		if (!channel)
			return { error: "Channel not found" };
		if (!allSanctions)
			return { error: "Can't get type_of_sanction table" };
		if (!allRelations)
			return { error: "Can't get type_of_relation table" };
		if (!allRoles)
			return { error: "Can't get allRoles table" };

		if (!rows || !rows.length)
			return [];

		return new Promise(async (res, rej) => {
			for (let i = 0; rows[i]; i++) {
				let sanction = await knex('sanction').where({ user_id: rows[i].user_id, channel_id: channel.id }).first();
				let relation = await knex('relations_user').where({ user_1: rows[i].user_id, user_2: user.id }).orWhere({ user_1: user.id, user_2: rows[i].user_id }).first();
				await knex('user').where({ id: rows[i].user_id }).first().then(async (row) => {
					members.push({
						username: row.username,
						avatar: row?.avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + row.avatar : row.avatar,
						sanction: sanction ? allSanctions[sanction.type_of_sanction - 1]?.name : undefined,
						relation: relation ? allRelations[relation.type_of_relation - 1]?.name : undefined,
						role: rows[i].role_id ? allRoles[rows[i].role_id - 1]?.name : undefined,
						status: await this.dbService.getUserStatus(row.username)
					});
				}).catch((err) => {
					members.push({ error: err });
				}).finally(() => {
					if (members.length == rows.length) {
						res(members.filter(member => !member.error));
					}
				});
			}
		})
	}

	async getBanMembers(channelName: string) {
		let channel = await knex('channel').where({ name: channelName }).first();
		let members = [];

		if (!channel)
			return { error: "Channels not found" };

		let rows = await knex('sanction').where({ type_of_sanction: 1, channel_id: channel.id }).select();
		if (!rows || !rows.length)
			return [];

		return new Promise(async (res, rej) => {
			for (let i = 0; rows[i]; i++) {
				await knex('user').where({ id: rows[i].user_id }).first().then((row) => {
					members.push({ username: row.username, avatar: row?.avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + row.avatar : row.avatar });
				}).catch((err) => {
					members.push({ error: err });
				}).finally(() => {
					if (members.length == rows.length) {
						res(members.filter(member => !member.error));
					}
				});
			}
		})
	}

	async deleteConversation(userFrom: string, userTo: string) {
		let users = await this.dbService.getUsersFromUsername([userFrom, userTo]);
		if (users.length !== 2)
			return { error: "User(s) not found" }

		return await knex('message')
			.where({ target_id: users[0].id, creator_id: users[1].id, is_channel: false })
			.orWhere({ target_id: users[1].id, creator_id: users[0].id, is_channel: false }).del().then(async () => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
	}

	async pushMessage(message: string, username: string, channelName: string) {
		let user = await knex('user').where({ username: username }).first();
		let channel;
		if (channelName.startsWith("channel_"))
			channel = await knex('channel').where({ name: channelName.split("channel_")[1] }).first();
		if (channelName.startsWith("user_"))
			channel = await knex('user').where({ username: (channelName.split("_")[1] === username ? channelName.split("_")[2] : channelName.split("_")[1]) }).first();

		if (!channel)
			return { error: "Channel not found" };
		if (!user)
			return { error: "User not found" };

		let msg = await knex('message').insert({
			creator_id: user.id,
			target_id: channel.id,
			text: message,
			is_channel: channelName.startsWith("channel_") ? true : false,
			is_system: false,
			created_at: this.globalService.dateGenerator()
		});
		if (!msg)
			return { error: "Message not sent" };

		return { success: "Message sent" };
	}

	async getChanMessages(channelName: string, isChannel: boolean, session: string) {
		let mySession = await this.dbService.getUserFromUsername(session);
		let channel = await knex('channel').where({ name: channelName }).first();
		let allRelations = await knex('type_of_relation').select();

		if (!channel)
			return { error: "Channels not found" };

		let messages = await knex('message').where({ target_id: channel.id, is_channel: isChannel }).select();
		let result = [];
		for (let i = 0; messages[i]; i++) {
			let user = await knex('user').where({ id: messages[i].creator_id }).first();
			let relation = await knex('relations_user').where({ user_1: mySession.id, user_2: user.id }).orWhere({ user_1: user.id, user_2: mySession.id }).first();
			if ((relation && allRelations[relation.type_of_relation - 1].name !== 'block') || (mySession.id === user.id) || !relation)
				result.push({
					creator_id: user.username,
					text: messages[i].text,
					avatar: user?.avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + user.avatar : user.avatar,
					created_at: messages[i].created_at
				});
		}
		return result;
	}

	async getPrivateMessages(session: string, userTarget: string) {
		let users = await this.dbService.getUsersFromUsername([session, userTarget]);
		if (users.length !== 2)
			return { error: "User(s) not found" };

		let messages = await knex('message').where({ target_id: users[0].id, creator_id: users[1].id, is_channel: false })
			.orWhere({ target_id: users[1].id, creator_id: users[0].id, is_channel: false });
		let result = [];
		for (let i = 0; messages[i]; i++) {
			let user = await knex('user').where({ id: messages[i].creator_id }).first();
			result.push({ creator_id: user.username, text: messages[i].text, avatar: await this.globalService.checkAvatarIsInUpload(user.avatar), created_at: messages[i].created_at });
		}
		return result;
	}

	async listConversation(session: string) {
		let usr = await this.dbService.getUserFromUsername(session);
		if (!usr)
			return ({ error: "User not found" });

		let messages = (await knex('message').where({ creator_id: usr.id, is_channel: false }).orWhere({ target_id: usr.id, is_channel: false })).reverse();
		let allRelations = await knex('type_of_relation').select();
		let target = [];
		for (let i = 0; messages[i]; i++) {
			let user = await knex('user').where({ id: messages[i].creator_id === usr.id ? messages[i].target_id : messages[i].creator_id }).first();
			let relation = await knex('relations_user').where({ user_1: usr.id, user_2: user.id }).orWhere({ user_1: user.id, user_2: usr.id }).first();
			target.push({
				id: user.id,
				username: user.username,
				type: relation ? allRelations[relation.type_of_relation - 1].name : undefined,
				avatar: await this.globalService.checkAvatarIsInUpload(user.avatar),
				lastmsg: messages[i]?.text.substring(0, 20) + (messages[i]?.text.length > 20 ? "..." : ""),
				status: await this.dbService.getUserStatus(user.username)
			});
		}
		const result = Array.from(new Set(target.map(a => a.id))).map(id => {
			return target.find(a => a.id === id)
		})
		return result;
	}

	async getUserwithRelation(sessionUser: string, targetUser: string) {
		let session = await this.dbService.getUserFromUsername(sessionUser);
		let target = await this.dbService.getUserFromUsername(targetUser);
		if (!session || !target || (target.username === session.username))
			return { error: "User(s) not found" };
		
		let allRelations = await knex('type_of_relation').select();
		let relation = await knex('relations_user').where({ user_1: session.id, user_2: target.id }).orWhere({ user_1: target.id, user_2: session.id }).first();
		// let user = await knex('user').where({ id: target.id }).first();
		return {
			id: target.id,
			username: target.username,
			type: relation ? allRelations[relation.type_of_relation - 1].name : undefined,
			avatar: target.avatar,
			status: await this.dbService.getUserStatus(target.username)
		}
	}

	async isMuted(usr: number, channelName: string): Promise<any> {
		let channel;
		if (channelName.startsWith("channel_")) {
			channel = await knex('channel').where({ name: channelName.split("channel_")[1] }).first();
			if (!channel)
				return "Channel not found";
		}
		else
			return undefined;

		let mute = await knex('sanction').where({ user_id: usr, channel_id: channel.id }).first();
		if (!mute)
			return undefined;

		let type_of_sanction = await knex('type_of_sanction').where({ id: mute.type_of_sanction }).first();
		return "You're " + type_of_sanction.name;
	}

	async changeRights(user: string, channelName: string, type: string, password: string) {
		let usr = await this.dbService.getUserFromUsername(user);
		let channel = await knex('channel').where({ name: channelName }).first();

		if (!usr)
			return ({ error: "User not found" });
		if (!channel)
			return { error: "Channels not found" };

		let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: usr.id }).first();
		if (!isExist)
			return { error: "User not joined this channel" };

		if (isExist.role_id !== db_utils.OWNER_ROLE)
			return { error: "User is not owner of this channel" };

		let allChannelsTypes = await knex('type_of_channel').select();

		if (!allChannelsTypes?.map(a => a.name).includes(type))
			return { error: "This type don't exist " };

		if (type === "protected" && !password.match(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")))
			return { error: "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character" };
		if (password !== null)
			password = bcrypt.hashSync(password, 10);

		if (type !== 'protected' && allChannelsTypes[channel.type - 1].name === type)
			return { error: "Channel already have this rights" };

		let newType = await knex('type_of_channel').where({ name: type }).first();
		return await knex('channel').where({ name: channel.name }).update({ type: newType.id, password: password }).then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	async getChannelAvatar(channelName: string) {
		let channel = await knex('channel').where({ name: channelName }).first();
		if (!channel)
			return { error: "Channels not found" };
		return {
			avatar: channel?.avatar?.startsWith('uploads/') ? `http://${process.env.BASE_URL}:3000/api/` + channel.avatar : channel.avatar,
		}
	}

	async inviteToPlay(user: string, target: string, type: string) {
		let usr = await this.dbService.getUserFromUsername(user);
		let targetUser = await this.dbService.getUserFromUsername(target);

		if (!usr || !targetUser)
			return { error: "User(s) not found" };

		if (!["classic", "advanced"].includes(type))
			return { error: "This type don't exist" };

		let isInvited = await knex('invite').where({ user_2: targetUser.id, accepted: false, declined: false }).select();
		if (isInvited.length)
			return { error: "User have a pending invitation" };

		let isConnected = await this.dbService.getUserStatus(targetUser.username);
		if (isConnected === "offline")
			return { error: "User is not connected" };
		else if (isConnected === "playing")
			return { error: "User is already playing" };

		return await knex('invite').insert({ user_1: usr.id, user_2: targetUser.id, is_classic: (type === "classic") }).then(() => {
			return { success: true };
		}).catch((err) => {
			return { error: err };
		});
	}

	test(session: string) {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].session === session) {
				return this._clients[i];
			}
		}
		return undefined;
	}

	private _clients = [];

	public async addClient(client: Socket, userId: number, session: string = "") {
		(client as any).session = session;
		(client as any).userId = userId;
		this._clients.push(client);
	}

	public removeClient(client: Socket) {
		this._clients = this._clients.filter((c) => c.id !== client.id);
	}

	public getClients(): any[] {
		return this._clients;
	}

	public muteClient(username: string): boolean {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].username === username) {
				this._clients[i].muted = true;
				return true;
			}
		}
		return false;
	}

	public unmuteClient(username: string): boolean {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].username === username) {
				this._clients[i].muted = false;
				return true;
			}
		}
		return false;
	}


	public banClient(username: string): boolean {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].username === username) {
				this._clients[i].banned = true;
				return true;
			}
		}
		return false;
	}

	public unbanClient(username: string): boolean {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].username === username) {
				this._clients[i].banned = false;
				return true;
			}
		}
		return false;
	}

	public isBanned(client: Socket): boolean {
		for (let i = 0; i < this._clients.length; i++) {
			if (this._clients[i].id === client.id) {
				return this._clients[i].banned;
			}
		}
		return false;
	}

	public setUsername(client: Socket, username) {
		for (let i = 0; i < this._clients.length; i++)
			if (this._clients[i].id === client.id)
				this._clients[i].username = username;
	}

	public getUsername(client: Socket): string {
		for (let i = 0; i < this._clients.length; i++)
			if (this._clients[i].id === client.id)
				return this._clients[i].username;
	}

	public async deleteInviteToPlay(id: number) {
		await knex('invite').where({ id: id }).del();
	}

	public async deleteInviteByTarget(id: number) {
		await knex('invite').where({ user_2: id }).del();
	}

	public async getInvitation(invited_id: number) {
		return knex('invite').where({ user_2: invited_id, accepted: false, declined: false }).first();
	}
}