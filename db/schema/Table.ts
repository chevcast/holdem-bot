import { Schema } from "mongoose";

export default new Schema({
    autoMoveDealer: Boolean,
    bigBlind: Number,
    bigBlindPosition: Number,
    blindIncreaseTimer: Number,
    buyIn: Number,
    communityCards: [{
        rank: String,
        suit: String
    }],
    channelId: String,
    channelName: String,
    creatorId: String,
    currentBet: Number,
    currentPosition: Number,
    currentRound: String,
    dealerPosition: Number,
    debug: Boolean,
    deck: [{
        rank: String,
        suit: String
    }],
    guildName: String,
    handNumber: Number,
    lastPosition: Number,
    lastRaise: Number,
    players: [{
        bet: Number,
        folded: Boolean,
        holeCards: [{
            rank: String,
            suit: String
        }],
        id: String,
        left: Boolean,
        raise: Number,
        showCards: Boolean,
        stackSize: Number
    }],
    pots: [{
        amount: Number,
        eligiblePlayers: [String],
        winners: [String]
    }],
    smallBlind: Number,
    smallBlindPosition: Number,
    sound: Boolean,
    turnTimer: Number,
    winners: [String]
});