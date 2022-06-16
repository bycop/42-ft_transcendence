import {Body, Controller, Get, Param, Post, Req, Res} from "@nestjs/common";
import {PongMatch, PongService} from "./pong.service";
import {GlobalService} from "global/services/global.service";
import { DbService } from "global/services/db.service";
import * as moment from "moment-timezone";
import {knex} from "config.knex";

@Controller('pong')
export class PongController
{
    constructor(private readonly pongService: PongService, private globalService: GlobalService, private dbService: DbService) {}

    @Get('getCurrentGames')
    async getCurrentGames()
    {
        return await this.pongService.getCurrentGames();
    }

    @Get('get-match/:username')
    async GetMatches(@Param('username') username: string){
        let user = await this.dbService.getUserFromUsername(username)
        return await this.pongService.GetMatchesByPlayerId(user.id)
    }

    @Get('get-port-by-token')
    async GetPortByToken(@Req() req, @Res() res) : Promise<void>
    {
        this.globalService.addHeaderRes(res)
        let tok = await this.globalService.getUserBySessionId(req.cookies.session_id);
        return await knex('history_game').where({ user_1: tok.id}).orWhere({user_2: tok.id}).orderBy('id', 'desc').then((dt) => {
            if (dt[0].end_at == null)
                res.send({ port: dt[0].port});
            else
                res.send({ port: 0 });
        }).catch(() => {
            res.send({ port: 0 });
        });
    }

    @Get('is-match-running/:id')
    IsMatchRunning(@Param() params) : string
    {
        let match = this.pongService.GetMatch(params.id);
        if (match && match.IsRunning())
        {
            return "match running"
        }
        return "match is not running or unknown";
    }

    @Get('stop-match/:id')
    StopMatch(@Param() params) : string
    {
        let match = this.pongService.GetMatch(params.id);
        if (match)
        {
            match.Stop();
            return "match stopped"
        }
        return "unknown match";
    }

    @Get('stop-all-matchs/')
    StopAllMatch(@Param() params) : void
    {
        let matchs = this.pongService.GetMatches();
        for (let i = 0; i < matchs.length; i++)
            matchs[i].Stop();
    }

    @Get('show-matches')
    ShowMatches() : string
    {
        let matches = this.pongService.GetMatches();
        if (!matches)
            return "No running matches";
        let str = "Matches (" + matches.length + ") :<br>";
        for (let match of matches) {
            str += match.GetID() + " " + match.GetPort() + "<br>";
        }
        return str;
    }
}