const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    favorites: [{ type: String }],
    tokens: { type: Number, default: 1000 },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
