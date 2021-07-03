import { Schema } from "mongoose";

export default new Schema({
    playerId: String,
    guildId: String,
    bankroll: Number
});