import { Room, Client } from "colyseus";
import { MyRoomState, Player, Vec2 } from "./schema/MyRoomState";
import { ArraySchema } from '@colyseus/schema';
import { connectToDB, saveToDB } from "../controller/controller";

export class MyRoom extends Room<MyRoomState> {
  room: any;
  topPlayer: string = "";
  bottomPlayer: string = "";




  onCreate(options: any) {
    connectToDB();
    this.setState(new MyRoomState());
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));

    // this.onMessage("strikerMoved", (client, data) => {
    //   let senderSpeedQueue = data.speedQueue;
    //   let newSpeedQueue = new ArraySchema<Vec2>();

    //   if (client.sessionId === this.topPlayer) {
    //     console.log("changing topPlayer state>>>>>>>", data.positions.x / 10, data.positions.y / 10);
    //     this.state.playerTop.x = data.positions.x;
    //     this.state.playerTop.y = data.positions.y;

    //     senderSpeedQueue.forEach((point: { x: number; y: number; }) => {
    //       let vec2 = new Vec2();
    //       vec2.x = point.x;
    //       vec2.y = point.y;
    //       newSpeedQueue.push(vec2);
    //     });
    //     // console.log("Pushing: ", newSpeedQueue);
    //     this.state.playerTop.speedQueue = newSpeedQueue;
    //   }
    //   else {
    //     console.log("changing bottomPlayer state>>>>>>>");
    //     this.state.playerBottom.x = data.positions.x;
    //     this.state.playerBottom.y = data.positions.y;

    //     senderSpeedQueue.forEach((point: { x: number; y: number; }) => {
    //       let vec2 = new Vec2();
    //       vec2.x = point.x;
    //       vec2.y = point.y;
    //       newSpeedQueue.push(vec2);
    //     });

    //     // console.log("Pushing: ", newSpeedQueue);
    //     this.state.playerBottom.speedQueue = newSpeedQueue;
    //   }

    // })

    this.onMessage("strikerMoved", (client, data) => this.moveStriker(client, data));

    // this.onMessage("PuckState", (client, data) =>{
    //   this.state.PuckState.x = data.position.x;
    //   this.state.PuckState.y = data.position.y;
    //   this.state.PuckState.angularVelocity = data.angularVelocity;
    //   this.state.PuckState.velocityX = data.velocity.x;
    //   this.state.PuckState.velocityY = data.velocity.y;
    //   // console.log("Puck State Changing At Server::::::::", data);
    // })

  }

  update(deltaTime: number) {
    this.onMessage("PuckState", (client, data) => {
      this.state.PuckState.client = client.sessionId;
      this.state.PuckState.x = data.position.x * 10;
      this.state.PuckState.y = data.position.y * 10;
      this.state.PuckState.angularVelocity = data.angularVelocity * 10;
      this.state.PuckState.velocityX = data.velocity.x * 10;
      this.state.PuckState.velocityY = data.velocity.y * 10;
      // console.log("Puck State Changing At Server::::::::", data);
    })

  }


  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());

    if (!this.topPlayer.length) {
      this.topPlayer = client.sessionId;
      this.state.playerInfo.topPlayer = this.topPlayer;
    }
    else {
      this.bottomPlayer = client.sessionId;
      this.state.playerInfo.bottomPlayer = this.bottomPlayer;
    }

    console.log("top: " + this.topPlayer);
    console.log("bot: " + this.bottomPlayer);
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");


    if (client.sessionId === this.topPlayer) {
      console.log("top player left!");
      try {
        if (consented) {
          throw new Error("Consented Leave!");
        }
        await this.allowReconnection(client, 20);
      }
      catch (err) {
        console.log("In catch block: ", err);
      }
      // saveToDB(this.state.playerTop, { roomName: this.roomName, roomID: this.roomId }, this.topPlayer);

    }
    else {
      console.log("top player left!");
      // console.log(this.state.playerBottom);
    }
  }

  onDispose() { console.log("room", this.roomId, "disposing..."); }


  // Custom Event Function
  moveStriker(client: any, data: any) {
    console.log("this is functin: ");

    let senderSpeedQueue = data.speedQueue;
    let newSpeedQueue = new ArraySchema<Vec2>();

    senderSpeedQueue.forEach((point: { x: number; y: number; }) => {
      let vec2 = new Vec2();
      vec2.x = point.x;
      vec2.y = point.y;
      newSpeedQueue.push(vec2);
    });

    let currPlayer = this.state.players.get(client.sessionId);
    currPlayer.x = data.positions.x;
    currPlayer.y = data.positions.y;
    currPlayer.speedQueue = newSpeedQueue;
    // console.log("CurrPlayer: ", currPlayer);
    // console.log("mapSchema:: ", this.state.players);

  }

}