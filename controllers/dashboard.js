const express = require("express");
const axios = require("axios");
const CoinPriceHistory = require("../models/coinPriceHistory");
const router = express.Router();
const User = require("../models/user");
const isUserSignedIn = require("../middleware/isUserSignedIn");

router.get("/", isUserSignedIn, async (req, res) => {
    const user = req.session.user;
    let coinSearch = req.body.coinSearch || "btc";
    let coinId = "bitcoin"; // Default to 'btc'
    let historicalData = [];
    const userInDB = await User.findById(user._id);
    let symbols = await CoinPriceHistory.distinct("symbol");

    if (!user) {
        return res.redirect("/auth/sign-in");
    }
    let currentPrice = await getCryptoPrice(coinSearch);
    historicalData = await getHistoricalData(coinId);
    user.tokens = userInDB.tokens;

    res.render("dashboard/index.ejs", {
        user: user,
        symbols: symbols,
        historicalData: historicalData,
        coinId: coinId,
        currentPrice: currentPrice,
        coinSearch: coinSearch,
    });
});

router.post("/", isUserSignedIn, async function (req, res) {
    let coinSearch = req.body.coinSearch;
    console.log("coinSearch value received from form:", coinSearch);

    // Fetch symbols to show in the form again
    const symbols = await CoinPriceHistory.distinct("symbol");

    let coinId;
    let historicalData = [];

    if (coinSearch) {
        const coin = await CoinPriceHistory.findOne({ symbol: coinSearch });
        if (coin) {
            coinId = coin.coinId;
            historicalData = await getHistoricalData(coinId);
        }
    }
    let currentPrice = await getCryptoPrice(coinSearch);
    console.log(currentPrice);

    res.render("dashboard/index.ejs", {
        user: req.session.user,
        symbols: symbols,
        historicalData: historicalData,
        currentPrice: currentPrice,
        coinSearch: coinSearch,
    });
});

async function getHistoricalData(coinId) {
    try {
        const historicalData = await CoinPriceHistory.find({ coinId: coinId })
            .sort({ timestamp: 1 })
            .select("timestamp price");

        if (!historicalData || historicalData.length === 0) {
            return []; // Return empty array if no data found
        }

        return historicalData;
    } catch (error) {
        console.error("Error fetching historical data from database:", error);
        return []; // Return empty array in case of error
    }
}

async function getCryptoPrice(coinSearch) {
    try {
        if (!coinSearch || typeof coinSearch !== "string") {
            throw new Error("Invalid symbol provided.");
        }
        let coin = await CoinPriceHistory.findOne({ symbol: coinSearch });

        const coinId = coin.coinId;
        const priceResponse = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: coinId,
                    vs_currencies: "usd",
                },
            }
        );
        let currentPrice = priceResponse.data[coinId].usd;
        return currentPrice;
    } catch (error) {
        console.error("Error fetching crypto price:", error.message);
    }
}
module.exports = router;
