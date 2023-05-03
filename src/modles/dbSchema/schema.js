const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const playerStateSchema = new Schema({
//     roomInfo: {
//         roomName: { type: String },
//         roomId: { type: String }
//     },
//     playerState: {
//         sessionId: { type: String },
//         x: { type: Number },
//         y: { type: Number },
//     }
// }, { timestamps: true });

const playerCredentialsSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    userID: {
        type: Number,
    },
    accessToken: {
        type: String,
    }

}, { timestamps: true });

// const playerState = mongoose.model('playerState', playerStateSchema);
const playerCredentials = mongoose.model('playerCredentials', playerCredentialsSchema);
// module.exports = { playerState, playerCredentials };
module.exports = playerCredentials;