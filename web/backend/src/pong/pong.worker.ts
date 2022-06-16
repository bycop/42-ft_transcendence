import {Server, Socket} from "socket.io";
import {parentPort, workerData} from 'worker_threads';
import {
    BarDirection,
    ComputeDeltaNow,
    Player,
    PlayerSide,
    PongRules,
    Role,
    Spectator,
} from "../../../shared/pong/pong";
import {
    AuthRespStatus,
    ClientToServerEvents, EndPacket,
    GamePacket,
    InterServerEvents,
    PausePacket,
    PingPacket,
    PlayPacket,
    ServerToClientEvents,
    SetupPacket
} from "../../../shared/pong/network";
import {PongWorld} from "../../../shared/pong/world";
import {Rectangle} from "../../../shared/pong/math";
import {knex} from "config.knex"


class ServerPlayer extends Player
{
    public Socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    public Id : string;
    public Latency : number;
}

export interface SocketData
{
    Side : PlayerSide;
    Player : ServerPlayer;
}

class ServerSpectator extends Spectator
{
    public Socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}

class PongServer
{
    public Socket : any;

    public PlayerLeft : ServerPlayer = new ServerPlayer();
    public PlayerRight : ServerPlayer = new ServerPlayer();

    public Rules : PongRules;
    public World : PongWorld;

    public Spectators : ServerSpectator[] = [];

    private Running : boolean;

    private PingTime : number;
    private LastGamePacketTime : number = 0;
    private NetworkRate : number;
    private LastUpdate : number = 0;
    private TimeNoAllPlayers = 0;
    private AllPlayers = true;

    public async Start() : Promise<void>
    {
        this.Rules = workerData.rules;
        let obs : Rectangle[] = [];
        for (let i = 0; i < this.Rules.Obstacles.length; i++)
        {
            let r = new Rectangle();
            r.Position = this.Rules.Obstacles[i].Position;
            r.Size = this.Rules.Obstacles[i].Size;
            obs.push(r);
        }
        this.Rules.Obstacles = obs;
        this.World = new PongWorld();
        this.World.Setup(this.Rules);
        this.NetworkRate = 120;
        this.PlayerLeft.Score = 0;
        this.PlayerRight.Score = 0;
        this.PlayerLeft.Side = PlayerSide.Left;
        this.PlayerRight.Side = PlayerSide.Right;
        this.PlayerLeft.Id = workerData.tokens[0];
        this.PlayerRight.Id = workerData.tokens[1];

        this.PlayerLeft.IsConnected = false;
        this.PlayerRight.IsConnected = false;

        this.PlayerLeft.Name = this.Rules.PlayerLeftName;
        this.PlayerRight.Name = this.Rules.PlayerRightName;

        this.World.ResetBall(this.GetRandomBallSideDirection());

        this.Socket = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(workerData.port, {
            cors: {
                origin: '*',
            },
            pingTimeout: 1000,
            pingInterval: 1000,
        });

        this.Socket.on('connection', (socket) => {
            socket.on("ping", (timestamp : number, returned : boolean) => this.OnNetworkPing(socket, timestamp, returned));
            socket.on("disconnect", (reason) => this.OnNetworkDisconnect(socket, reason));
            socket.on("pos", (pos : number) => this.OnNetworkPlayerPos(socket, pos));
            socket.on("authreq", (token : string) => this.OnNetworkAuthReq(socket, token));
            socket.on("bar_start", (timestamp : number, dir : BarDirection) => this.OnNetworkBarStart(socket, timestamp, dir));
            socket.on("bar_stop", (pos : number) => this.OnNetworkBarStop(socket, pos));
        });

        parentPort.on('message', (event : any) => {
            if (event.type == 'stop')
            {
                this.Running = false;
            }
        });

        this.Running = true;
        this.LastUpdate = Date.now();
        this.World.OnScore = (async border => {
            if (!this.World.IsPlaying)
                return;

            this.Pause();
            if (border == this.World.LeftBorder) {
                this.PlayerRight.Score++;
                this.World.ResetBall(PlayerSide.Left);
            } else {
                this.PlayerLeft.Score++;
                this.World.ResetBall(PlayerSide.Right);
            }

            this.Score(this.PlayerLeft.Score, this.PlayerRight.Score);


            this.World.IsPlaying = false;

            if (this.PlayerLeft.Score >= this.Rules.ScoreLimit) {
                await this.End(PlayerSide.Left);
                return;
            } else if (this.PlayerRight.Score >= this.Rules.ScoreLimit) {
                await this.End(PlayerSide.Right);
                return;
            }

            setTimeout(() => {
                this.Play();
            }, 3000);
        });
        this.TimeNoAllPlayers = Date.now();
        this.AllPlayers = false;
        await this.Update();
    }

