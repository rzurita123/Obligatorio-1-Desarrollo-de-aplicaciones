const mongoose = require("mongoose");
const loyaltyAccountSchema = require("./schemas/loyalty-account.schema");

const LoyaltyAccount = mongoose.model("LoyaltyAccount", loyaltyAccountSchema);

module.exports = LoyaltyAccount;
