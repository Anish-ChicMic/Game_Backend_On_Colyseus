import { Room, Client, ServerError } from "colyseus";
import { MyRoomState, Player, Vec2 } from "./schema/MyRoomState";
import { ArraySchema } from '@colyseus/schema';
import { connectToDB, saveToDB } from "../controller/controller";
import { fetchRoomStateById, fetchUserIDByToken } from "../modles/model";

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
  totalPlayersInTheRoom: number = 0;
  playerWhoJoinedTheRoom: Array<string> = [];
  playerIdentity: any = {};
  roomStateGotFromDB: Array<object>;


  async onCreate(options: any) {
    // connectToDB();
    this.isDBConnected = model.connect(); // MongoDB Connecting

    console.log("<---------- ON CREATE ---------->")
    this.setState(new MyRoomState());
    this.roomStateGotFromDB = await model.fetchRoomStateById('4tx79b7ZP');
    console.log("this is fetched data: =>> ", this.roomStateGotFromDB[0]);
    this.setRoomStateGotFromDB();

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

    if (!this.isDBConnected) { await model.connect(); }

    console.log("<---------- ON AUTH ---------->")
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = options;
    if (data.accessToken) {
      // If data.accessToken is present then he is an old user then validate his token
      try {
        const token = data.accessToken;
        const verified = jwt.verify(token, jwtSecretKey);

        if (verified) {
          console.log("User Authorized Successfully!");
          let userFromDb = await model.fetchUserIDByToken(token);
          this.playerIdentity[client.sessionId] = userFromDb.name;
          console.log("this is userID:", userFromDb.name);
          return true;
        } else {
          console.log("Access Denied!");
          return false;
        }
      }
      catch (error) {
        console.log("Some Error Occured while authorizing! Access Denied!");
        return false;
      }

    }

  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.totalPlayersInTheRoom++;
    this.playerWhoJoinedTheRoom.push(client.sessionId);
    this.state.players.set(client.sessionId, new Player());
    this.setPlayerOldState(client.sessionId, this.playerIdentity[client.sessionId]);
    console.log("Old state settled!", this.playerIdentity[client.sessionId]);
    this.broadcast("SomeoneJoinedOrLeaved", { playerCnt: this.totalPlayersInTheRoom });

    if (!this.topPlayer.length) {
      this.topPlayer = client.sessionId;
      this.state.playerInfo.topPlayer = this.topPlayer;
    }
    else {
      this.bottomPlayer = client.sessionId;
      this.state.playerInfo.bottomPlayer = this.bottomPlayer;
    }

    console.log("Total Player in the Room: ", this.state.players.size);
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.totalPlayersInTheRoom--;
    this.broadcast("SomeoneJoinedOrLeaved", { playerCnt: this.totalPlayersInTheRoom });

    if (client.sessionId === this.topPlayer) {
      console.log("top player left!");
      try {
        if (consented) {
          throw new Error("Consented Leave!");
        }
        let isReconnected = await this.allowReconnection(client, 20);
        console.log("IsReconnected ::: ", isReconnected);
      }
      catch (err) {
        console.log("In catch block: ", err);
      }
      // saveToDB(this.state.playerTop, { roomName: this.roomName, roomID: this.roomId }, this.topPlayer);

    }
    else {
      // console.log("top player left!");
      // console.log(this.state.playerBottom);
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    let roomStateData = this.getWholeRoomState();
    // console.log("THIS IS ONDESPOSE: ", roomStateData);
    // controller.saveRoomState(roomStateData);
  }






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

  // Retreiving Room State to store it into DB
  getWholeRoomState(): object {
    console.log("Retreiving Room state!");

    // Object Types
    type roomStateType = { [key: string]: any };
    type playerStateType = { [key: string]: any }

    const roomState: roomStateType = {};

    // Room Data
    roomState.RoomName = this.roomName;
    roomState.RoomID = this.roomId;
    roomState.CountTotalPlayersJoined = this.playerWhoJoinedTheRoom.length;
    roomState.PlayersWhoJoinedTheRoom = [];

    // Puck State
    roomState.PuckState = {};
    roomState.PuckState.x = this.state.PuckState.x;
    roomState.PuckState.y = this.state.PuckState.y;
    roomState.PuckState.angularVelocity = this.state.PuckState.angularVelocity;
    roomState.PuckState.velocityX = this.state.PuckState.velocityX;
    roomState.PuckState.velocityY = this.state.PuckState.velocityY;

    // Players State
    roomState.Players = {};
    this.playerWhoJoinedTheRoom.forEach((player) => {
      let currPlayerState = this.state.players.get(player);
      let state: playerStateType = {};
      state.x = currPlayerState.x;
      state.y = currPlayerState.y;
      roomState.Players[this.playerIdentity[player]] = state;
      roomState.PlayersWhoJoinedTheRoom.push(this.playerIdentity[player]);
    });

    return roomState;
  }

  // 
  setRoomStateGotFromDB() {
    let dbStateData: any = this.roomStateGotFromDB[0];
    this.state.PuckState.x = dbStateData.PuckState.x;
    this.state.PuckState.y = dbStateData.PuckState.y;
    this.state.PuckState.angularVelocity = dbStateData.PuckState.angularVelocity;
    this.state.PuckState.velocityX = dbStateData.PuckState.velocityX;
    this.state.PuckState.velocityY = dbStateData.PuckState.velocityY;
  }


  setPlayerOldState(sessId: string, userName: string) {
    let dbStateData: any = this.roomStateGotFromDB[0];
    console.log("New Assigned Players iden: ", this.playerIdentity);
    console.log("Db players info: ", dbStateData.Players);

    console.log("Function Over! ", this.state.players);
    let currPlayerState = this.state.players.get(sessId);
    currPlayerState.x = dbStateData.Players[userName].x;
    currPlayerState.y = dbStateData.Players[userName].y;
  }

}



