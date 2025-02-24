const express = require("express");
const axios = require("axios");
const coinPriceHistory = require("../models/coinPriceHistory");
const Bets = require("../models/bets");
const router = express.Router();

router.get("/", async function (req, res) {
    const user = req.session.user;
    let bets = await Bets.find().populate("userId", "username"); 
    if (!user) {
        res.redirect("/auth/sign-in");
    }
    res.render("betBoard/index.ejs", {user, bets});
});
router.get("/newBet", async function (req, res) {
    const user = req.session.user;
    res.render("betBoard/newBet.ejs", {user});

    });
router.post("/", async function (req,res){
    const user = req.session.user;
    await Bets.create({
        ...req.body,
        userId: user._id,
        });
    res.redirect(`/betBoard/${user._id}`);
});
module.exports = router;
