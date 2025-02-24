const express = require("express");
const axios = require("axios");
const coinPrice = require("../models/coinPriceCurrent");
const router = express.Router();

router.get("/", async (req, res) => {
    const coinSearch = req.query.coinSearch || "bitcoin";
    const user = req.session.user;

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

        res.render("dashboard/dashboard", {
            coinData: response.data,
            coinSearch: coinSearch,
            user: user,
        });
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
        res.status(500);
        res.redirect("/");
    }
});

router.get("/coin/:coinId/history", async (req, res) => {
    const { coinId } = req.params;

    try {
        const history = await getHistoricalData(coinId);

        res.json(history);
    } catch (error) {
        res.status(500).send("Error fetching historical data.");
    }
});
module.exports = router;
