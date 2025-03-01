const express = require("express");
const axios = require("axios");
const Bets = require("../models/bets");
const User = require("../models/user");
const CoinPriceHistory = require("../models/coinPriceHistory");
const isUserSignedIn = require("../middleware/isUserSignedIn");

const router = express.Router();

router.get("/:userId", isUserSignedIn, async function (req, res) {
    const user = req.session.user;
    const userInDB = await User.findById(user._id);
    const bets = await Bets.find()
        .populate("userId", "username")
        .populate("betAcceptedBy", "username");
    user.tokens = userInDB.tokens;
    res.render("betBoard/index.ejs", { user, bets });
});

router.get("/:userId/newBet", isUserSignedIn, async function (req, res) {
    let symbols = await CoinPriceHistory.distinct("symbol");
    let coinSearch = req.body.coinSearch;
    const user = req.session.user;
    res.render("betBoard/newBet.ejs", { user, symbols, coinSearch });
});

router.get(
    "/:userId/acceptBet/:betId", isUserSignedIn,async function (req, res) {
        const user = req.session.user;
        let betId = req.params.betId;
        let bet = await Bets.findById(betId).populate("userId", "username");
        res.render("betBoard/acceptBet.ejs", { user, bet });
    }
);
router.get(
    "/:userId/editBet/:betId",
    isUserSignedIn,
    async function (req, res) {
        try {
            let symbols = await CoinPriceHistory.distinct("symbol");
            let coinSearch = req.body.coinSearch;
            const user = req.session.user;
            const bet = await Bets.findById(req.params.betId);
            res.render("betBoard/editBet.ejs", {
                user,
                bet,
                whatPage: "edit",
                symbols,
                coinSearch,
            });
        } catch (error) {
            console.log(error);
        }
    }
);
router.post("/:userId", isUserSignedIn, async function (req, res) {
    const user = await User.findById(req.session.user._id);
    const wager = req.body.wager;

    if (user.tokens < wager) {
        return res.send("Not Enough Tokens!");
    } else {
        await Bets.create({
            ...req.body,
            coinId: req.body.coinSearch,
            userId: user._id,
            betPostTime: new Date(),
            betResolved: false,
        });
        user.tokens -= wager;
        await user.save();
        res.redirect(`/betBoard/${user._id}`);
    }
});

router.post(
    "/:userId/acceptBet/:betId",
    isUserSignedIn,
    async function (req, res) {
        const userSession = req.session.user;
        const user = await User.findById(userSession._id);
        const betId = req.params.betId;
        const bet = await Bets.findById(betId).populate("userId");
        const wager = bet.wager;
        const userPosted = await User.findById(bet.userId._id);
        const coinId = bet.coinId;

        if (user.tokens < wager) {
            return res.send("Not Enough Tokens!");
        } else {
            const startPrice = await fetchCoinPrice(bet);

            if (startPrice) {
                user.tokens -= wager;
                bet.betInProgress = true;
                bet.betAcceptedBy = userSession._id;
                bet.betStartPrice = startPrice;
                bet.betStartTime = Date.now();
                await user.save();
                await userPosted.save();
                await bet.save();
                console.log("Starting bet Timer");
                res.redirect(`/betBoard/${user._id}`);
                setTimeout(async () => {
                    try {
                        await betLogic(bet._id, userPosted);
                    } catch (error) {
                        console.error("Error in bet timer:", error);
                    }
                }, bet.betLength * 60 * 1000);
            }
        }
    }
);
router.put("/:userId/:betId", isUserSignedIn, async function (req, res) {
    try {
        const user = await User.findById(req.params.userId);
        const bet = await Bets.findById(req.params.betId);
        if (!bet) {
            return res.status(404).send("Bet not found");
        }
        user.tokens += bet.wager;
        await user.save();
    
        bet.set({
            coinId: req.body.coinSearch,
            betType: req.body.betType,
            wager: req.body.wager,
            betLength: req.body.betLength,
        });

        await bet.save();
        user.tokens -= bet.wager;
        await user.save();

        
        res.redirect(`/betBoard/${bet.userId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

router.delete("/:userId/:betId", isUserSignedIn, async function (req, res) {
    const user = await User.findById(req.session.user._id);
    const bet = await Bets.findById(req.params.betId);
    const wager = bet.wager;
    try {
        await Bets.findByIdAndDelete(req.params.betId);
        user.tokens += wager;
        user.save();
    } catch (error) {
        console.log(error);
        res.redirect(`/betBoard/${user._id}`);
    }
    res.redirect(`/betBoard/${user._id}`);
});
module.exports = router;

async function betLogic(betId, userPosted) {
    const updatedBet = await Bets.findById(betId);
    if (!updatedBet || updatedBet.betResolved) return;


    let endPrice = await fetchCoinPrice(updatedBet);

        let winner;
      
        if (
            updatedBet.betType === "up" &&
            endPrice > updatedBet.betStartPrice
        ) {
            winner = userPosted;
        } else if (
            updatedBet.betType === "down" &&
            endPrice < updatedBet.betStartPrice
        ) {
            winner = userPosted;
        } else {
            winner = updatedBet.betAcceptedBy;
        }
            
            const winningUser = await User.findById(winner);
            winningUser.tokens += updatedBet.wager * 2; 
            await winningUser.save();
            updatedBet.betResolved = true;
            updatedBet.betInProgress = false;
            updatedBet.betEndPrice = endPrice;
            updatedBet.betWinner = winner;
            updatedBet.betEndTime = Date.now();
            await updatedBet.save();

            console.log(
                `Bet ${updatedBet._id} resolved. Winner: ${winner || "No one"}`
            );
   
}

async function fetchCoinPrice(updatedBet) {
    let coin = await CoinPriceHistory.findOne({ symbol: updatedBet.coinId });
    let coinId = coin.coinId;

    const url = "https://api.coingecko.com/api/v3/simple/price";
    const params = {
        ids: coinId,
        vs_currencies: "usd",
    };

    const maxRetries = 5;
    let attempts = 0;

    const tryFetch = async () => {
        attempts++;
        try {
            const endResponse = await axios.get(url, { params });
            const endPrice = endResponse.data[coinId]?.usd;

            if (!endPrice) {
                throw new Error("Price not found");
            }

            return endPrice;
        } catch (error) {
            if (attempts < maxRetries) {
                console.error(
                    `Attempt ${attempts} failed, retrying in 10 seconds...`
                );

                await new Promise((resolve) => setTimeout(resolve, 30000));
                return tryFetch();
            } else {
                console.error(
                    "Max retries reached. Could not fetch the price.",
                    error
                );
                res.redirect(`/`);
            }
        }
    };

    return tryFetch();
}
