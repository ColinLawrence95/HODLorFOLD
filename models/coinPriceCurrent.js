const mongoose = require("mongoose");

const CoinPriceSchema = new mongoose.Schema({
    coinId: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    price: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now },
});

const CoinPrice = mongoose.model("CoinPrice", CoinPriceSchema);

module.exports = CoinPrice;
