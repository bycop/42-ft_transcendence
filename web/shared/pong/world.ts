import {Circle, Clamp, Distance, Line, Rectangle, Vector2} from "./math";
import {Physics} from "./physics";
import {Ball, BarDirection, PlayerSide, PongRules} from "./pong";

export class PongWorld
{
    public SetupDone : boolean = false;
    public IsPlaying : boolean = false;
    public IsSlave : boolean = false;
    public Size : Vector2 = new Vector2(0, 0);
    public Rules : PongRules;

    public PlayerLeftPos : number;
    public PlayerLeftName : string;
    public PlayerLeftIsMoving : boolean;
    public PlayerLeftDirection : BarDirection;
    public PlayerLeftVisible : boolean;

    public PlayerRightPos : number;
    public PlayerRightName : string;
    public PlayerRightIsMoving : boolean;
    public PlayerRightDirection : BarDirection;
    public PlayerRightVisible : boolean;

    public Ball : Ball = new Ball();

    public Bounds : Rectangle = new Rectangle();
    public TopLeft : Vector2 = new Vector2(0,0);
    public TopRight : Vector2 = new Vector2(0,0);
    public BottomRight : Vector2 = new Vector2(0,0);
    public BottomLeft : Vector2 = new Vector2(0,0);

    public LeftBorder : Line = new Line();
    public RightBorder : Line = new Line();
    public TopBorder : Line = new Line();
    public BottomBorder : Line = new Line();

    public Borders : Line[] = [];

    public Obstacles : Rectangle[] = [];
    public LastObstacleIndex : number = -1;

    public OnScore : (border: Line) => Promise<void>;

    public Setup(rules : PongRules) : void
    {
        this.Rules = rules;
        this.Size = rules.WorldSize;
        this.Bounds.Position = new Vector2(0,0);
        this.Bounds.Size = this.Size;

        this.TopRight = new Vector2(this.Size.X, 0);
        this.TopLeft = new Vector2(0, 0);
        this.BottomLeft = new Vector2(0, this.Size.Y);
        this.BottomRight = new Vector2(this.Size.X, this.Size.Y);

        this.LeftBorder.P1 = this.TopLeft;
        this.LeftBorder.P2 = this.BottomLeft;
        this.Borders.push(this.LeftBorder);

        this.RightBorder.P1 = this.TopRight;
        this.RightBorder.P2 = this.BottomRight;
        this.Borders.push(this.RightBorder);

        this.TopBorder.P1 = this.TopLeft;
        this.TopBorder.P2 = this.TopRight;
        this.Borders.push(this.TopBorder);

        this.BottomBorder.P1 = this.BottomLeft;
        this.BottomBorder.P2 = this.BottomRight;
        this.Borders.push(this.BottomBorder);

        if (rules.EnableObstacles)
            this.Obstacles = rules.Obstacles;

        if (!this.SetupDone)
        {
            this.ResetBall(PlayerSide.Right);

            this.PlayerRightPos = rules.PlayerStartPosition;
            this.PlayerLeftPos = rules.PlayerStartPosition;

            this.SetupDone = true;
        }
    }

    public ResetBall(side : PlayerSide)
    {
        if (side == PlayerSide.Left)
            this.Ball.UnitDirection = new Vector2(-1, 0);
        else if (side == PlayerSide.Right)
            this.Ball.UnitDirection = new Vector2(1, 0);
        this.Ball.Circle.Position = this.Rules.BallStartPosition;
        this.Ball.Circle.Size = this.Rules.BallRadius;
        this.Ball.Speed = this.Rules.BallSpeed;
    }

    public Start() : void
    {
        this.IsPlaying = true;
    }

    public Stop() : void
    {
        this.IsPlaying = false;
    }

    public async CheckGoalCollisions(position : Vector2) : Promise<boolean>
    {
        let circle : Circle = new Circle();
        circle.Position = position;
        circle.Size = this.Ball.Circle.Size;

        for (let border of this.Borders)
        {
            if (Physics.CircleLineIntersect(circle, border).length != 0 && (border == this.LeftBorder || border == this.RightBorder))
            {
                await this.OnScore(border);
                return true;
            }
        }

        return false;
    }

