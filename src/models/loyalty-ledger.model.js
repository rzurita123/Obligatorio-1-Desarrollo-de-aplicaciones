const mongoose = require("mongoose");
const loyaltyLedgerSchema = require("./schemas/loyalty-ledger.schema");

const LoyaltyLedger = mongoose.model("LoyaltyLedger", loyaltyLedgerSchema);

module.exports = LoyaltyLedger;
