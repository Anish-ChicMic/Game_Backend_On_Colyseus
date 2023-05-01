const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const playerStateSchema = new Schema({
    roomInfo: {
        roomName: {type: String},
        roomId: {type: String}
    },
    playerState: {
        sessionId: {type: String},
        x: {type: Number},
        y: {type: Number},  
    }
}, {timestamps: true});

const playerState = mongoose.model('playerState', playerStateSchema);
module.exports = playerState;