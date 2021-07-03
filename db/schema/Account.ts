import { Schema } from "mongoose";

export default new Schema({
    name: String,
    playerId: String,
    guildId: String,
    bankroll: Number
});