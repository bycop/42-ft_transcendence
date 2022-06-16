import { Injectable } from '@nestjs/common'
import { Worker } from 'worker_threads'
import { v4 as uuidv4 } from 'uuid'
import {knex} from "config.knex";
import * as db_utils from "utils/database_defines";
import {GlobalService} from "global/services/global.service";
import {DbService} from "global/services/db.service";
import {CheckAchievementService} from "achievement/check.achievement.service";
import { PongRules } from "pong/pong";
import {Rectangle, Vector2} from "pong/math";
import * as TcpPortUsed from "tcp-port-used";

@Injectable()
export class PongService
{
    constructor(private globalService: GlobalService, private dbService: DbService, private checkAchievementService: CheckAchievementService) {}

    public async getCurrentGames()
    {
        return await knex('history_game').where({end_at: null}).select().then((async rows => {
            let games = [];

            for (let i = 0 ; i < rows.length ; i++)
            {
                let user_1 = await this.globalService.getUserById(rows[i].user_1);
                let user_2 = await this.globalService.getUserById(rows[i].user_2);
                games.push({match: rows[i], user_1: user_1, user_2: user_2});
            }
            return games;
        })).catch(() => {
			return [];
		});
    }
    public async RegisterMatch(user1_id: number, user2_id: number, score1: number, score2: number, is_classic: boolean, game_id: string, port : number) {
        return await knex('history_game').insert({
            user_1: user1_id,
            user_2: user2_id,
            score_1: score1,
            score_2: score2,
            is_classic: is_classic,
            created_at: this.globalService.dateGenerator(),
            game_id: game_id,
            port: port
        }).then((res) => {
            return res
        }).catch((err) => {
            console.log("Unable to register match : " + err)
            return { error: err };
        });
    }

    public async UpdateMatch(score_1: Number, score_2: Number, game_id: string) {
        await knex('history_game').where({"game_id": game_id}).update({
            score_1: score_1,
            score_2: score_2
        })
		let game = await knex("history_game").where({ "game_id": game_id }).first();
        if (!game)
            return;
		await this.checkAchievementService.checkScore(game.user_1)
		await this.checkAchievementService.checkScore(game.user_2)
		await this.checkAchievementService.checkConcededScore(game.user_1)
		await this.checkAchievementService.checkConcededScore(game.user_2)
    }

    public async EndMatch(game_id: string)
    {
		await knex('history_game').where({"game_id": game_id}).update({
			end_at: this.globalService.dateGenerator(),
        })
		let game = await knex("history_game").where({ "game_id": game_id }).first();
        if (!game)
            return ;

        if (game.score_1 > game.score_2) {
            await knex("user").where({ "id": game.user_1 }).update({
                "ladder": knex.raw("ladder + 0.5")
            });
            let looser = await knex("user").where({ "id": game.user_2 }).first()
            await knex("user").where({ "id": game.user_2 }).update({
                "ladder": looser.ladder > 0.25 ? looser.ladder - 0.25 : 0.00
            });
        }
        else if (game.score_1 < game.score_2) {
            await knex("user").where({ "id": game.user_2 }).update({
                "ladder": knex.raw("ladder + 0.5")
            });
            let looser = await knex("user").where({ "id": game.user_1 }).first()
            await knex("user").where({ "id": game.user_1 }).update({
                "ladder": looser.ladder > 0.25 ? looser.ladder - 0.25 : 0.00
            });
        }
		await this.checkAchievementService.checkGame(game.user_1)
		await this.checkAchievementService.checkGame(game.user_2)
		await this.checkAchievementService.checkLevel(game.user_1)
		await this.checkAchievementService.checkLevel(game.user_2)
    }
	private compare(matchA, matchB) {
		if (matchA.id < matchB.id)
			return 1;
		else if (matchA.id > matchB.id)
			return -1;
		return 0;
	}

    public async GetMatchesByPlayerId(user_id: number) : Promise<any[]>
    {
        return await knex('history_game').where(function () { this.where('user_1', user_id).orWhere('user_2', user_id) }).andWhereNot('end_at', null).select().then(async (rows) => {
			let matches = [];
			rows.sort(this.compare);
            for (let row of rows) {
                let opponent_id = (row.user_1 == user_id) ? row.user_2 : row.user_1
                let opponent = await knex('user').where('id', opponent_id).first()

                let score = (row.user_1 == user_id) ? row.score_1 : row.score_2
				let score_opponent = (row.user_1 == user_id) ? row.score_2 : row.score_1
                let time = row.end_at - row.created_at
                matches.push({
                    opponent_username: opponent.username,
                    opponent_avatar: await this.globalService.checkAvatarIsInUpload(opponent.avatar),
                    score: score,
                    score_opponent: score_opponent,
					is_classic: row.is_classic,
                    created_at: row.created_at,
					end_at: row.end_at,
                    time: time
                });
            }
            return matches;
        }).catch((err) => {
            return [];
        })
    }

