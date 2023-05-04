import { playerState, playerCredentials, roomStateDB } from "../modles/dbSchema/schema";
import { connect } from "../modles/model";
const dbScheme = require('../modles/dbSchema/schema')
const model = require('../modles/model')


// export function 
export let connectToDB = connect;


export function saveToDB(playerState: any, roomData: any, sessionId: string) {
    // console.log(playerState.x);
    // console.log(roomData.roomID);
    let data = dbScheme({
        roomInfo: {
            roomName: roomData.roomName,
            roomId: roomData.roomID
        },
        playerState: {
            sessionId: sessionId,
            x: playerState.x,
            y: playerState.y,
        }
    });

    model.saveData(data);
}

export function savePlayerCredentials(data: any) {
    console.log("In Controller ::::::::::::::: ", data);
    let credData = dbScheme({
        name: data.name,
        email: data.email,
        userID: data.userID,
        accessToken: data.accessToken
    });

    model.savePlayerCred(credData);
}


export function saveRoomState(data: any) {

    let roomState = new roomStateDB({
        RoomName: data.RoomName,
        RoomID: data.RoomID,
        CountTotalPlayersJoined: data.CountTotalPlayersJoined,
        PlayersWhoJoinedTheRoom: data.PlayersWhoJoinedTheRoom,
        PuckState: data.PuckState,
        Players: data.Players
    })

    model.saveRoomStateToDB(roomState);
}