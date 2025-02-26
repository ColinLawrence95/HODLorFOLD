const express = require("express");
const axios = require("axios");
const coinPriceHistory = require("../models/coinPriceHistory");
const router = express.Router();
const User = require("../models/user");

router.get("/", async (req, res) => {
    const user = req.session.user;
    const userInDB = await User.findById(user._id);
    let coinSearch = req.query.coinSearch || "bitcoin";
    coinSearch = coinSearch.toLowerCase();
    if (!user) {
        return res.redirect("/auth/sign-in");
    }
    user.tokens = userInDB.tokens;
    
    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: coinSearch,
                    vs_currencies: "usd",
                },
            }
        );
        const historicalData = await getHistoricalData(coinSearch);
        res.render("dashboard/index.ejs", {
            coinData: response.data,
            coinSearch: coinSearch,
            user: user,
            historicalData: historicalData,
        });
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
        res.status(500);
        res.redirect("/");
    }
});

async function getHistoricalData(coinId) {
    try {
        const historicalData = await coinPriceHistory
            .find({ coinId: coinId })
            .sort({ timestamp: 1 })
            .select("timestamp price");

        if (!historicalData || historicalData.length === 0) {
            throw new Error("No historical data found for this coin.");
        }

        return historicalData;
    } catch (error) {
        console.error("Error fetching historical data from database:", error);
        throw error;
    }
}

module.exports = router;
