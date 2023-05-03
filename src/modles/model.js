const mongoose = require("mongoose");
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
            console.log("Cred Data Saved: " + result);
        })
        .catch((err) => console.log("Error Occured While Saving Data: => ", err));
}