const mongoose = require("mongoose");
const betSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User"
    },
    coinId: {
        type: String,
    },
    betType: {
        type: String,
    },
    amount: {
        type: Number,
    },
    wager: {
        type: Number,
    },
    betLength: {
        type: Number,
    },
    betStartTime: {
        type: Number,
    },
    resolved: {
        type: Boolean,
    },
});
const Bets = mongoose.model("Bets", betSchema);
module.exports = Bets;
