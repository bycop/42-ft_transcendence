import { Physics } from "./physics";
import {Circle, Vector2, Line, Rectangle} from "./math";

export enum PlayerSide
{
    Left,
    Right,
    None
}

export enum Role
{
    Player,
    Spectator,
    None
}

export class Player
{
    public Name : string;
    public Position : number = 400;
    public Score : number;
    public IsConnected : boolean = false;
    public Side : PlayerSide;
}

export enum BarDirection
{
    Up,
    Down
}

export class Spectator
{
    public Name : string
}

export class Ball
{
    public Circle : Circle = new Circle();
    public UnitDirection : Vector2 = new Vector2(0, 0);
    public Speed : number;
}

export class PongRules
{
    public WorldSize : Vector2 = new Vector2(0, 0);

    public ScoreLimit : number;
    public PlayerBarSize : Vector2 = new Vector2(0, 0);
    public PlayerBarSpeed : number; // per second in world units
    public PlayerBarOffset : number;
    public PlayerStartPosition : number;
    public PlayerLeftName: string;
    public PlayerRightName: string;
    public PlayerLeftAvatarURL: string;
    public PlayerRightAvatarURL: string;
    public BallSpeed : number; // per second in world units
    public BallRadius : number;
    public BallStartPosition : Vector2;

    public EnableObstacles : boolean = false;
    public Obstacles : Rectangle[] = [];

    public EnableSpectator : boolean = true;
    public EnableSmash : boolean = true;
    public SmashFactor : number = 1.25;

    public TimeoutNoAllPlayers : number = 60 * 1000; // milli
}


// in seconds
export function ComputeDeltaNow(timestamp : number) : number
{
    return (Date.now() - timestamp) / 1000;
}

export function ComputeDelta(t1 : number, t2 : number) : number
{
    return (t1 - t2) / 1000;
}