const mongoose = require("mongoose");
const businessInterestSchema = require("./schemas/business-interest.schema");

const BusinessInterest = mongoose.model("BusinessInterest", businessInterestSchema);

module.exports = BusinessInterest;
