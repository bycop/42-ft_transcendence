<template>
  <div class="flex flex-col items-center justify-center h-screen pt-20 bg-primary" id="PongAllScreen">
    <!--  HEADER  -->
    <div class="flex justify-between mb-5 mt-20" ref="header" v-if="this.GetWinner() === null" >
      <div class="flex items-center">
        <Avatar :avatarLink="this.GetPlayerAvatar()[0]"  size="8" />
        <p class="text-white ml-4">{{this.GetPlayerNames()[0] + ""}}</p>
      </div>
      <div class="seven-segment text-white text-3xl"> {{ this.GetScore()[0] + ""}} - {{ this.GetScore()[1] + ""}}</div>
      <div class="flex items-center">
        <p class="text-white mr-4">{{this.GetPlayerNames()[1] + ""}}</p>
        <Avatar :avatarLink="this.GetPlayerAvatar()[1]"  size="8" />
      </div>
    </div>
    <div id="PongWrapper" ref="wrapper" class="mt-0" v-if="this.GetWinner() === null" >
      <canvas id ="pong-canvas" ref="canvas"></canvas>
    </div>
    <PopupGameEnd v-else :winner="this.GetWinner()" :players="[
		{
			name: this.GetPlayerNames()[0],
			avatar: this.GetPlayerAvatar()[0]
		},
		{
			name: this.GetPlayerNames()[1],
			avatar: this.GetPlayerAvatar()[1]
		}]"
		:score="this.GetScore()" :game="this.IsClassic()" :role="this.getRole()"></PopupGameEnd>
  </div>
</template>


<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {io, Socket} from "socket.io-client";
import {
  BarDirection,
  ComputeDelta,
  ComputeDeltaNow,
  Player,
  PlayerSide,
  PongRules,
  Role,
} from "../../../../shared/pong/pong";
import {Ref} from "vue-property-decorator";
import Avatar from "@/components/utilities/Avatar.vue";
import PopupGameEnd from "@/components/pong/PopupGameEnd.vue"
import {
  AuthRespStatus,
  ClientToServerEvents,
  EndPacket,
  GamePacket,
  PausePacket,
  PingPacket,
  PlayPacket,
  ServerToClientEvents,
  SetupPacket
} from "../../../../shared/pong/network";
import {PongWorld} from "../../../../shared/pong/world";
import {Distance, Lerp, Vector2} from "../../../../shared/pong/math";
import axios from 'axios';

@Options({
  name: "PongGame",
  components: {
    Avatar,
    PopupGameEnd
  }
})
export default class PongGame extends Vue
{
  public Winner : PlayerSide = null;
  public Graphics : Graphics = new Graphics();
  public Socket : Socket<ServerToClientEvents, ClientToServerEvents> = null;

  public Game : GamePacket = new GamePacket();
  public World : PongWorld;
  public Rules : PongRules = null;
  public LocalRole : Role = Role.None;
  public LocalSide : PlayerSide = PlayerSide.None;
  public Camera : Camera = new Camera();
  public Latency : number;

  IsMovingDown : boolean = false;
  IsMovingUp : boolean = false;

  public LastSecond : number;
  public UPS : number;
  public UPSCount : number;

  public LastUpdate : number = 0;

  public IsServerless : boolean = false;

  public IsRunning : boolean = false;

  @Ref("canvas") readonly canvas! : HTMLCanvasElement & Node;
  @Ref("wrapper") readonly wrapper! : HTMLDivElement & Node;
  @Ref("header") readonly header! : HTMLDivElement & Node;

