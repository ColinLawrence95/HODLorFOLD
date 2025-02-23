const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
    const {userId} = req.params;
    const coinSearch = req.query.coinSearch || "bitcoin"; 
    const user = req.session.user;

    try {

        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: {
                ids: coinSearch, 
                vs_currencies: "usd",
            },
        });

        res.render("dashboard", {
            coinData: response.data,
            coinSearch: coinSearch,
            user: user,
        });
    } catch (error) {
        console.error("Error fetching crypto prices:", error);
        res.status(500);
        res.redirect("/")
    }
});

module.exports = router;
