import {Player, PongRules, Ball, Role, PlayerSide, BarDirection} from "./pong";
import {Vector2} from "./math";

export class PingPacket
{
    public Timestamp : number;
    public Returned : boolean;
}

export class SetupPacket
{
    public Rules : PongRules;
    public PlayerLeft : Player;
    public PlayerRight : Player;
}

export class GamePacket
{
    public Timestamp : number;
    public PlayerLeftPosition : number;
    public PlayerRightPosition : number;
    public BallPosition : Vector2 = new Vector2(0, 0);
    public BallDirection : Vector2;
    public BallSpeed : number;
    public PlayerLeftScore : number = 0;
    public PlayerRightScore : number = 0;
}

export enum AuthRespStatus
{
    Successful,
    Failed
}

export class PlayPacket
{
    public Timestamp : number;
    public BallDirection : Vector2;
}

export class PausePacket
{
    public Position : Vector2;
}

export class EndPacket
{
    public Side : PlayerSide;
    public ScoreLeft : number;
    public ScoreRight : number;
}

export interface ServerToClientEvents
{
    ping: (ping : PingPacket) => void;
    setup: (setup : SetupPacket) => void;
    authresp: (status : AuthRespStatus, role : Role, side : PlayerSide) => void;
    game: (game : GamePacket) => void;
    play: (play : PlayPacket) => void;
    pause: (pause : PausePacket) => void;
    end: (end : EndPacket) => void;
}

export interface ClientToServerEvents
{
    authreq: (token : string) => void;
    ping: (ping : PingPacket) => void;
    pos: (pos : number) => void;
    bar_start: (timestamp : number, dir : BarDirection) => void;
    bar_stop: (pos : number) => void;
}

export interface InterServerEvents
{

}