    public async CheckBorderCollisions(position : Vector2) : Promise<boolean>
    {
        let circle : Circle = new Circle();
        circle.Position = position;
        circle.Size = this.Ball.Circle.Size;

        for (let border of this.Borders)
        {
            if (Physics.CircleLineIntersect(circle, border).length != 0)
            {
                this.CollideLine(circle, border);
                return true;
            }
        }

        return false;
    }

    public CollideLine(circle : Circle, line : Line) : void
    {
        let n = Physics.NormalFromLine(line.P1, line.P2);
        n.Normalize();

        // Find the nearest non colliding position toward the border
        while (Physics.CircleLineIntersect(circle, line).length != 0)
            circle.Position = Vector2.Sub(circle.Position, this.Ball.UnitDirection);

        this.Ball.Circle.Position = circle.Position;
        this.Ball.UnitDirection = Physics.ReflectDirNormal(this.Ball.UnitDirection, n);
    }

    public CheckBarCollision(line : Line, circle : Circle, side : PlayerSide) : boolean
    {
        if (Physics.CircleLineIntersect(circle, line).length != 0)
        {
            let miny = line.P1.Y < line.P2.Y ? line.P1.Y : line.P2.Y;
            let maxy = line.P1.Y > line.P2.Y ? line.P1.Y : line.P2.Y;
            let ballynorm = (circle.Position.Y - miny) / (maxy - miny) * 2 - 1; // -1 1
            if (ballynorm < 0.2 && ballynorm > -0.2 && this.Rules.EnableSmash)
                this.Ball.Speed = this.Rules.BallSpeed * this.Rules.SmashFactor;
            else
                this.Ball.Speed = this.Rules.BallSpeed;
            ballynorm = Clamp(ballynorm, -0.5, 0.5);
            let xnorm = Math.abs(ballynorm);
            while (Physics.CircleLineIntersect(circle, line).length != 0)
                circle.Position = Vector2.Sub(circle.Position, this.Ball.UnitDirection);


            this.Ball.UnitDirection.Y = ballynorm;
            if (side == PlayerSide.Left)
                this.Ball.UnitDirection.X = 1 - xnorm;
            else
                this.Ball.UnitDirection.X = (1 - xnorm) * -1;
            this.Ball.Circle.Position = circle.Position;
            return true;
        }
        return false;
    }

    public CheckPlayerBarCollisions(position : Vector2) : boolean
    {
        let circle : Circle = new Circle();
        circle.Position = position;
        circle.Size = this.Ball.Circle.Size;

        if (this.CheckBarCollision(this.GetPlayerBarLine(PlayerSide.Left), circle, PlayerSide.Left))
        {
            this.LastObstacleIndex = -1;
            return true;
        }

        if (this.CheckBarCollision(this.GetPlayerBarLine(PlayerSide.Right), circle, PlayerSide.Right))
        {
            this.LastObstacleIndex = -1;
            return true;
        }
        return false;
    }

    public CheckObstacleCollisions(position : Vector2) : boolean
    {
        let circle : Circle = new Circle();
        circle.Position = position;
        circle.Size = this.Ball.Circle.Size;

        let line;
        for (let i = 0; i < this.Obstacles.length; i++)
        {
            if ((line = Physics.CircleRectangleIntersect(circle, this.Obstacles[i])) != null && i != this.LastObstacleIndex)
            {
                this.LastObstacleIndex = i;
                this.CollideLine(circle, line);
                return true;
            }
        }

        return false;
    }

    public async UpdatePhysics(delta : number) : Promise<void>
    {
        let finalpos : Vector2 = Vector2.Add(
            Vector2.MultNumber(delta, Vector2.MultNumber(this.Ball.Speed, this.Ball.UnitDirection)),
            this.Ball.Circle.Position
        );

        let speed = delta * this.Ball.Speed;
        let iter = speed / this.Rules.BallRadius / 20;

        let iterpos = this.Ball.Circle.Position;
        let i = 0;
        let ret = false;
        while (i < iter) {
            iterpos = Vector2.Add(
                Vector2.MultNumber(iter, this.Ball.UnitDirection),
                iterpos
            );

            let playerPos = this.GetNearestPlayerPosition(iterpos);
            if (Distance(playerPos, iterpos.Y) > this.Rules.PlayerBarSize.Y / 2 + this.Rules.BallRadius)
                ret = await this.CheckGoalCollisions(iterpos) || this.CheckPlayerBarCollisions(iterpos) || await this.CheckBorderCollisions(iterpos) || this.CheckObstacleCollisions(iterpos);
            else
                ret = this.CheckPlayerBarCollisions(iterpos) || await this.CheckGoalCollisions(iterpos) || await this.CheckBorderCollisions(iterpos) || this.CheckObstacleCollisions(iterpos);
            i++;
        }
        if(ret)
            return;
        this.Ball.Circle.Position = finalpos;
    }

