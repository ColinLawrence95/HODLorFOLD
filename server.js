const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const port = process.env.PORT ? process.env.PORT : "3000";
const authController = require("./controllers/auth.js");
const dashboardController = require("./controllers/dashboard.js");
const betBoardController = require("./controllers/betBoard.js");
const Bets = require("./models/bets.js");
const fetchCryptoPrices = require("./cronJobs/fetchPrice.js")

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("connected", function () {
    console.log(`Connected to MONGODB ${mongoose.connection.name}`);
});
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.get("/", async function (req, res) {
    const topBets = await Bets.find({ betPostTime: { $exists: true }, betInProgress: false, betResolved: false }).populate("userId", "username");
    res.render("index.ejs", {
        user: req.session.user,
        topBets: topBets,
        whatPage: "home",
    });
});

app.use("/dashboard/:userId", dashboardController);
app.use("/auth", authController);
app.use("/betBoard/:userId", betBoardController)

app.listen(port, () => {
    console.log(`The express app is ready on port ${port}!`);
});
