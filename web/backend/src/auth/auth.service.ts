import { Injectable } from '@nestjs/common';
import { DbService } from 'global/services/db.service';
import { GlobalService } from 'global/services/global.service';
import axios from 'axios';
import * as moment from "moment-timezone";

@Injectable()
export class AuthService {
	constructor(private dbService: DbService, private globalService: GlobalService) {}

	async getInfoUser(token: string) {
		let headers = {
			headers: {
				'Authorization': 'Bearer ' + token + ""
			}
		}

		return await axios.get("https://api.intra.42.fr/v2/me", headers).then((res) => {
			return res.data
		}).catch(e => {
			return undefined
		})
	}
	async getToken(code: string) : Promise<string>{
		let data = {
			'grant_type': 'authorization_code',
			'client_id': process.env.UID + "",
			'client_secret': process.env.SECRET + "",
			'code': code,
			'redirect_uri': `http://${process.env.BASE_URL}/login`
		}
		return await axios.post("https://api.intra.42.fr/oauth/token", data).then((res) => {
			return res.data.access_token
		}).catch(e => {
			return undefined
		})
	}

	async createCookieById(id: number, res) {
		let cookie = this.globalService.generateToken()
		let date = 	new Date(new Date().getTime()+ 2 * 60 * 60 * 1000)
		let newdate = moment(date).format("YYYY-MM-DD HH:mm:ss");

		res.header("Access-Control-Allow-Origin", `http://${process.env.BASE_URL}`);
		res.cookie('session_id', cookie, {
			expires: date,
			sameSite: 'strict',
			httpOnly: false,
		});

		await this.dbService.deleteOperator("session", "expired", "<", this.globalService.dateGenerator())
		this.dbService.insert("session", {
			'sid': cookie,
			'user_id': id,
			'expired': newdate,
		}).then(() => {})
		.catch(() => {	
			console.log('Error: Session');
		})
	}

	async isConnected(req) : Promise<boolean> {
		await this.dbService.deleteOperator("session", "expired", "<", this.globalService.dateGenerator())
		return await this.dbService.selectAll('session', {
			'sid': req.cookies.session_id
		}).then((res) => {
			return res[0] != null;
		}).catch(() => {
			return false;
		})
	}

	addHeaderRes(res) {
		res.header("Access-Control-Allow-Origin", `http://${process.env.BASE_URL}`);
		res.header("Access-Control-Allow-Credentials", true);
		// res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
		// res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');

	}

}
