const express = require("express");
const axios = require("axios");
const Bets = require("../models/bets");
const User = require("../models/user");
const isUserSignedIn = require("../middleware/isUserSignedIn");
const router = express.Router();


router.get("/", isUserSignedIn, async function (req, res) {
    const user = req.session.user;
    const userInDB = await User.findById(user._id);
    const bets = await Bets.find()
        .populate("userId", "username")  
        .populate("betAcceptedBy", "username"); 
    user.tokens = userInDB.tokens;
    res.render("betBoard/index.ejs", { user, bets });
});

router.get("/newBet", isUserSignedIn, async function (req, res) {
    const user = req.session.user;
    res.render("betBoard/newBet.ejs", { user });
});

router.get("/acceptBet/:betId", isUserSignedIn, async function (req, res) {
    const user = req.session.user;
    let betId = req.params.betId;
    let bet = await Bets.findById(betId).populate("userId", "username");
    res.render("betBoard/acceptBet.ejs", { user, bet });
});

router.post("/", isUserSignedIn, async function (req, res) {
    const user = req.session.user;
    const wager = req.body.wager;

    if (user.tokens < wager) {
        return res.send("Not Enough Tokens!");
    } else {
        await Bets.create({
            ...req.body,
            userId: user._id,
            betPostTime: new Date(),
            betResolved: false,
        });
        res.redirect(`/betBoard/${user._id}`);
    }
});

router.post("/acceptBet/:betId", async function (req, res) {
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
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: coinId,
                    vs_currencies: "usd",
                },
            }
        );
        const startPrice = response.data[coinId]?.usd;

        user.tokens -= wager;
        userPosted.tokens -= wager;
        bet.betInProgress = true;
        bet.betAcceptedBy = userSession._id;
        console.log(bet.betAcceptedBy)
        bet.betStartPrice = startPrice;
        bet.betStartTime = Date.now();
        await user.save();
        await userPosted.save();
        await bet.save();
        console.log("Starting bet Timer");

        setTimeout(async () => {
            try {
                await betLogic(bet._id, userPosted);
            } catch (error) {
                console.error("Error in bet timer:", error);
            }
        }, bet.betLength * 60 * 1000);

        res.redirect(`/betBoard/${user._id}`);
    }
});
router.delete("/:betId", async function(req,res) {
    const user = req.session.user;
    try{
       await Bets.findByIdAndDelete(req.params.betId);
    
    } catch (error){
        console.log(error)
        res.redirect(`/betBoard/${user._id}`);
    }
    res.redirect(`/betBoard/${user._id}`);
    
})
module.exports = router;

async function betLogic(betId, userPosted) {
    const updatedBet = await Bets.findById(betId);
    if (!updatedBet || updatedBet.betResolved) return;

    const endResponse = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
            params: { ids: updatedBet.coinId, vs_currencies: "usd" },
        }
    );

    const endPrice = endResponse.data[updatedBet.coinId]?.usd;
    if (!endPrice) {
        console.error("Cannot fetch end price");
        return;
    }

    let winner;
    if (updatedBet.betType === "up" && endPrice > updatedBet.betStartPrice) {
        winner = userPosted;
    } else if (
        updatedBet.betType === "down" &&
        endPrice < updatedBet.betStartPrice
    ) {
        winner = userPosted;
    } else {
        winner = updatedBet.betAcceptedBy;
    }

    if (winner && winner._id) {
        winner = winner._id.toString();
        const winningUser = await User.findById(winner);
        winningUser.tokens += updatedBet.wager * 2; // Double the wagered amount
        await winningUser.save();
    }
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