    public async Update() : Promise<void>
    {
        if (!this.Running)
            return;

        let now = Date.now();

        if (!this.PlayerLeft.IsConnected || !this.PlayerRight.IsConnected)
        {
            if (this.AllPlayers)
            {
                this.TimeNoAllPlayers = now;
                this.Print("Waiting for players !");
            }
            this.AllPlayers = false;

            if (now - this.TimeNoAllPlayers > this.Rules.TimeoutNoAllPlayers)
            {
                this.Print("No players, shutting down server !");
                parentPort.postMessage({type: "end"});
                let match = await knex('history_game').where({"game_id": workerData.matchId}).select();
                await knex('history_game').where({"game_id": workerData.matchId}).update({
                    end_at: match[0].created_at,
                })
                this.Stop();
                return;
            }
        }
        else
            this.AllPlayers = true;

        let delta = ComputeDeltaNow(this.LastUpdate); // milli to seconds
        this.LastUpdate = now;

        await this.World.Update(delta);

        if (Date.now() - this.PingTime > 1000)
        {
            this.PingTime = Date.now();
            this.SendToAll("ping", this.BuildPing());
            this.SendToAll("setup", this.BuildSetupPacket());
        }
        if (Date.now() - this.LastGamePacketTime > 1000/this.NetworkRate)
        {
            this.LastGamePacketTime = Date.now();
            this.SendToAll("game", this.BuildGamePacket())
        }

        setTimeout(() => {this.Update()}, 1000/60);
    }

    public Play() : void
    {
        if (!this.AllPlayers)
            return;
        this.Print("Play party !");
        this.SendToAll("play", this.BuildPlayPacket());
        this.World.IsPlaying = true;
    }

    public Pause() : void
    {
        this.Print("Pausing party !")
        this.SendToAll("pause", this.BuildPausePacket());
        this.World.IsPlaying = false;
    }

    public Stop() : void
    {
        if (this.Socket)
            this.Socket.close();
        process.exit(0);
    }

    public GetRandomBallSideDirection() : PlayerSide
    {
        let side : PlayerSide;
        let rnd = Math.random();
        if (rnd < 0.5)
            side = PlayerSide.Left;
        else
            side = PlayerSide.Right;
        return side;
    }

    public OnNetworkBarStart(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, timestamp : number, dir : BarDirection) : void
    {
        if (socket.data.Side == undefined)
            return;

        let delta = ComputeDeltaNow(timestamp);
        let mov = this.Rules.PlayerBarSpeed * delta; // compute real pos using latency
        this.World.SetPlayerPosition(
            socket.data.Side,
            this.World.GetPlayerPosition(socket.data.Side) + (dir == BarDirection.Up ? -mov : mov)
        );
        this.World.PlayerStartMoving(socket.data.Side, dir);
    }

    public OnNetworkBarStop(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, pos : number) : void
    {
        if (socket.data.Side == undefined)
            return;

        this.World.PlayerStopMoving(socket.data.Side);
        this.World.SetPlayerPosition(
            socket.data.Side,
            pos
        );
    }

    public OnNetworkPlayerPos(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, pos) : void
    {
        if (socket.data.Side == PlayerSide.Left)
            this.World.PlayerLeftPos = pos;
        if (socket.data.Side == PlayerSide.Right)
            this.World.PlayerRightPos = pos;
    }

    public async OnNetworkAuthReq(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, token : string) : Promise<void>
    {
        let session = await knex('session').where({sid: token}).first();
        let user_id = session.user_id;

        if (this.PlayerLeft.Id == user_id || this.PlayerRight.Id == user_id)
        {
            let player: ServerPlayer;
            if (this.PlayerLeft.Id == user_id)
                player = this.PlayerLeft;
            else if (this.PlayerRight.Id == user_id)
                player = this.PlayerRight;

            socket.data.Side = player.Side;
            player.IsConnected = true;
            player.Socket = socket;
            socket.data.Player = player;

            this.Print(player.Name + " Connected as player !");

            socket.emit("authresp", AuthRespStatus.Successful, Role.Player, player.Side);
            this.SendToAll("setup", this.BuildSetupPacket());
            if (this.PlayerLeft.IsConnected && this.PlayerRight.IsConnected)
            {
                setTimeout(() => {
                    this.Play();
                }, 3000);
            }
            return;
        }

        if (this.Rules.EnableSpectator)
        {
            let spec = new ServerSpectator();
            spec.Socket = socket;
            spec.Name = ""; // TODO: get name
            this.Spectators.push(spec);
            this.Print(spec.Name + " Connected as spectator !");
            socket.emit("authresp", AuthRespStatus.Successful, Role.Spectator, null);
            socket.emit("setup", this.BuildSetupPacket());
            return;
        }

        this.Print(this.PlayerLeft.Id);
        this.Print(this.PlayerRight.Id);

        this.Print("Unable to authenticate client !");
        socket.emit("authresp", AuthRespStatus.Failed, null, null);
        socket.disconnect();
    }

