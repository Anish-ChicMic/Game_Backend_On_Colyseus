const mongoose = require("mongoose");
const dbScheme = require('../modles/dbSchema/schema');
const dotenv = require('dotenv');
dotenv.config();

export async function connect() {
    try {
        await mongoose.connect(process.env.DEMO_DATABAS, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected To Database!");
        return true;
    }
    catch (err) {
        console.error(`Some Error Occurs => ${err}`);
        return false;
    }
}

export function saveData(data) {
    data.save()
        .then((result) => {
            console.log("Data Saved: " + result);
        })
        .catch((err) => console.log("Error Occured While Saving Data: => ", err));
}

export function savePlayerCred(data) {
    data.save()
        .then((result) => {
            console.log("RoomState Data Saved: " + result);
        })
        .catch((err) => console.log("Error Occured While Saving PlayerCred Data: => ", err));
}

export function saveRoomStateToDB(data) {
    data.save()
        .then((result) => {
            console.log("RoomState Data Saved: " + result);
        })
        .catch((err) => console.log("Error Occured While Saving RoomState Data: => ", err));
}

export async function fetchRoomStateById(id) {

    // dbScheme.roomStateDB.find({ RoomID: 'H6DV8IPa-' }, (err, docs) => {
    //     if (!err) {
    //         console.log("this is fetched data: ", docs);
    //         return docs;
    //     }
    //     else { console.log('Failed to retrieve the Course List: ' + err) }
    // });

    try {
        let dbData = await dbScheme.roomStateDB.find({ RoomID: id })
        //console.log(dbData) //Console logs succesfully
        return new Promise((resolve, reject) => {
            resolve(dbData);
        })
    }
    catch (err) {
        console.log(err)
        return new Promise((resolve, reject) => {
            reject(err);
        })
    }
}

export async function fetchUserIDByToken(token) {
    try {
        let dbData = await dbScheme.playerCredentials.findOne({ accessToken: token })
        //console.log(dbData) //Console logs succesfully
        return new Promise((resolve, reject) => {
            resolve(dbData);
        })
    }
    catch (err) {
        console.log(err)
        return new Promise((resolve, reject) => {
            reject(err);
        })
    }
}

