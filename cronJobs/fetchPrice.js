const cron = require("node-cron");
const axios = require("axios");
const mongoose = require("mongoose");
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
                    per_page: 250,
                    page: 1,
                    sparkline: false,
                },
            }
        );

        for (let coin of response.data) {
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