    public async IsInMatch(user_id : number) : Promise<boolean>
    {
        return await knex('history_game').where('user_1', user_id).orWhere('user_2', user_id).select().then(async (rows) => {
            for (let row of rows)
            {
                if (row.end_at == null)
                    return true;
            }
            return false;
        }).catch((err) => {
            console.log(err);
            return false;
        })
    }

    private _matches : PongMatch[] = [];

    public async IsPortUsed(port : number) : Promise<boolean>
    {
        for (let match of this._matches)
        {

            if (match.GetPort() == port)
                return true;
        }
        return await TcpPortUsed.check(port);
    }

    public GetPlayerMatch(id : number) : PongMatch
    {
        for (let i = 0; i < this._matches.length; i++)
        {
            let ids : number [] = this._matches[i].GetIds();
            if (ids[0] == id || ids[1] == id)
                return this._matches[i];
        }
        return null;
    }

    private IsNearObstacle(obstacles : Rectangle[], point : Vector2, threshold : number) : boolean
    {
        for (let i = 0; i < obstacles.length; i++)
        {
            if (Vector2.Distance(obstacles[i].Center(), point) < threshold)
                return true;
        }
        return false;
    }

    private RandomPointInRect(rect : Rectangle) : Vector2
    {
        let p : Vector2 = new Vector2(0, 0);
        p.X = Math.random() * rect.Size.X + rect.Position.X;
        p.Y = Math.random() * rect.Size.Y + rect.Position.Y;
        return p;
    }

    private GenerateObstaclesForRect(obstacles : Rectangle[], rect : Rectangle, count : number, minDist : number, obSize : Vector2) : void
    {
        for(let i = 0; i < count; i++)
        {
            let iter = 0;
            let point = this.RandomPointInRect(rect);
            while(this.IsNearObstacle(obstacles, point, minDist))
            {
                point = this.RandomPointInRect(rect);

                if (iter >= 100)
                    return;
                iter++;
            }

            let newRect = new Rectangle();
            newRect.Position.X = point.X - obSize.X / 2;
            newRect.Position.Y = point.Y - obSize.Y / 2;
            newRect.Size = obSize;
            obstacles.push(newRect);
        }
    }

    private GenerateObstacles(rules : PongRules, countPerRect : number, minDist : number, obSize : Vector2) : void
    {
        let middle = rules.BallRadius * 4;
        let rect1 = new Rectangle();
        rect1.Position.X = rules.WorldSize.X / 4;
        rect1.Position.Y = obSize.Y;
        rect1.Size.X = rules.WorldSize.X / 2;
        rect1.Size.Y = rules.WorldSize.Y / 2 - rect1.Position.Y - middle;

        let rect2 = new Rectangle();
        rect2.Position.X = rules.WorldSize.X / 4;
        rect2.Position.Y = rules.WorldSize.Y / 2 + middle;
        rect2.Size.X = rules.WorldSize.X / 2;
        rect2.Size.Y = rules.WorldSize.Y / 2 - obSize.Y - middle;

        this.GenerateObstaclesForRect(rules.Obstacles, rect1, countPerRect, minDist, obSize);
        this.GenerateObstaclesForRect(rules.Obstacles, rect2, countPerRect, minDist, obSize);
/*
        rules.Obstacles.push(rect1);
        rules.Obstacles.push(rect2);*/
    }

    public async CreateMatchClassic(playerOneId: number, playerTwoId: number) : Promise<PongMatch>
    {
        this.DeleteOldMatches();

        const rules = new PongRules();
        rules.EnableSpectator = true;
        rules.PlayerBarOffset = 10;
        rules.PlayerBarSpeed = 500;
        rules.PlayerBarSize = new Vector2(15, 200);
        rules.WorldSize = new Vector2(1600, 1000);
        rules.PlayerStartPosition = 500;

        rules.EnableObstacles = false;

        rules.BallSpeed = 1350;
        rules.BallRadius = 25;
        rules.BallStartPosition = new Vector2(rules.WorldSize.X / 2, rules.WorldSize.Y / 2);
        rules.EnableSmash = true;
        rules.SmashFactor = 1.5;
        rules.ScoreLimit = 5;

        return await this.CreateMatch(rules, playerOneId, playerTwoId, true);
    }