  Connect(port : number) : void
  {
    const socket = io("ws://" + this.$store.state.BASE_URL + ":" + port, {
      reconnection: false
    });
    this.Socket = socket;

	if (socket)
		return ;
    socket.on("connect", () => {
      socket.emit("authreq", (this as any).$cookies.get("session_id"));
    });

    socket.on("connect_error", () => {
      if (this.Winner != null)
        return;
	  if (this.$route.path == '/pong-game')
		this.$router.push({
			name: "home"
		})
    });

    socket.on("disconnect", () => {
      if (this.Winner != null)
        return;
	  if (this.$route.path == '/pong-game')
		this.$router.push({
			name: "home"
		})
    });

    socket.on("error", () => {
      if (this.Winner != null)
        return;
	  if (this.$route.path == '/pong-game')
		this.$router.push({
			name: "home"
		})
    });

    socket.on("ping", (ping : PingPacket) => {
      if (!ping.Returned)
        socket.emit("ping", ping.Timestamp, true);
      else
      {
        this.Latency = (Date.now() - ping.Timestamp);
      }
    });

    socket.on("authresp", (status : AuthRespStatus, role : Role, side : PlayerSide) => {
      if(status == AuthRespStatus.Failed)
      {
        console.log("Unable to authenticate, refused by server !");
        return;
      }

      // is player or spectator
      this.LocalRole = role;
      this.LocalSide = side;
    });

    socket.on("game", (game : GamePacket) => {
      if (this.Game.Timestamp > game.Timestamp)
      {
        return;
      }
      this.Game = game;
    });

    socket.on("setup", (setup : SetupPacket) => {
      this.OnNetworkSetup(setup);
    });

    socket.on("play", (play : PlayPacket) => {
      this.World.IsPlaying = true;
      this.World.Ball.UnitDirection = play.BallDirection;
      /*let delta = ComputeDeltaNow(play.Timestamp);
      this.World.Ball.Circle.Position = Vector2.Add(Vector2.MultNumber(this.Rules.BallSpeed * delta, this.World.Ball.UnitDirection), this.World.Ball.Circle.Position);
      */
    });

    socket.on("pause", (pause : PausePacket) => {
      this.World.IsPlaying = false;
      this.World.Ball.Circle.Position = pause.Position;
    });

    socket.on("end", (end : EndPacket) => {
      this.Winner = end.Side;
      this.Game.PlayerLeftScore = end.ScoreLeft;
      this.Game.PlayerRightScore = end.ScoreRight;
    });
  }

  OnNetworkSetup(setup : SetupPacket)
  {
    if (this.LocalRole == Role.None)
      return;

    this.Rules = setup.Rules;
    this.World.Setup(this.Rules);
    this.World.PlayerLeftPos = setup.PlayerLeft.Position;
    this.World.PlayerLeftName = setup.PlayerLeft.Name;
    this.World.PlayerRightPos = setup.PlayerRight.Position;
    this.World.PlayerRightName = setup.PlayerRight.Name;
    this.Game.BallDirection = this.World.Ball.UnitDirection;
    this.Game.BallPosition = this.World.Ball.Circle.Position;
    this.World.Ball.Circle.Size = setup.Rules.BallRadius;

    this.World.PlayerLeftVisible = setup.PlayerLeft.IsConnected;
    this.World.PlayerRightVisible = setup.PlayerRight.IsConnected;
  }

