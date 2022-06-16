import {
	SubscribeMessage,
	WebSocketGateway,
	OnGatewayInit,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect
} from '@nestjs/websockets';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { GlobalService } from 'global/services/global.service';
import { DbService } from 'global/services/db.service';
import { knex } from '../config.knex';

@WebSocketGateway({
	// handlePreflightRequest: (req, res) => {
	//     const headers = {
	//         "Access-Control-Request-Private-Network": true
	//     };
	//     res.writeHead(200, headers);
	//     res.end();
	// },
	cors: {
		origin: '*',
		allowedHeaders: ["Access-Control-Request-Private-Network"],
	},
})
export class ChatGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	constructor(private chatservice: ChatService, private globalService: GlobalService, private dbService: DbService) { }
	@WebSocketServer() server: Server;

	private logger: Logger = new Logger('ChatGateway');


	@SubscribeMessage('joinChannel')
	async handleJoinChannel(client: Socket, payload: any) {
		this.logger.debug(`Join requested: ${payload.channel ? "channel " + payload.channel : "user " + payload.user} by ${payload.session} (${client.id})`);
		let user = await this.globalService.getUserBySessionId(payload.session);
		if (!user)
			return client.disconnect();

		this.chatservice.setUsername(client, user.username); // Temp, to set username on each message

		if (payload.channel) {
			let channel = await knex('channel').where({ name: payload.channel }).first();
			if (!channel)
				return client.emit('disconnectFromRoom', (payload.channel ? "channel" : (payload.user ? "user" : undefined))) // Todo frontend
			let isAccess = await knex('channel_user').where({ user_id: user.id, channel_id: channel.id }).first();
			if (!isAccess)
				return client.emit('disconnectFromRoom', (payload.channel ? "channel" : (payload.user ? "user" : undefined))) // Todo frontend
			let rooms = Array.from(client.rooms);
			for (let room of rooms) {
				if (room.startsWith("channel_") || room.startsWith("user_")) {
					client.leave(room);
				}
			}
			client.join("channel_" + payload.channel);
		}
		else if (payload.user) {
			if (Array.from(client.rooms)[1])
				client.leave(Array.from(client.rooms)[1]);
			client.join("user_" + (payload.user > user.username ? user.username + "_" + payload.user : payload.user + "_" + user.username));
		}
		else {
			return client.emit('disconnectFromRoom', (payload.channel ? "channel" : (payload.user ? "user" : undefined))) // Todo frontend
		}
		// this.server.emit('serverToClientMsg', payload);
	}

	@SubscribeMessage('clientToServerMsg')
	async handleMessage(client: Socket, payload): Promise<void> {
		let usr = await this.globalService.getUserBySessionId(payload.session);
		if (!usr || !Array.from(client.rooms)[1])
			return;

		this.chatservice.setUsername(client, usr.username); // Temp, to set username on each message

		let error;
		if ((error = await this.chatservice.isMuted(usr.id, Array.from(client.rooms)[1])) != undefined)
			return this.systemMessage(client, error);
		this.chatservice.pushMessage(payload.msg, usr.username, Array.from(client.rooms)[1]);
		this.server.to(Array.from(client.rooms)[1]).emit('serverToClientMsg', payload.msg, usr.username, (usr.avatar || "https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg"), this.globalService.dateGenerator());
	}

	afterInit(server: Server) {
		this.logger.log('Socket.io initialized');
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
		this.chatservice.removeClient(client);
	}

	async handleConnection(client: Socket, ...args: any[]) {
		let user = await this.globalService.getUserBySessionId(client.handshake.query.session);
		if (!client.handshake.query.session || !user)
			return client.disconnect();
		// client.join('chat');
		this.logger.log(`Client connected: ${client.id}`);
		this.chatservice.addClient(client, user.id, client.handshake.query.session as string);
		client.send("OK");
	}

	banUser(userId: number, channelName: string) {
		let clients = this.chatservice.getClients().filter(c => c.userId === userId);
		for (let client of clients) {
			let rooms = Array.from(client.rooms);
			for (let room of rooms) {
				if (room === "channel_" + channelName) {
					client.leave(room);
				}
			}
			client.emit('clientBannedFromRoom', channelName);
		}
	}

	systemMessage(client: Socket, message: string) {
		client.emit('serverToClientMsg', message, "System", "https://pnggrid.com/wp-content/uploads/2021/05/Discord-Bot-Logo-1018x1024.png", this.globalService.dateGenerator());
	}

	systemChannelMessage(room: string, message: string) {
		this.server.to(room).emit('serverToClientMsg', message, "System", "https://pnggrid.com/wp-content/uploads/2021/05/Discord-Bot-Logo-1018x1024.png", this.globalService.dateGenerator());
	}

	refresh(client: Socket) {
		client.emit('refresh', "test");
	}

}