    public async CreateMatchCustom(playerOneId: number, playerTwoId: number) : Promise<PongMatch>
    {
        this.DeleteOldMatches();

        const rules = new PongRules();
        rules.EnableSpectator = true;
        rules.PlayerBarOffset = 10;
        rules.PlayerBarSpeed = 1000;
        rules.PlayerBarSize = new Vector2(15, 200);
        rules.WorldSize = new Vector2(1600, 1000);
        rules.PlayerStartPosition = 500;

        rules.BallSpeed = 1350;
        rules.BallRadius = 25;
        rules.BallStartPosition = new Vector2(rules.WorldSize.X / 2, rules.WorldSize.Y / 2);

        rules.EnableObstacles = true;
        let obstacleSize = new Vector2(50, 50);
        this.GenerateObstacles(rules, 5, 150, obstacleSize);

        rules.EnableSmash = true;
        rules.SmashFactor = 1.3;
        rules.ScoreLimit = 5;

        return await this.CreateMatch(rules, playerOneId, playerTwoId, false);
    }

    private async CreateMatch(rules : PongRules, id1 : number, id2 : number, isClassic : boolean) : Promise<PongMatch>
    {
        const id = uuidv4();

        let user_1 = await this.globalService.getUserById(id1);
        let user_2 = await this.globalService.getUserById(id2);
        rules.PlayerLeftName = user_1.username;
        rules.PlayerRightName = user_2.username;
        rules.PlayerLeftAvatarURL = await this.globalService.checkAvatarIsInUpload(user_1.avatar);
        rules.PlayerRightAvatarURL = await this.globalService.checkAvatarIsInUpload(user_2.avatar);
        rules.TimeoutNoAllPlayers = 30 * 1000;

        let port = 7200;
        while (await this.IsPortUsed(port))
            port++;
        let match = new PongMatch(id, port, rules, [id1, id2], this);
        await this.RegisterMatch(user_1.id, user_2.id, 0, 0, isClassic, match.GetID(), port);
        this._matches.push(match);
        return match;
    }

    private DeleteOldMatches()
    {
        if (!this._matches)
            return;
        for (let i = this._matches.length - 1; i >= 0; i--)
        {
            if (!this._matches[i].IsRunning())
                this._matches.splice(i, 1);
        }
    }

    public GetMatch(id : string) : PongMatch
    {
        this.DeleteOldMatches();
        for (let i = 0; i < this._matches.length; i++)
        {
            if (this._matches[i].GetID() == id)
                return this._matches[i];
        }
        return null;
    }

    public GetMatches() : PongMatch[]
    {
        this.DeleteOldMatches();
        return this._matches;
    }
}

export class PongMatch
{
    private readonly _id : string;
    private readonly _rules : any;
    private _isRunning : boolean;
    private _worker : Worker;
    private readonly _port : number;
    private readonly _ids : number[];
    private _pongService: PongService;

    constructor(id : string, port : number, rules : any, ids : number[], pongService: PongService)
    {
        this._id = id;
        this._rules = rules;
        this._port = port;
        this._ids = ids;
        this._pongService = pongService;
    }

    public async updateMatch(score_1: number, score_2: number): Promise<void>
    {
        await this._pongService.UpdateMatch(score_1, score_2, this._id)
    }

    public async updateEndGame(): Promise<void>
    {
        await this._pongService.EndMatch(this._id);
    }

    public Start() : void
    {
        if (this._isRunning)
            return;

        this._isRunning = true;
        this._worker = new Worker('./dist/backend/src/pong/pong.worker.js', {
            workerData: {
                port: this._port,
                matchId: this._id,
                rules: this._rules,
                tokens: this._ids
            }
        });

        this._worker.on("message", (event : any) => {
            if (event.type == 'end')
            {
                this._isRunning = false;
                this.updateEndGame();
                this.Stop();
            }
            // else if (event.type == 'print')
            // {
            //     console.log("match:" + this._id + " " + event.msg);
            // }
            else if (event.type == "score")
            {
                this.updateMatch(event.left, event.right);
            }
        });
        this._worker.on("exit", (code : number) => {
            this._isRunning = false;
        });
        this._worker.on("error", (error : string) => {
            this._isRunning = false;
            console.log("Error in match:" + this._id + " , message : " + error);
        });
    }

    public Stop() : void
    {
        if (!this._isRunning)
            return;

        this._isRunning = false;
        this._worker.terminate();
    }

    public IsRunning() : boolean
    {
        return this._isRunning;
    }

    public GetID() : string
    {
        return this._id;
    }

    public GetPort() : number
    {
        return this._port;
    }

    public GetIds() : number[]
    {
        return this._ids;
    }
}