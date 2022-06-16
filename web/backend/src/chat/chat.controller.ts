import {Controller, Get, Param, Post, Body, Query, UseInterceptors, UploadedFile, Res, Req} from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { DbService } from "global/services/db.service";
import { GlobalService } from "global/services/global.service";
import { CheckAchievementService } from "achievement/check.achievement.service";
import { diskStorage } from 'multer';
import {knex} from "config.knex";
import {MatchmakingService} from "pong/matchmaking.service";
import {PongService} from "pong/pong.service";
import * as db_utils from "utils/database_defines";

let allowedImages = ["image/png", "image/jpg", "image/jpeg", "image/gif"];

@Controller('chat')
export class ChatController {
	constructor(private chatService: ChatService, private dbService: DbService, private globalService: GlobalService, private chatGateaway: ChatGateway, private checkAchievementService: CheckAchievementService, private matchService: MatchmakingService, private pongService: PongService) { }
	// constructor(private readonly chatgateway: ChatGateway) { }

	@Post('setSanction')
	async setSanction(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.channelName || !requestData.target)
			return { error: "Argument is missing" };
		if (requestData?.type == "mute")
			return await this.dbService.setMute(requestData.channelName, requestData.target, usr.username, requestData.status, requestData.duration);
		else if (requestData?.type == "ban") {
			let res: any = {} = await this.dbService.setBan(requestData.channelName, requestData.target, usr.username, requestData.status, requestData.duration);
			if (res?.success && requestData?.status) {
				let banned = await this.getUserFromUsername(requestData.target);
				this.chatGateaway.banUser(banned?.id, requestData.channelName)
				return await this.chatService.leaveChannel(requestData.channelName, requestData.target);
			}
			else
				return res;
		} else
			return { error: "unknown sanction type" };
	}

	@Post('mySession')
	async mySession(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		return usr ?? "rien";
	}

	@Post('getAllChannels')
	async getAllChannels(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getAllChannels(usr.username);
	}

	@Post('setRelation')
	async addFriend(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		let target = await this.globalService.getUserByUsername(requestData.target)
		if (!usr || !target)
			return { error: "user not found" };
		let user_1 = await this.globalService.getUserByUsername(usr.username)
		let user_2 = await this.globalService.getUserByUsername(requestData.target)
		let res = await this.dbService.createRelation([usr.username, requestData.target], requestData.type, requestData.status);
		await this.checkAchievementService.checkFriends(user_1.id)
		await this.checkAchievementService.checkFriends(user_2.id)
		return res
	}

	@Post('getFriends')
	async getFriends(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getFriends(parseInt(usr.id));
	}

	@Get('thereAreFriends/:user1/:user2')
	async thereAreFriends(@Param('user1') user1: string, @Param('user2') user2: string): Promise<boolean> {
		return await this.chatService.thereAreFriends(user1, user2);
	}

	@Post('createChannel')
	@UseInterceptors(FileInterceptor('avatar', {
		storage: diskStorage({
			destination: './uploads/',
			filename: function (req, file, cb) {
				const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
				cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split('/')[1]);
			}
		}),
		fileFilter: function (req, file, cb) {
			if (!allowedImages.includes(file.mimetype))
				cb(new Error("Only jpg, jpeg, png and gif are allowed"), false)
			else if (file.size > 10000000)
				cb(new Error('File size greater than 10mb'), false)
			else
				cb(null, true);
		}
	}))
	async createChannel(@UploadedFile() avatar: Express.Multer.File, @Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.createChannel({ name: requestData.name, type: requestData.type, password: requestData.password, avatar: avatar?.path }, usr.id);
	}

	@Post('joinChannel')
	async joinChannel(@Body() requestData: any): Promise<any> {
		if (!requestData.channelName)
			return { error: "Argument is missing" };
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.joinChannel(requestData.channelName, usr.username, requestData.password);
	}

	@Post('leaveChannel')
	async leaveChannel(@Body() requestData: any): Promise<any> {
		let usr : any = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		let target;
		if (!requestData.channelName)
			return { error: "Argument is missing" };
			if (requestData.session && !requestData.target) {
				target = usr.username;
		}
		else if (requestData.session && requestData.target) {
			let channel = await knex('channel').where({ name: requestData.channelName }).first();
			if (!channel)
				return { error: "Channels not found" };

			let isExist = await knex('channel_user').where({ channel_id: channel.id, user_id: usr.id }).first();
			if (!isExist)
				return { error: "Mod not joined this channel" };

			if (!isExist.role_id)
				return { error: "Missing access" };
			target = requestData.target;
		}
		return await this.chatService.leaveChannel(requestData.channelName, target);
	}

	@Post('deleteChannel')
	async deleteChannel(@Body() requestData: any): Promise<any> {
		if (!requestData.channelName)
			return { error: "Argument is missing" };
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.deleteChannel(requestData.channelName, usr.username);
	}

	@Post('inviteMember')
	async inviteMember(@Body() requestData: any): Promise<any> {
		if (!requestData.channelName || !requestData.target)
			return { error: "Argument is missing" };
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.inviteMember(requestData.channelName, usr.username, requestData.target);
	}

	@Post('getChannels')
	async getChannelsUser(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getChannelsUser(usr.username);
	}
	
	@Get('getChannel/:channelName')
	async getChannelAvatar(@Param('channelName') channelName: string): Promise<any> {
		return await this.chatService.getChannelAvatar(channelName);
	}

	@Post('getMembers')
	async getMembersChannel(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getMembersChannel(requestData.channelName, usr.username);
	}

	@Get('getBanMembers/:channelName')
	async getBanMembers(@Param('channelName') channelName: string): Promise<any> {
		return await this.chatService.getBanMembers(channelName);
	}

	@Post('setToMod')
	async setToMod(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.channelName || !requestData.roleUser)
			return { error: "Argument is missing" };
		return await this.dbService.setToMod(usr.username, requestData.channelName, requestData.target, requestData.roleUser, requestData.status);
	}

	@Get('getUserFromUsername/:username')
	async getUserFromUsername(@Param('username') username: string): Promise<any> {
		return await this.dbService.getUserFromUsername(username);
	}

	@Post('getChanMessages')
	async getChanMessages(@Body() requestData: any): Promise<any> {
		if (!requestData.channelName || !requestData.isChannel)
			return { error: 'Argument is missing'};
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getChanMessages(requestData.channelName, requestData.isChannel, usr.username);
	}
	@Post('getPrivateMessages')
	async getPrivateMessages(@Body() requestData: any): Promise<any> {
		if (!requestData.userTarget)
			return { error: "Argument is missing" };
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.getPrivateMessages(usr.username, requestData.userTarget);
	}

	@Post('deleteConversation')
	async deleteConversation(@Body() requestData: any): Promise<any> {
		let userFrom = await this.globalService.getUserBySessionId(requestData.session);
		if (!userFrom)
			return { error: "user not found with this SessionID" };
		if (!requestData.target)
			return { error: 'Argument is missing' };
		return await this.chatService.deleteConversation(userFrom.username, requestData.target);
	}
	@Post('listConversation')
	async listConversation(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		return await this.chatService.listConversation(usr.username);
	}
	
	@Post('changeRights')
	async changeRights(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.channelName || !requestData.type)
			return { error: 'Argument is missing' };
		if (!requestData.password)
			requestData.password = null;
		return await this.chatService.changeRights(usr.username, requestData.channelName, requestData.type, requestData.password);
	}

	@Post('getUserwithRelation')
	async getUserwithRelation(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.target)
			return { error: 'Argument is missing' };
		return await this.chatService.getUserwithRelation(usr.username, requestData.target);
	}

	@Post('inviteToPlay')
	async inviteToPlay(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.target || !requestData.type)
			return { error: 'Argument is missing' };
		return await this.chatService.inviteToPlay(usr.username, requestData.target, requestData.type);
	}

	@Get('acceptedInvite')
	public async createMatchFriend(@Req() req) : Promise<number | { error: string }> {
		let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
		if (!user)
			return {error: "error user"};
		let invite = await this.chatService.getInvitation(user.id);
		if (!invite)
			return {error: "No invitation"};
		else {
			await knex('invite').where({user_2: user.id}).update({
				accepted: true
			})
			let match = await this.pongService.CreateMatchClassic(invite.user_1, invite.user_2);
			match?.Start();
			return (match?.GetPort());
		}
	}

	@Post('declineInvite')
	async declineInvite(@Body() requestData: any): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		if (!usr)
			return { error: "user not found with this SessionID" };
		if (!requestData.invite || !requestData.invite.id)
			return { error: "invite not found" };
		return this.dbService.update('invite', { user_2: usr.id, id: requestData.invite.id }, { declined: true })
			.then(async (res) => {
				return { success: true };
			}).catch((err) => {
				return { error: err };
			});
	}
	@Get('deleteInvite/:friendId')
	async getDeclineInvite(@Param('friendId') friendId: number, @Req() req) {
		await this.chatService.deleteInviteByTarget(friendId);
	}

	@Get('statusInviteToPlay/:username')
	public async getStatusFriend(@Param('username') friendUsername : string, @Req() req) : Promise<string | number | {error: string}> {
		let friend = await this.globalService.getUserByUsername(friendUsername);
		if (!friend)
			return {error: "Error friend"};
		let invite = await knex('invite').where({user_2: friend.id}).first();
		if (!invite)
			return {error: "No invitation"};
		if (invite.declined) {
			await this.chatService.deleteInviteToPlay(invite.id);
			return {error: friendUsername + " has declined"}
		}
		else if (invite.accepted) {
			this.chatService.deleteInviteToPlay(invite.id);
			let user = await this.globalService.getUserBySessionId(req.cookies.session_id)
			return await this.matchService.findGamePort(user.id, friend.id);
		}
		let isConnected = await this.dbService.getUserStatus(friend.username);
		if (isConnected === "offline")
		{
			await this.chatService.deleteInviteToPlay(invite.id);
			return { error: "User is not connected" };
		}
		else if (isConnected === "playing") {
			await this.chatService.deleteInviteToPlay(invite.id);
			return { error: "User is already playing" };
		}
		else
			return "Waiting";
	}

	@Get('getFriendInvitation')
	public async getFriendInvitation(@Req() req): Promise<{}> {
		let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
		if (!user)
			return {error: "User not found"};
		let invite = await this.chatService.getInvitation(user.id);
		if (!invite)
			return {error: "No invitation"};
		return await this.globalService.getUserById(invite.user_1);
	}
}


