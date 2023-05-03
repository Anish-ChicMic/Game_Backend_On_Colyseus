import { Room, Client, ServerError } from "colyseus";
import { MyRoomState, Player, Vec2 } from "./schema/MyRoomState";
import { ArraySchema } from '@colyseus/schema';
import { connectToDB, saveToDB } from "../controller/controller";

const controller = require('../controller/controller');
const model = require('../modles/model');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
require('dotenv').config

export class MyRoom extends Room<MyRoomState> {

  isDBConnected: boolean = false;

  room: any;
  topPlayer: string = "";
  bottomPlayer: string = "";

  onCreate(options: any) {
    // connectToDB();
    this.isDBConnected = model.connect(); // MongoDB Connecting
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


  async onAuth(client: any, options: any, request: any) {

    // console.log("OnAuth Data: ", request.headers);
    // console.log("==============", request.connection.remoteAddress);
    if (!this.isDBConnected) {
      await model.connect();
    }
    console.log(options);
    console.log("<---------- ON AUTH ---------->")
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = options;

    if (data.accessToken) {
      // If data.accessToken is present then it is a old user
      //then validate it from DB
      try {
        const token = data.accessToken;

        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
          console.log("User Authorized Successfully!");
          return true;
        } else {
          // Access Denied
          console.log("Access Denied!");
          return false;
        }
      }
      catch (error) {
        // Access Denied
        console.log("Access Denied!");
        return false;
      }

    }
    else {
      // Else it is signUp request
      // Genearate accessToken store it in DB and give it to user
      const token = jwt.sign(data, jwtSecretKey);
      data.time = Date();
      data.accessToken = token;
      console.log(data);
      client.send("GetToken", { accessToken: token });
      // controller.savePlayerCredentials(data);
      return true;
    }


  }


  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    console.log("This is client: ", client);
    console.log("This is optiosn: ", options);
    this.state.players.set(client.sessionId, new Player());
    // this.state.players.get(client.sessionId);

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

    console.log("Total Player in the Room: ", this.state.players.size);
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
    // console.log("this is functin: ");

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

function validateToken(accessToken: any) {
  throw new Error("Function not implemented.");
}
