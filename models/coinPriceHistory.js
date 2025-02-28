const mongoose = require("mongoose");
const coinPriceHistorySchema = new mongoose.Schema({
    coinId: { type: String, required: true }, 
    price: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }, 
    symbol: {type: String,}
});
const CoinPriceHistory = mongoose.model("CoinPriceHistory", coinPriceHistorySchema);
module.exports = CoinPriceHistory;
