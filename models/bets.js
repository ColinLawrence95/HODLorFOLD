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
    wager: {
        type: Number,
    },
    betLength: {
        type: Number,
    },
    betPostTime: {
        type: Date,
    },
    startPrice: {
        type: Number,
    },
    inProgress:{
        type: Boolean,
        default: false,
    },
    resolved: {
        type: Boolean,
    },
    acceptedBy: {
        type: String,
        ref: "User", 
        
    }
});
const Bets = mongoose.model("Bets", betSchema);
module.exports = Bets;
