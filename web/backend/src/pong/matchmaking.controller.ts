import {Body, Controller, Get, Param, Post, Req, Res} from "@nestjs/common";
import {MatchmakingService} from "pong/matchmaking.service";
import {GlobalService} from "global/services/global.service";
import {PongService} from "pong/pong.service";
import {MatchmakingResponse, MatchmakingStatus} from "../../../shared/pong/matchmaking";
import {Player} from "./matchmaking.service";
import {knex} from "config.knex";
import {query} from "express";


@Controller('matchmaking')
export class MatchmakingController
{

    constructor(private readonly matchService: MatchmakingService, private readonly pongService : PongService, private globalService: GlobalService) {}

    @Post('join')
    public async Join(@Body() data : any, @Req() req, @Res() res)
    {
        this.globalService.addHeaderRes(res);
        let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
        if (!user.id || this.matchService.IsPlayerIn(user.id) || await this.pongService.IsInMatch(user.id))
        {
            console.log(await this.pongService.IsInMatch(user.id));
            return (res.send("error"));
        }
        this.matchService.AddPlayer(user.id, data.isclassic);
        res.send("success");
    }

    @Get('getTokens')
    public GetTokens() : Player[]
    {
        return this.matchService.GetPlayers();
    }

    @Get('leave')
    public async Leave(@Req() req, @Res() res)
    {
        this.globalService.addHeaderRes(res);
        let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
        this.matchService.RemovePlayer(user.id);
        res.send();
    }

    @Get('status')
    public async Status(@Req() req, @Res() res) : Promise<MatchmakingResponse>
    {
        this.globalService.addHeaderRes(res);
        let resp : MatchmakingResponse = new MatchmakingResponse();
        let user = await this.globalService.getUserBySessionId(req.cookies.session_id);
        if (this.matchService.IsPlayerIn(user.id))
        {
            resp.Status = MatchmakingStatus.Searching;

            this.matchService.PlayerAlive(user.id);
        }
        else
        {
            let match = this.pongService.GetPlayerMatch(user.id);
            if (match == null)
            {
                resp.Status = MatchmakingStatus.Unknown;
            }
            else
            {
                resp.Status = MatchmakingStatus.Found;
                resp.ServerPort = match.GetPort();
            }
        }
        return (res.send(resp));
    }
}