    public async Update(delta : number) : Promise<void>
    {
        if (!this.IsSlave)
        {
            this.UpdatePlayerMovement(delta);
            this.PlayerLeftPos = Clamp(this.PlayerLeftPos, this.Rules.PlayerBarSize.Y / 2, this.Rules.WorldSize.Y - this.Rules.PlayerBarSize.Y / 2);
            this.PlayerRightPos = Clamp(this.PlayerRightPos, this.Rules.PlayerBarSize.Y / 2, this.Rules.WorldSize.Y - this.Rules.PlayerBarSize.Y / 2);
            if (this.IsPlaying)
                await this.UpdatePhysics(delta);
        }
    }

    public GetNearestPlayerPosition(pos : Vector2) : number
    {
        if (pos.X < this.Size.X / 2)
            return this.PlayerLeftPos;
        return this.PlayerRightPos;
    }

    public UpdatePlayerMovement(delta : number) : void
    {
        let mov = this.Rules.PlayerBarSpeed * delta;
        if (this.PlayerLeftIsMoving)
        {
            this.SetPlayerPosition(
                PlayerSide.Left,
                this.GetPlayerPosition(PlayerSide.Left) + (this.PlayerLeftDirection == BarDirection.Up ? -mov : mov)
            )
        }

        if (this.PlayerRightIsMoving)
        {
            this.SetPlayerPosition(
                PlayerSide.Right,
                this.GetPlayerPosition(PlayerSide.Right) + (this.PlayerRightDirection == BarDirection.Up ? -mov : mov)
            )
        }
    }

    public SetPlayerPosition(side : PlayerSide, pos : number) : void
    {
        if (side == PlayerSide.Left)
            this.PlayerLeftPos = pos;
        else
            this.PlayerRightPos = pos;

        if (this.GetPlayerPosition(side) > this.Rules.WorldSize.Y - this.Rules.PlayerBarSize.Y / 2)
            this.SetPlayerPosition(side, this.Rules.WorldSize.Y - this.Rules.PlayerBarSize.Y / 2);
        if (this.GetPlayerPosition(side) < this.Rules.PlayerBarSize.Y / 2)
            this.SetPlayerPosition(side, this.Rules.PlayerBarSize.Y / 2);
    }

    public GetPlayerPosition(side : PlayerSide) : number
    {
        if (side == PlayerSide.Left)
            return this.PlayerLeftPos;
        else
            return this.PlayerRightPos;
    }

    public PlayerStartMoving(side : PlayerSide, dir : BarDirection)
    {
        if (side == PlayerSide.Left)
        {
            this.PlayerLeftDirection = dir;
            this.PlayerLeftIsMoving = true;
        }
        else if (side == PlayerSide.Right)
        {
            this.PlayerRightDirection = dir;
            this.PlayerRightIsMoving = true;
        }
    }

    public PlayerStopMoving(side : PlayerSide)
    {
        if (side == PlayerSide.Left)
        {
            this.PlayerLeftIsMoving = false;
        }
        else if (side == PlayerSide.Right)
        {
            this.PlayerRightIsMoving = false;
        }
    }

    public GetPlayerBarLine(side : PlayerSide) : Line
    {
        let line : Line = new Line();
        let x = 0;
        if(side == PlayerSide.Left)
        {
            let x = this.Rules.PlayerBarSize.X + 10;
            line.P1 = new Vector2(x, this.PlayerLeftPos - this.Rules.PlayerBarSize.Y / 2);
            line.P2 = new Vector2(x, this.PlayerLeftPos + this.Rules.PlayerBarSize.Y / 2);
        }
        else
        {
            let x = this.Size.X - this.Rules.PlayerBarSize.X - 10;
            line.P2 = new Vector2(x, this.PlayerRightPos - this.Rules.PlayerBarSize.Y / 2);
            line.P1 = new Vector2(x, this.PlayerRightPos + this.Rules.PlayerBarSize.Y / 2);
        }

        return line;
    }
}