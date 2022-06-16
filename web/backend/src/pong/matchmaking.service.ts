import { Injectable } from "@nestjs/common";
import { GlobalService } from "global/services/global.service";
import { PongService } from "pong/pong.service";
import { knex } from 'config.knex';

export class Player
{
    public Id : number;
    public IsClassic : boolean;
    public LastAlive : number;

    constructor(id : number, isclassic : boolean)
    {
        this.Id = id;
        this.IsClassic = isclassic;
    }
}

@Injectable()
export class MatchmakingService
{
    public Players : Player[] = [];

    constructor(private pongService : PongService, private globalService: GlobalService)
    {
        setTimeout(() => {this.Update()}, 1000);
        this.pongService = pongService;
    }

    public GetPlayers(): Player[]
    {
        return this.Players;
    }

    public AddPlayer(id : number, isclassic : boolean) : void
    {
        this.Players.push(new Player(id, isclassic));
    }

    public RemovePlayer(id : number) : void
    {
        for (let i = 0; i < this.Players.length; i++)
        {
            if (id == this.Players[i].Id)
            {
                this.Players.splice(i, 1);
                return;
            }
        }
    }

    private async MatchPlayers() : Promise<boolean>
    {
        for (let i = 0; i < this.Players.length; i++)
        {
            let p1 = this.Players[i];
            let p2 = null;
            for (let j = 0; j < this.Players.length; j++)
            {
                if (j != i && this.Players[j].IsClassic == p1.IsClassic)
                {
                    p2 = this.Players[j];
                    break;
                }
            }

            if (p2 != null)
            {
                this.RemovePlayer(p1.Id);
                this.RemovePlayer(p2.Id);
                await this.CreateMatchForPlayers(p1, p2, p1.IsClassic);
                return true;
            }
        }
        return false;
    }

    public async Update() : Promise<void>
    {
        for (let i = this.Players.length - 1; i >= 0; i--)
        {
            if (Date.now() - this.Players[i].LastAlive > 3000)
            {
                this.Players.splice(i, 1);
            }
        }

        while (await this.MatchPlayers()){}

        setTimeout(() => {this.Update()}, 1000);
    }

    private async CreateMatchForPlayers(p1 : Player, p2 : Player, isclassic : boolean) : Promise<void>
    {
        let match;
        if (isclassic)
            match = await this.pongService.CreateMatchClassic(p1.Id, p2.Id);
        else
            match = await this.pongService.CreateMatchCustom(p1.Id, p2.Id);
        match.Start();
    }

    public IsPlayerIn(id : number) : boolean
    {
        for (let i = 0; i < this.Players.length; i++)
        {
            if (this.Players[i].Id == id)
                return true;
        }

        return false;
    }

    public PlayerAlive(id : number)
    {
        for (let i = 0; i < this.Players.length; i++)
        {
            if (this.Players[i].Id == id)
            {
                this.Players[i].LastAlive = Date.now();
                return;
            }
        }
    }

    public async findGamePort(user_id: number, friend_id: number) : Promise<number | {error: string}>
    {
        let game = await knex('history_game').where({user_1: user_id}).andWhere({user_2: friend_id}).
                                    orWhere({user_1: friend_id}).andWhere({user_2: user_id}).orderBy('id', 'desc').first();
        if (!game)
            return {error: "game not found"}
        else
            return game.port
    }
}