    public OnNetworkDisconnect(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, reason) : void
    {
        if (socket.data.Side == null) // is spectator
        {
            for (let i = 0; i < this.Spectators.length; i++)
            {
                if (socket == this.Spectators[i].Socket)
                {
                    this.Spectators.splice(i, 1);
                    return;
                }
            }
            return;
        }

        this.Pause();
        let player = this.GetPlayer(socket.data.Side);
        player.IsConnected = false;
        player.Socket = null;
        this.Print(player.Name + " Disconnected !");
        this.SendToAll("setup", this.BuildSetupPacket());
    }

    public OnNetworkPing(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, timestamp : number, returned : boolean) : void
    {
        if (returned)
        {
            let player = this.GetPlayer(socket.data.Side);
            player.Latency = (Date.now() - timestamp);
            if (player.Latency > 100)
                this.Print("High ping ! " + player.Name + " " + player.Latency + " ms");
        }
        else
        {
            this.SendPingTo(socket);
        }
    }

    public GetPlayer(side : PlayerSide) : ServerPlayer
    {
        if (side == PlayerSide.Left)
            return this.PlayerLeft;
        return this.PlayerRight;
    }

    public BuildPlayPacket() : PlayPacket
    {
        let play : PlayPacket = new PlayPacket();
        play.BallDirection = this.World.Ball.UnitDirection;
        return play;
    }

    public BuildPausePacket() : PausePacket
    {
        let pause : PausePacket = new PausePacket();
        pause.Position = this.World.Ball.Circle.Position;
        return pause;
    }

    public BuildSetupPacket() : SetupPacket
    {
        let setup : SetupPacket = new SetupPacket();
        setup.Rules = this.Rules;

        setup.PlayerLeft = new Player();
        setup.PlayerLeft.IsConnected = this.PlayerLeft.IsConnected;
        setup.PlayerLeft.Position = this.World.PlayerLeftPos;
        setup.PlayerLeft.Side = this.PlayerLeft.Side;
        setup.PlayerLeft.Score = this.PlayerLeft.Score;
        setup.PlayerRight = new Player();
        setup.PlayerRight.IsConnected = this.PlayerRight.IsConnected;
        setup.PlayerRight.Position = this.World.PlayerRightPos;
        setup.PlayerRight.Side = this.PlayerRight.Side;
        setup.PlayerRight.Score = this.PlayerRight.Score;
        return setup;
    }

    public BuildGamePacket() : GamePacket
    {
        let game : GamePacket = new GamePacket();
        game.Timestamp = Date.now();
        game.BallPosition = this.World.Ball.Circle.Position;
        game.BallDirection = this.World.Ball.UnitDirection;
        game.PlayerLeftPosition = this.World.PlayerLeftPos;
        game.PlayerRightPosition = this.World.PlayerRightPos;
        game.BallSpeed = this.World.Ball.Speed;
        game.PlayerRightScore = this.PlayerRight.Score;
        game.PlayerLeftScore = this.PlayerLeft.Score;
        return game;
    }

    public SendSetupTo(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) : void
    {
        socket.emit("setup", this.BuildSetupPacket());
    }

    public BuildPing() : PingPacket
    {
        let ping : PingPacket = new PingPacket();
        ping.Timestamp = Date.now();
        return ping;
    }

    public SendPingTo(socket : Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) : void
    {
        socket.emit("ping", this.BuildPing());
    }

    private SendToPlayers(event : any, packet : any) : void
    {
        if (this.PlayerLeft.IsConnected)
            this.PlayerLeft.Socket.emit(event, packet);
        if (this.PlayerRight.IsConnected)
            this.PlayerRight.Socket.emit(event, packet);
    }

    private SendToAll(event : any, packet : any) : void
    {
        if (this.PlayerLeft.IsConnected && this.PlayerLeft.Socket)
            this.PlayerLeft.Socket.emit(event, packet);
        if (this.PlayerRight.IsConnected && this.PlayerRight.Socket)
            this.PlayerRight.Socket.emit(event, packet);
        for (let spectator of this.Spectators)
        {
            spectator.Socket.emit(event, packet);
        }
    }

    public Print(msg : string)
    {
        parentPort.postMessage({type: "print", msg: msg});
    }

    public Score(left : number, right : number) : void
    {
        parentPort.postMessage({type: "score", left: left, right: right});
    }

    public async End(side: PlayerSide) : Promise<void>
    {
        this.Running = false;

        let end: EndPacket = new EndPacket();
        end.Side = side;
        end.ScoreLeft = this.PlayerLeft.Score;
        end.ScoreRight = this.PlayerRight.Score;
        this.SendToAll("end", end);
        await parentPort.postMessage({type: "end"});
        setTimeout(() => this.Stop(), 3000);
    }
}

let pserver : PongServer = new PongServer();
pserver.Start();