const mongoose = require("mongoose");
const betSchema = new mongoose.Schema({
    userId: { type: String, ref: "User" },
    coinId: { type: String },
    betType: { type: String },
    wager: { type: Number },
    betLength: { type: Number },
    betPostTime: { type: Date },
    betStartTime: { type: Date },
    betEndTime: { type: Date },
    betStartPrice: { type: Number },
    betEndPrice: { type: Number },
    betInProgress: { type: Boolean, default: false },
    betResolved: { type: Boolean, default: false },
    betWinner: { type: String },
    betAcceptedBy: { type: String, ref: "User" },
});
const Bets = mongoose.model("Bets", betSchema);
module.exports = Bets;
