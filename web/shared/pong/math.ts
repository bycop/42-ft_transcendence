export class Vector2
{
    public X : number = 0;
    public Y : number = 0;

    constructor(x : number, y : number)
    {
        this.X = x;
        this.Y = y;
    }

    public static Add(v1 : Vector2, v2 : Vector2)
    {
        return new Vector2(v1.X + v2.X, v1.Y + v2.Y);
    }

    public static AddNumber(v1 : number, v2 : Vector2)
    {
        return new Vector2(v1 + v2.X, v1 + v2.Y);
    }

    public static Mult(v1 : Vector2, v2 : Vector2)
    {
        return new Vector2(v1.X * v2.X, v1.Y * v2.Y);
    }

    public static MultNumber(v1 : number, v2 : Vector2)
    {
        return new Vector2(v1 * v2.X, v1 * v2.Y);
    }

    public static Sub(v1 : Vector2, v2 : Vector2)
    {
        return new Vector2(v1.X - v2.X, v1.Y - v2.Y);
    }

    public static SubNumber(v1 : number, v2 : Vector2)
    {
        return new Vector2(v1 - v2.X, v1 - v2.Y);
    }

    public static Div(v1 : Vector2, v2 : Vector2)
    {
        return new Vector2(v1.X / v2.X, v1.Y / v2.Y);
    }

    public static Dot(v1 : Vector2, v2 : Vector2) : number
    {
        return v1.X * v2.X + v1.Y * v2.Y;
    }

    public static Distance(v1 : Vector2, v2 : Vector2) : number
    {
        const a = v1.X - v2.X;
        const b = v1.Y - v2.Y;
        return Math.sqrt(a * a + b * b);
    }

    public static Lerp(v1 : Vector2, v2 : Vector2, value : number) : Vector2
    {
        return new Vector2(Lerp(v1.X, v2.X, value), Lerp(v1.Y, v2.Y, value));
    }

    public Normalize() : void
    {
        let l = this.Length();
        this.X /= l;
        this.Y /= l;
    }

    public Normalized() : Vector2
    {
        let l = this.Length();
        return new Vector2(this.X /= l, this.Y /= l);
    }

    public Length() : number
    {
        return Math.sqrt(Vector2.Dot(this, this));
    }

    public ToString() : string
    {
        return "Vector2( " + this.X + " ; " + this.Y + " )";
    }
}

export class Rectangle
{
    public Position : Vector2 = new Vector2(0, 0);
    public Size : Vector2 = new Vector2(0, 0);

    public LeftBottom()
    {
        return new Vector2(this.Position.X, this.Position.Y + this.Size.Y);
    }

    public RightBottom()
    {
        return new Vector2(this.Position.X + this.Size.X, this.Position.Y + this.Size.Y);
    }

    public RightTop()
    {
        return new Vector2(this.Position.X + this.Size.X, this.Position.Y);
    }

    public LeftTop()
    {
        return new Vector2(this.Position.X, this.Position.Y);
    }

    public Center()
    {
        return new Vector2(this.Position.X + this.Size.X / 2, this.Position.Y + this.Size.Y / 2);
    }

    public LeftLine() : Line
    {
        let l = new Line();
        l.P1 = this.LeftBottom();
        l.P2 = this.LeftTop();
        return l;
    }

    public TopLine() : Line
    {
        let l = new Line();
        l.P1 = this.LeftTop();
        l.P2 = this.RightTop();
        return l;
    }

    public BottomLine() : Line
    {
        let l = new Line();
        l.P1 = this.LeftBottom();
        l.P2 = this.RightBottom();
        return l;
    }

    public RightLine() : Line
    {
        let l = new Line();
        l.P1 = this.RightTop();
        l.P2 = this.RightBottom();
        return l;
    }
}

export class Circle
{
    public Position : Vector2 = new Vector2(0, 0);
    public Size : number = 0;
}

export class Line
{
    public P1 : Vector2 = new Vector2(0, 0);
    public P2 : Vector2 = new Vector2(0, 0);
}

export function Clamp(value : number, min : number, max : number) : number
{
    return Math.min(Math.max(value, min), max);
}

export function Lerp(start : number, end : number, value : number)
{
    return (1-value)*start+value*end
}

export function Distance(x1 : number, x2 : number) : number
{
    return Math.abs(x1 - x2);
}