  Update(timestamp : any)
  {
    if (this.Winner != undefined || !this.IsRunning)
      return;

    let delta = ComputeDelta(timestamp, this.LastUpdate);
    this.LastUpdate = timestamp;

    if (Date.now() - this.LastSecond > 1000)
    {
      this.UPS = this.UPSCount;
      this.UPSCount = 0;
      this.LastSecond = Date.now();
    }
    this.UPSCount++;

    if (this.Rules == null)
    {
      window.requestAnimationFrame(this.Update);
      return;
    }
    let w, h;
    let ratio;

    let parent = this.canvas.parentElement;
    if (parent.clientWidth < parent.clientHeight)
    {
      ratio = this.Rules.WorldSize.Y / this.Rules.WorldSize.X;
      w = parent.clientWidth;
      h = w * ratio;
    }
    else
    {
      ratio = this.Rules.WorldSize.X / this.Rules.WorldSize.Y;
      h = parent.clientHeight;
      w = h * ratio;
      while (w > parent.clientWidth)
      {
        h = h - 1;
        w = h * ratio;
      }
    }

    this.wrapper.style.width = (this.wrapper.parentElement.clientWidth - this.wrapper.parentElement.clientWidth * 0.1) + "px";
    this.wrapper.style.height = (this.wrapper.parentElement.clientHeight - this.wrapper.parentElement.clientHeight * 0.1) + "px";

    this.canvas.style.width =  w + "px";
    this.canvas.style.height =  h + "px";
    this.canvas.width = this.canvas.clientWidth * 2;
    this.canvas.height = this.canvas.clientHeight * 2;
    this.header.style.width =  w + "px";


    this.Camera.CanvasSize.X = this.canvas.width;
    this.Camera.CanvasSize.Y = this.canvas.height;

    this.Camera.WorldSize = this.Rules.WorldSize;

    this.World.Ball.Speed = this.Game.BallSpeed;
    if (this.LocalSide != PlayerSide.Left && this.Game && !this.IsServerless && Distance(this.World.PlayerLeftPos, this.Game.PlayerLeftPosition) > 1)
      this.World.PlayerLeftPos = Lerp(this.World.PlayerLeftPos, this.Game.PlayerLeftPosition, 0.15);

    if (this.LocalSide != PlayerSide.Right && this.Game && !this.IsServerless && Distance(this.World.PlayerRightPos, this.Game.PlayerRightPosition) > 1)
      this.World.PlayerRightPos = Lerp(this.World.PlayerRightPos, this.Game.PlayerRightPosition, 0.15);

    let ballDist = Vector2.Distance(this.World.Ball.Circle.Position, this.Game.BallPosition);
    if (!this.World.IsSlave && !this.IsServerless &&  ballDist > this.Rules.BallRadius && this.World.IsPlaying)
    {
      this.World.Ball.Circle.Position = Vector2.Lerp(this.World.Ball.Circle.Position, this.Game.BallPosition, 0.05);
      this.World.Ball.UnitDirection = this.Game.BallDirection;
    }
    else if (!this.World.IsSlave && !this.IsServerless &&  ballDist > 50 && !this.World.IsPlaying)
    {
      this.World.Ball.Circle.Position = this.Game.BallPosition;
    }
    else if (!this.World.IsSlave && !this.IsServerless &&  ballDist > 0.5 && !this.World.IsPlaying)
    {
      this.World.Ball.Circle.Position = Vector2.Lerp(this.World.Ball.Circle.Position, this.Game.BallPosition, 0.15);
    }

    if (this.World.IsSlave && !this.IsServerless)
      this.World.Ball.Circle.Position = this.Game.BallPosition;

    if (this.LocalRole != Role.Spectator && this.IsMovingDown && !this.IsMovingUp)
    {
      this.World.SetPlayerPosition(this.LocalSide,this.World.GetPlayerPosition(this.LocalSide) + this.Rules.PlayerBarSpeed * delta);
    }
    if (this.IsMovingUp && !this.IsMovingDown)
    {
      this.World.SetPlayerPosition(this.LocalSide,this.World.GetPlayerPosition(this.LocalSide) - this.Rules.PlayerBarSpeed * delta);
    }
    this.World.Update(delta);
    this.Render();

    window.requestAnimationFrame(this.Update);
  }

  Render()
  {
    if (this.Graphics)
    {
      this.Graphics.FillColor("grey");

      this.Graphics.Font("Arial", 30);
      if (this.Latency)
        this.Graphics.DrawText(this.Latency + "ms", new Vector2(15, 35));

      this.Graphics.DrawText(this.UPS + " fps", new Vector2(15, 45));

      this.Graphics.FillColor("white");

      this.Graphics.Ctx.strokeStyle = "rgb(180, 180, 180)";
      this.Graphics.Ctx.lineWidth = this.Graphics.Canvas.width * 0.002;
      this.Graphics.Ctx.setLineDash([this.Graphics.Canvas.height / 20, this.Graphics.Canvas.height / 40]);
      this.Graphics.Ctx.beginPath();
      this.Graphics.Ctx.moveTo(this.Graphics.Canvas.width / 2, 0);
      this.Graphics.Ctx.lineTo(this.Graphics.Canvas.width / 2, this.Graphics.Canvas.height);
      this.Graphics.Ctx.stroke();

      this.Graphics.Ctx.lineWidth = 1;

      if (this.World.PlayerLeftVisible)
      {
        this.Graphics.DrawRoundedRectangle(
            new Vector2
            (
                10,
                this.World.PlayerLeftPos - this.Rules.PlayerBarSize.Y / 2
            ),
            this.Rules.PlayerBarSize,
            15
        );
      }

      if (this.World.PlayerRightVisible)
      {
        this.Graphics.DrawRoundedRectangle(
            new Vector2
            (
                this.Rules.WorldSize.X - this.Rules.PlayerBarSize.X - 10,
                this.World.PlayerRightPos - this.Rules.PlayerBarSize.Y / 2
            ),
            this.Rules.PlayerBarSize,
            15
        );
      }

      this.Graphics.FillColor("#FF5500")
      this.Graphics.StrokeColor("#FF5500");
      this.Graphics.DrawCircle(this.World.Ball.Circle.Position, this.World.Ball.Circle.Size);

      for (let i = 0; i < this.World.Obstacles.length; i++)
      {
        this.Graphics.DrawRectangle(this.World.Obstacles[i].Position, this.World.Obstacles[i].Size);
      }
    }
  }

  CosInterp(v1, v2, mu)
  {
    let mu2;
    mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
    return (v1 * ( 1 - mu2) + v2 * mu2);
  }

