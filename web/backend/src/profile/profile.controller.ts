import {Controller, Get, Req, Param, Post, Body, Redirect, Res, UseInterceptors, UploadedFile} from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {GlobalService} from "global/services/global.service";
import { DbService } from "global/services/db.service";
import axios from 'axios';
let allowedImages = ["image/png", "image/jpg", "image/jpeg", "image/gif"];
import {existsSync} from "fs";
import {Public} from "guards/isPublic.decorator";

@Controller('profile')
export class ProfileController {

	constructor(private profileService: ProfileService, private globalService: GlobalService, private dbService: DbService) {
	}
	@Post('scan')
	async getQR(@Body() requestData: any): Promise <any> {
		let appName = "transcendence";
		let secretCode = await this.profileService.secretCode(requestData.user);
		let result = await axios.get(`https://www.authenticatorApi.com/pair.aspx?AppName=${appName}&AppInfo=${requestData.user.username}&SecretCode=${secretCode}`)
			.then(response => {
				let data = response.data;
				let secretKey = data.split("pair with ")[1].split("'")[0];
				let img = data.split("img src='")[1].split("'")[0];
				return {img: img, secretKey: secretKey};
			})
			.catch(err => {
				return err
			})
		return result;
	}

	@Public()
	@Get('verif/:pin/:id')
	async verifPin(@Param('pin')pin: string, @Param('id')id: string): Promise <any> {
		let user = await this.globalService.getUserById(id);
		let result = await axios.get(`https://www.authenticatorapi.com/Validate.aspx?Pin=${pin}&SecretCode=${user.secretCode}`)
			.then(response => {
				return (response.data === "True");
			})
			.catch(err => {
				return err;
			})
		return result;
	}
	
	@Get('check2fa')
	async Check2fa(@Req() req: any, @Res() res): Promise<boolean> {
		this.globalService.addHeaderRes(res)
		let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
		if (!user)
			return res.send(false)
		return (res.send(user.doublefa));
	}

	@Post('Switch2fa')
	async Switch2fa(@Body() requestData: any): Promise <any> {
		return await this.profileService.Switch2fa(requestData.user);
	}

	@Post('Save')
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
	async Save(@UploadedFile() avatar: Express.Multer.File,@Body() requestData: any, @Res() res): Promise <any> {
		return res.send(await this.profileService.Save(requestData, avatar?.path));
	}
	
	@Get('getFriends/:username')
	async getFriends(@Param('username') username: string ) {
		let user = await this.dbService.getUserFromUsername(username)
		return await this.profileService.getFriends(user.id)
	}

	@Get('getUser/:username')
	async getUser(@Param('username') username: string) {
		return await this.dbService.getUserFromUsername(username)
	}
}
