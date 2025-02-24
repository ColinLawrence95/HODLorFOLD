const cron = require("node-cron");
const axios = require("axios");
const mongoose = require("mongoose");
const CoinPrice = require("../models/coinPriceCurrent");
const CoinPriceHistory = require("../models/coinPriceHistory");

const fetchCryptoPrices = async () => {
    console.log("Fetching top 100 crypto prices...");

    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: 100,
                    page: 1,
                    sparkline: false,
                },
            }
        );

        for (let coin of response.data) {
            await CoinPrice.findOneAndUpdate(
                { coinId: coin.id },
                {
                    name: coin.name,
                    symbol: coin.symbol,
                    price: coin.current_price,
                    lastUpdated: new Date(),
                },
                { upsert: true, new: true }
            );

            await CoinPriceHistory.create({
                coinId: coin.id,
                price: coin.current_price,
                timestamp: new Date(),
            });
        }

        console.log(
            "Top 100 crypto prices and historical data updated in the database."
        );
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
    }
};

cron.schedule("0 * * * *", () => {
    console.log(
        "Running cron job to fetch crypto prices and store historical data..."
    );
    fetchCryptoPrices();
});

module.exports = fetchCryptoPrices;
