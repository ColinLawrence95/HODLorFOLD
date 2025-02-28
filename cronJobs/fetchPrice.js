const cron = require("node-cron");
const axios = require("axios");
const CoinPriceHistory = require("../models/coinPriceHistory");

const fetchCryptoPrices = async () => {
    console.log("Fetching top 250 crypto prices...");
    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: 20,
                    page: 1,
                    sparkline: false,
                },
            }
        );
        for (let coin of response.data) {
            await CoinPriceHistory.create({
                coinId: coin.id,
                symbol: coin.symbol,
                price: coin.current_price,
                timestamp: new Date(),
            });
        }
        console.log(
            "Top 250 crypto prices data updated in the database."
        );
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
    }
};
cron.schedule("*/10 * * * *", async () => {
    try{
       await  fetchCryptoPrices();
    } catch (error){
        console.error("Error running cron job: ")
    }
    
});
module.exports = fetchCryptoPrices;
