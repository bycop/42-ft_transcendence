import {Circle, Line, Rectangle, Vector2} from "./math";

export class Physics
{
    public static PointInRectangleAABB(p : Vector2, rpos : Vector2, rsize : Vector2)
    {
        if (p.X < rpos.X || p.X > rpos.X + rsize.X)
            return false;
        if (p.Y < rpos.Y || p.Y > rpos.Y + rsize.Y)
            return false;
        return true;
    }

    public static CircleIntersectRectangle(pos : Vector2, radius : number, rpos : Vector2, rsize : Vector2) : boolean
    {
        let testX = pos.X;
        let testY = pos.Y;

        if (pos.X < rpos.X) testX = rpos.X; // left
        else if (pos.X > rpos.X + rsize.X) testX = rpos.X + rsize.X; // right
        if (pos.Y < rpos.Y) testY = rpos.Y; // top
        else if (pos.Y > rpos.Y + rsize.Y) testY = rpos.Y + rsize.Y; // bottom

        const distX = pos.X - testX;
        const distY = pos.Y - testY;
        const dist = Math.sqrt((distX*distX) + (distY*distY));
        return dist <= radius;
    }

    public static ReflectDirNormal(dir : Vector2, norm : Vector2) : Vector2
    {
        let dot = Vector2.Dot(dir, norm);
        return new Vector2(dir.X - 2 * dot * norm.X, dir.Y - 2 * dot * norm.Y);
    }

    public static NormalFromLine(p1 : Vector2, p2 : Vector2)
    {
        let dx = (p2.X - p1.X);
        let dy = (p2.Y - p1.Y);
        return new Vector2(-dy, dx);
    }

    public static LineLineIntersect(p1 : Vector2, p2 : Vector2, p3 : Vector2, p4 : Vector2)
    {
        const dX: number = p2.X - p1.Y;
        const dY: number = p2.Y - p1.Y;

        const determinant: number = dX * (p4.Y - p3.Y) - (p4.X - p3.X) * dY;
        if (determinant === 0) return undefined; // parallel lines

        const lambda: number = ((p4.Y - p3.Y) * (p4.X - p1.X) + (p3.X - p4.X) * (p4.Y - p1.Y)) / determinant;
        const gamma: number = ((p1.Y - p2.Y) * (p4.X - p1.X) + dX * (p4.Y - p1.Y)) / determinant;

        if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return undefined;

        return {
            x: p1.X + lambda * dX,
            y: p1.Y + lambda * dY,
        };
    }

    public static CircleRectangleIntersect(circle : Circle, rect : Rectangle) : Line
    {
        if (Physics.CircleLineIntersect(circle, rect.LeftLine()).length != 0)
            return rect.LeftLine();
        if (Physics.CircleLineIntersect(circle, rect.RightLine()).length != 0)
            return rect.RightLine();
        if (Physics.CircleLineIntersect(circle, rect.TopLine()).length != 0)
            return rect.TopLine();
        if (Physics.CircleLineIntersect(circle, rect.BottomLine()).length != 0)
            return rect.BottomLine();
        return null;
    }

    public static CircleLineIntersect(circle : Circle, line : Line) : Vector2[]
    {
        let b, c, d, u1, u2;
        let ret : Vector2[] = [];
        let retP1 : Vector2 = new Vector2(0, 0);
        let retP2 : Vector2 = new Vector2(0, 0);
        let v1 : Vector2 = new Vector2(0, 0);
        let v2 : Vector2 = new Vector2(0, 0);
        v1.X = line.P2.X - line.P1.X;
        v1.Y = line.P2.Y - line.P1.Y;
        v2.X = line.P1.X - circle.Position.X;
        v2.Y = line.P1.Y - circle.Position.Y;
        b = (v1.X * v2.X + v1.Y * v2.Y);
        c = 2 * (v1.X * v1.X + v1.Y * v1.Y);
        b *= -2;
        d = Math.sqrt(b * b - 2 * c * (v2.X * v2.X + v2.Y * v2.Y - circle.Size * circle.Size));
        if(isNaN(d)) return []; // no intercept
        u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
        u2 = (b + d) / c;
        if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
            retP1.X = line.P1.X + v1.X * u1;
            retP1.Y = line.P1.Y + v1.Y * u1;
            ret[0] = retP1;
        }
        if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
            retP2.X = line.P1.X + v1.X * u2;
            retP2.Y = line.P1.Y + v1.Y * u2;
            ret[ret.length] = retP2;
        }
        return ret;
    }
}