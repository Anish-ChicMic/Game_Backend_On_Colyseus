const mongoose = require("mongoose");
// require('../../arena').config

const dbURL = 'mongodb+srv://anishkumar:Colyseus1234@colyseus-testing.qwdzmwf.mongodb.net/colyseusDB?retryWrites=true&w=majority';

// Colyseus1234

export async function connect() {
    try {
        await mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected To Database!");
    }
    catch (err) {
        console.error(`Some Error Occurs => ${err}`);
    }
}

export function saveData(data) {
    data.save()
        .then((result) => {
            console.log("Data Saved: " + result);
        })
        .catch((err) => console.log("Error Occured While Saving Data: => ", err));
}