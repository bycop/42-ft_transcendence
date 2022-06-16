import { Body, Controller, Get, Query, Res, Req, Param, Post } from '@nestjs/common';
import { AuthService } from "auth/auth.service";
import { DbService } from 'global/services/db.service';
import { GlobalService } from 'global/services/global.service';
import { knex } from "config.knex"
import { Public } from 'guards/isPublic.decorator';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService, private dbService: DbService, private globalService: GlobalService) {
	}

	@Public()
	@Get('getUserBySessionId/:sid')
	async getUsersBySessionId(@Param('sid') sid: string): Promise<any> {
		return await this.globalService.getUserBySessionId(sid)
	}

	@Public()
	@Get('isConnected')
	async isConnected(@Req() req, @Res() res) {
		this.globalService.addHeaderRes(res)
		res.send(await this.authService.isConnected(req));
	}

	@Public()
	@Get('createCookieById/:id')
	async createCookieById(@Param('id') id, @Res() res) {
		this.globalService.addHeaderRes(res);
		await this.authService.createCookieById(id, res);
		return res.send()
	}

	@Public()
	@Get('login')
	async getCode(@Query('code') code: string, @Res() res, @Req() req) {
		this.globalService.addHeaderRes(res);
		if (await this.authService.isConnected(req))
			return res.send("Already Connect")
		if (code == undefined)
			return res.send("Error: Code")
		let token: string = await this.authService.getToken(code);
		if (token == undefined)
			return res.send("Error: Token")
		let user = await this.authService.getInfoUser(token)
		if (user == undefined)
			return res.send("Error: User")

		let user_exist = await this.globalService.getUserBy42login(user.login);
		if (user_exist && user_exist.doublefa) {
			return res.send(user_exist);
		}
		let user_id = undefined;
		if (user_exist)
			user_id = user_exist.id;
		else {
			await knex("user").returning("id").insert({
				'username': user.login,
				'login42': user.login,
				'avatar': user.image_url,
				'created_at': this.globalService.dateGenerator()
			}).then((row) => {
				// @ts-ignore
				user_id = row[0].id
			}).catch(() => {
				return res.send("Error: User")
			})
		}
		await this.authService.createCookieById(user_id, res);
		return res.send()
	}

	@Get('signout')
	async logout(@Req() req, @Res() res) {
		this.globalService.addHeaderRes(res)
		res.cookie('session_id', '', { maxAge: 0 });
		let session_id = req.cookies.session_id
		await this.dbService.deleteOperator("session", "sid", "=", session_id)
		return res.send({ success: true })
	}
}
