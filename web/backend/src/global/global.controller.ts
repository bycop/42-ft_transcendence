import { Controller, Get, Res, Param, Post, Body, Req } from '@nestjs/common';
import { Pool } from 'pg';
import { existsSync } from 'fs';
import { GlobalService } from './services/global.service';
import { DbService } from './services/db.service';
import * as moment from 'moment';
import { knex } from 'config.knex';

@Controller()
export class GlobalController {
	constructor(private globalService: GlobalService, private dbService: DbService) { }

	@Get()
	getHello(): string {
		const pool = new Pool();
		let result = "";
		pool.query('SELECT datname FROM pg_database;', (err, res) => {
			result += res.rowCount;
			pool.end()
		});
		return "3848";
	}

	@Get('uploads/:img')
	async getImage(@Param('img') image: string, @Res() response): Promise<any> {
		if (!existsSync('uploads/' + image))
			response.sendFile('default.png', { root: 'src/utils' });
		else
			response.sendFile(image, { root: 'uploads' });
	}


	@Post('alive')
	async alive(@Body() requestData: any, @Res() res): Promise<any> {
		let usr = await this.globalService.getUserBySessionId(requestData.session);
		
		if (!usr)
			return { error: "user not found with this SessionID" };

		let date = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
		let newdate = moment(date).format("YYYY--MM--DD HH:mm:ss");
		res.cookie('session_id', requestData.session, { expires: date });
		this.dbService.update('session', { sid: requestData.session }, { expired: newdate } )
		let response = await this.dbService.update('user', { id: usr.id }, { last_alive: this.globalService.dateGenerator() })
		.then(async (res) => {
			let invite = await knex('invite').where({ user_2: usr.id, accepted: false, declined: false }).first();
			if (invite)
				return { invite: invite };
			else
				return { success: true };
		}).catch((err) => {
			return { error: err };
		});
		res.send(response);
	}

	@Get('status/:user')
	async status(@Param('user') userName: string): Promise<any> {
		return await this.dbService.getUserStatus(userName);
	}
}