  public GetCanvasSize() : Vector2
  {
    return new Vector2(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  public GetPlayerNames() : string[]
  {
    if (this.Rules == null)
      return ["", ""];

    return [this.Rules.PlayerLeftName, this.Rules.PlayerRightName];
  }

  public GetPlayerAvatar() : string[]
  {
    if (this.Rules == null)
      return ["", ""];
    return [this.Rules.PlayerLeftAvatarURL, this.Rules.PlayerRightAvatarURL];
  }

  public getRole() : Role
  {
    return (this.LocalRole);
  }

  public IsClassic() : boolean
  {
    return !this.Rules.EnableObstacles;
  }

  public GetScore() : number[]
  {
    if (this.Game == null)
      return [0, 0];
    return [this.Game.PlayerLeftScore, this.Game.PlayerRightScore];
  }

  public GetWinner(): PlayerSide
  {
    return this.Winner;
  }


  mounted()
  {
    this.Winner = null;
    this.IsRunning = true;
    this.LastSecond = Date.now();
    this.UPS = 0;
    this.UPSCount = 0;
    this.World = new PongWorld();
    this.Game = new GamePacket();
    this.Graphics.Initialize(this.canvas);
    this.Graphics.Camera = this.Camera;
    this.World.IsSlave = true;
    //this.StartServerless();

    document.addEventListener('keydown', (event) => {
    	if (this.LocalRole != Role.Player)
    		return;
    	if (event.key === "ArrowUp" && !this.IsMovingUp && !this.IsMovingDown)
    	{
			this.IsMovingUp = true;
    		this.Socket.emit("bar_start", Date.now(), BarDirection.Up);
    	}
    	 if (event.key === "ArrowDown" && !this.IsMovingUp && !this.IsMovingDown)
    	{
			this.IsMovingDown = true;
    		this.Socket.emit("bar_start", Date.now(), BarDirection.Down);
    	}
    });
    document.addEventListener('keyup', (event) => {
		if (this.LocalRole != Role.Player)
        return;
    	if (event.key === "ArrowUp" && this.IsMovingUp && !this.IsMovingDown)
    	{
			this.IsMovingUp = false;
			this.Socket.emit("bar_stop", this.World.GetPlayerPosition(this.LocalSide));
    	}
    	 if (event.key === "ArrowDown" && !this.IsMovingUp && this.IsMovingDown)
    	{
    	  	this.IsMovingDown = false;
      		this.Socket.emit("bar_stop", this.World.GetPlayerPosition(this.LocalSide));
    	}
    });

    if (this.$store.state.serverPort == 0)
    {
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/pong/get-port-by-token`, {withCredentials: true}).then((res) => {
        if (res.data.port != 0) {
          this.$store.state.user.game = 1;
          this.Connect(res.data.port);
        }
        else {
          this.$store.state.user.game = 0;
          this.$router.push({ name:"pong" });
        }
      }).catch((err)=> {
        console.log("Unable to get server port !");
        console.log(err);
      })
    }
    else
    {
      this.Connect(this.$store.state.serverPort);
      this.$store.state.serverPort = 0;
    }

    window.requestAnimationFrame(this.Update);
  }

  unmounted()
  {
    if (this.Socket)
      this.Socket.close();
    this.IsRunning = false;
  }

  public StartServerless() : void
  {
    const rules = new PongRules();
    rules.EnableSpectator = false;
    rules.PlayerBarOffset = 10;
    rules.PlayerBarSpeed = 500;
    rules.PlayerBarSize = new Vector2(25, 200);
    rules.WorldSize = new Vector2(1600, 1000);
    rules.PlayerStartPosition = 500;
    rules.EnableObstacles = false;
    rules.BallSpeed = 400;
    rules.BallRadius = 25;
    rules.BallStartPosition = new Vector2(rules.WorldSize.X / 2, rules.WorldSize.Y / 2);

    this.LocalRole = Role.Player;
    this.LocalSide = PlayerSide.Right;
    let setup : SetupPacket = new SetupPacket();
    setup.Rules = rules;
    setup.PlayerRight = new Player();
    setup.PlayerRight.IsConnected = true;
    setup.PlayerRight.Position = rules.PlayerStartPosition;
    setup.PlayerLeft = new Player();
    this.OnNetworkSetup(setup);
    this.World.IsPlaying = true;
    this.IsServerless = true;
  }
}

class Camera
{
  public WorldSize : Vector2 = new Vector2(0, 0);
  public CanvasSize : Vector2 = new Vector2(0, 0);

  public WorldToCanvas(world : Vector2) : Vector2
  {
    return new Vector2
    (
        world.X / this.WorldSize.X * this.CanvasSize.X,
        world.Y / this.WorldSize.Y * this.CanvasSize.Y
    )
  }

  public WorldToCanvasX(x : number) : number
  {
    return x / this.WorldSize.X * this.CanvasSize.X;
  }

  public WorldToCanvasY(y : number) : number
  {
    return y / this.WorldSize.Y * this.CanvasSize.Y;
  }

  public CanvasToWorld(canvas : Vector2) : Vector2
  {
    return new Vector2
    (
        canvas.X / this.CanvasSize.X * this.WorldSize.X,
        canvas.Y / this.CanvasSize.Y * this.WorldSize.Y
    )
  }
}

class Graphics
{
  public Canvas : HTMLCanvasElement;
  public Ctx : CanvasRenderingContext2D;
  public Camera : Camera;

  public Initialize(canvas : HTMLCanvasElement) : void
  {
    this.Canvas = canvas;
    this.Ctx = canvas.getContext("2d");
    this.Ctx.imageSmoothingEnabled = false;
  }

  public Font(name : string, size : number)
  {
    if (this.Camera)
      this.Ctx.font = this.Camera.WorldToCanvasY(size) + "px " + name;
    else
      this.Ctx.font = size + "px " + name;
  }
  public Clear()
  {
    this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
  }

  public DrawText(text : string, pos : Vector2)
  {
    if (this.Camera)
      this.Ctx.fillText(text, this.Camera.WorldToCanvasX(pos.X), this.Camera.WorldToCanvasY(pos.Y));
    else
      this.Ctx.fillText(text, pos.X, pos.Y);
  }

  public DrawRectangle(pos : Vector2, size : Vector2)
  {
    if (this.Camera)
      this.Ctx.fillRect(
          this.Camera.WorldToCanvasX(pos.X),
          this.Camera.WorldToCanvasY(pos.Y),
          this.Camera.WorldToCanvasX(size.X),
          this.Camera.WorldToCanvasY(size.Y)
      );
    else
      this.Ctx.fillRect(
          pos.X,
          pos.Y,
          size.X,
          size.Y
      );
  }

  public DrawRoundedRectangle(pos : Vector2, size : Vector2, radius : number) : void
  {
    let w = this.Camera.WorldToCanvasX(size.X);
    let x = this.Camera.WorldToCanvasX(pos.X);
    let h = this.Camera.WorldToCanvasX(size.Y);
    let y = this.Camera.WorldToCanvasX(pos.Y);
    let r = this.Camera.WorldToCanvasX(radius);
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.Ctx.beginPath();
    this.Ctx.moveTo(x+r, y);
    this.Ctx.arcTo(x+w, y,   x+w, y+h, r);
    this.Ctx.arcTo(x+w, y+h, x,   y+h, r);
    this.Ctx.arcTo(x,   y+h, x,   y,   r);
    this.Ctx.arcTo(x,   y,   x+w, y,   r);
    this.Ctx.closePath();
    this.Ctx.fill();
  }

  public DrawCircle(pos : Vector2, radius : number)
  {
    this.Ctx.beginPath();
    if (this.Camera)
      this.Ctx.arc(
          this.Camera.WorldToCanvasX(pos.X),
          this.Camera.WorldToCanvasY(pos.Y),
          this.Camera.WorldToCanvasX(radius),
          0,
          2 * Math.PI
      );
    else
      this.Ctx.arc(
          pos.X,
          pos.Y,
          radius,
          0,
          2 * Math.PI
      );
    this.Ctx.fill();
    this.Ctx.stroke();
    this.Ctx.closePath();
  }

  public FillColor(color : string)
  {
    this.Ctx.fillStyle = color;
  }

  public StrokeColor(color : string)
  {
    this.Ctx.strokeStyle = color;
  }
}

</script>

<style scoped lang="scss">
#pong-canvas
{
  position: relative;
  overflow: hidden;
  margin: auto;
  border: 4px solid $accent;
  border-radius: 0.5%;
}

#PongWrapper
{
  width: auto;
  height: auto;
  margin-left: 5%;
  margin-right: 5%;
  margin-bottom: 5%;
}

@font-face {
  font-family: 'Seven Segment';
  src: url('../../assets/fonts/seven_segment.ttf');
}

// FONT FAMILY
.seven-segment {
  font-family: "Seven Segment", sans-serif;
}
</style>