const mongoose = require("mongoose");
const businessSchema = require("./schemas/business.schema");

const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
