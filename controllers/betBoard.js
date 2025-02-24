const express = require("express");
const axios = require("axios");
const coinPriceHistory = require("../models/coinPriceHistory");
const Bets = require("../models/bets");
const User = require("../models/user");
const router = express.Router();

setInterval(async () => {
    const THIRTY_MINUTES = 30 * 60 * 1000; 
    const cutoffTime = Date.now() - THIRTY_MINUTES;
    
    try {
        const result = await Bets.deleteMany({
            inProgress: false,  // Only delete bets that haven't been accepted
            betPostTime: { $lt: cutoffTime } // Bets older than 30 mins
        });
        console.log(`Deleted ${result.deletedCount} expired bets.`);
    } catch (err) {
        console.error("Error deleting expired bets:", err);
    }
}, 1 * 60 * 1000); // Runs every 1 minutes

router.get("/", async function (req, res) {
    const user = req.session.user;
    const bets = await Bets.find().populate("userId", "username");
    if (!user) {
        res.redirect("/auth/sign-in");
    }
    res.render("betBoard/index.ejs", { user, bets });
});
router.get("/newBet", async function (req, res) {
    const user = req.session.user;
    res.render("betBoard/newBet.ejs", { user });
});
router.get("/acceptBet/:betId", async function (req, res) {
    const user = req.session.user;
    let betId = req.params.betId;
    let bet = await Bets.findById(betId).populate("userId", "username");
    res.render("betBoard/acceptBet.ejs", { user, bet });
});
router.post("/", async function (req, res) {
    const user = req.session.user;
    await Bets.create({
        ...req.body,
        userId: user._id,
        betPostTime: new Date()
    });
    res.redirect(`/betBoard/${user._id}`);
});
router.post("/acceptBet/:betId", async function (req, res) {
    const userSession = req.session.user;
    const user = await User.findById(userSession._id);
    const betId = req.params.betId;
    const bet = await Bets.findById(betId).populate("userId");
    const wager = bet.wager;
    const userPosted = await User.findById(bet.userId._id);
    const coidId = bet.coidId;
    const betLength = bet.betLength;
    


    user.tokens -= wager;
    userPosted.tokens -= wager;
    bet.inProgress = true;
    bet.acceptedBy = userSession._id;

    await user.save();
    await userPosted.save();
    await bet.save();

    req.session.user.tokens = user.tokens;
    res.redirect(`/betBoard/${user._id}`);
});
module.exports = router;
